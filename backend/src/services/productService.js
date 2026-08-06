import { query } from "../config/db.js";
import { AppError } from "../middleware/errorHandler.js";
import { computeHealthIndicator } from "../utils/constants.js";
import { ensureBrand } from "./brandService.js";

async function generateProductId() {
  const result = await query(
    `SELECT product_id FROM lpg_products ORDER BY product_id DESC LIMIT 1`,
  );
  const last = result.rows[0]?.product_id;
  const nextNum = last ? parseInt(last, 10) + 1 : 1;
  return String(nextNum).padStart(6, "0");
}

function buildStockTierClause(stockTier) {
  if (stockTier === "out") return `AND stock_quantity <= 0`;
  if (stockTier === "low")
    return `AND stock_quantity > 0 AND stock_quantity < 5`;
  if (stockTier === "good") return `AND stock_quantity > 5`;
  return "";
}

function matchesStockTier(product, stockTier) {
  const stockQuantity = Number(product.stock_quantity || 0);
  if (stockTier === "out") return stockQuantity <= 0;
  if (stockTier === "low") return stockQuantity > 0 && stockQuantity < 5;
  if (stockTier === "good") return stockQuantity > 5;
  return true;
}

function normalizeProduct(product) {
  return {
    ...product,
    weight_class: Number(product.weight_class),
    regular_retail: Number(product.regular_retail),
    wholesale_price: Number(product.wholesale_price),
    initial_price: Number(product.initial_price),
  };
}

function selectCanonicalInventoryProducts(products) {
  if (!products.length) return [];

  const groups = new Map();
  products.forEach((product) => {
    const key = `${product.brand}::${product.weight_class}::${product.status}`;
    const bucket = groups.get(key) || [];
    bucket.push(product);
    groups.set(key, bucket);
  });

  const canonicalProducts = [];

  groups.forEach((bucket) => {
    const sorted = [...bucket].sort((left, right) => {
      const leftDate = new Date(left.created_at || 0).getTime();
      const rightDate = new Date(right.created_at || 0).getTime();
      if (leftDate !== rightDate) return leftDate - rightDate;
      return String(left.product_id).localeCompare(String(right.product_id));
    });

    if (sorted.length <= 1) {
      canonicalProducts.push(sorted[0]);
      return;
    }

    let selectedProduct = null;
    for (const candidate of sorted) {
      if (Number(candidate.stock_quantity || 0) > 0) {
        selectedProduct = candidate;
        break;
      }
    }

    if (!selectedProduct) {
      selectedProduct = sorted[sorted.length - 1];
    }

    canonicalProducts.push(selectedProduct);
  });

  return canonicalProducts;
}

export async function listProducts({
  search = "",
  brand = "",
  condition = "",
  stockTier = "",
  includeArchived = false,
  showAllInstances = false,
} = {}) {
  const brandClause = brand ? `AND brand = $3` : "";
  const conditionClause =
    condition === "filled"
      ? `AND status = 'Filled Tank'`
      : condition === "empty"
        ? `AND status = 'Empty Cylinder'`
        : "";
  const archivedClause = includeArchived ? `AND is_archived = TRUE` : `AND is_archived = FALSE`;

  const params = [search, `%${search}%`];
  if (brand) params.push(brand);

  const result = await query(
    `SELECT product_id, brand, weight_class, status, stock_quantity,
            health_indicator, regular_retail, wholesale_price, initial_price,
            is_archived, archived_at, created_at, updated_at
     FROM lpg_products
     WHERE ($1 = '' OR brand ILIKE $2 OR CAST(weight_class AS text) ILIKE $2 OR status ILIKE $2)
       ${brandClause}
       ${conditionClause}
       ${archivedClause}
     ORDER BY created_at ASC, product_id ASC`,
    params,
  );

  // Depending on the caller, either return the canonical single product per
  // group (existing behavior) or return every inventory instance. The
  // Inventory Catalog UI requests `showAllInstances=true` to display every
  // active record for a Brand+Weight+Status combination.
  const sourceProducts = showAllInstances ? result.rows : selectCanonicalInventoryProducts(result.rows);

  const visibleProducts = sourceProducts.filter((product) => matchesStockTier(product, stockTier));

  return visibleProducts
    .slice()
    .sort((left, right) => {
      const brandCompare = String(left.brand).localeCompare(String(right.brand));
      if (brandCompare !== 0) return brandCompare;

      const weightCompare = Number(left.weight_class) - Number(right.weight_class);
      if (weightCompare !== 0) return weightCompare;

      const statusRank = left.status === "Filled Tank" ? -1 : 1;
      const otherStatusRank = right.status === "Filled Tank" ? -1 : 1;
      if (statusRank !== otherStatusRank) return statusRank - otherStatusRank;

      // Preserve creation order within identical brand/weight/status groups
      const leftDate = new Date(left.created_at || 0).getTime();
      const rightDate = new Date(right.created_at || 0).getTime();
      if (leftDate !== rightDate) return leftDate - rightDate;

      return String(left.product_id).localeCompare(String(right.product_id));
    })
    .map(normalizeProduct);
}

export async function getProductById(productId, client = null) {
  const runner = client ? client.query.bind(client) : query;
  const result = await runner(
    `SELECT * FROM lpg_products WHERE product_id = $1`,
    [productId],
  );
  return result.rows[0] || null;
}

export async function createProduct(data) {
  const health = computeHealthIndicator(data.stockQuantity);
  const productId = await generateProductId();
  // Registers the brand in the master brand list if it's new (or reuses the
  // canonical stored casing if it already exists), so every brand-selection
  // UI in the app stays in sync automatically.
  const brand = await ensureBrand(data.brand);

  const result = await query(
    `INSERT INTO lpg_products
      (product_id, brand, weight_class, status, stock_quantity, health_indicator,
       regular_retail, wholesale_price, initial_price, is_archived, archived_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, FALSE, NULL, NOW())
     RETURNING *`,
    [
      productId,
      brand,
      data.weightClass,
      data.status,
      data.stockQuantity,
      health,
      data.regularRetail,
      data.wholesalePrice,
      data.initialPrice ?? 0,
    ],
  );
  return result.rows[0];
}

export async function updateProduct(productId, data) {
  const existing = await getProductById(productId);
  if (!existing) throw new AppError("Product not found", 404);

  const stockQuantity = data.stockQuantity ?? existing.stock_quantity;
  const health = computeHealthIndicator(stockQuantity);
  const brand = data.brand ? await ensureBrand(data.brand) : null;

  const result = await query(
    `UPDATE lpg_products
     SET brand = COALESCE($2, brand),
         weight_class = COALESCE($3, weight_class),
         status = COALESCE($4, status),
         stock_quantity = $5,
         health_indicator = $6,
         regular_retail = COALESCE($7, regular_retail),
         wholesale_price = COALESCE($8, wholesale_price),
         initial_price = COALESCE($9, initial_price),
         updated_at = NOW()
     WHERE product_id = $1
     RETURNING *`,
    [
      productId,
      brand,
      data.weightClass,
      data.status,
      stockQuantity,
      health,
      data.regularRetail,
      data.wholesalePrice,
      data.initialPrice,
    ],
  );
  return result.rows[0];
}

export async function archiveProduct(productId) {
  const existing = await getProductById(productId);
  if (!existing) throw new AppError("Product not found", 404);

  const result = await query(
    `UPDATE lpg_products
     SET is_archived = TRUE,
         archived_at = NOW(),
         updated_at = NOW()
     WHERE product_id = $1
     RETURNING *`,
    [productId],
  );

  return result.rows[0];
}

export async function deleteProduct(productId) {
  const salesCheck = await query(
    `SELECT COUNT(*)::int AS count FROM sales_records WHERE product_id = $1`,
    [productId],
  );
  if (salesCheck.rows[0].count > 0) {
    throw new AppError(
      "Cannot delete product with existing sales records",
      400,
    );
  }

  const result = await query(
    `DELETE FROM lpg_products WHERE product_id = $1 RETURNING *`,
    [productId],
  );
  if (!result.rows[0]) throw new AppError("Product not found", 404);

  const deletedProduct = result.rows[0];
  if (deletedProduct?.brand) {
    const remainingBrand = await query(
      `SELECT 1 FROM lpg_products WHERE LOWER(brand) = LOWER($1) LIMIT 1`,
      [deletedProduct.brand],
    );

    if (!remainingBrand.rows[0]) {
      await query(`DELETE FROM brands WHERE LOWER(name) = LOWER($1)`, [deletedProduct.brand]);
    }
  }

  return deletedProduct;
}

export async function adjustStock(productId, delta, client) {
  const runner = client ? client.query.bind(client) : query;
  const product = await getProductById(productId, client);
  if (!product) throw new AppError("Product not found", 404);

  const newStock = Math.max(0, product.stock_quantity + delta);
  const health = computeHealthIndicator(newStock);

  const result = await runner(
    `UPDATE lpg_products
     SET stock_quantity = $2, health_indicator = $3, updated_at = NOW()
     WHERE product_id = $1
     RETURNING *`,
    [productId, newStock, health],
  );
  return result.rows[0];
}

export async function getWeeklyStockSummary() {
  const result = await query(
    `SELECT weight_class,
            SUM(CASE WHEN status = 'Filled Tank' THEN stock_quantity ELSE 0 END)::int AS filled_stock,
            SUM(CASE WHEN status = 'Empty Cylinder' THEN stock_quantity ELSE 0 END)::int AS empty_stock
     FROM lpg_products
     WHERE is_archived = FALSE
     GROUP BY weight_class
     ORDER BY weight_class ASC`,
  );
  return result.rows.map((row) => ({
    weight_class: row.weight_class,
    filled_stock: row.filled_stock,
    empty_stock: row.empty_stock,
    combined_volume: row.filled_stock + row.empty_stock,
  }));
}

export async function getLowStockProducts() {
  const result = await query(
    `SELECT product_id, brand, weight_class, status, stock_quantity, health_indicator,
            created_at
     FROM lpg_products
     WHERE is_archived = FALSE
     ORDER BY created_at ASC, product_id ASC`,
  );

  return selectCanonicalInventoryProducts(result.rows)
    .filter((product) => ["Low Stock", "Out of Stock"].includes(product.health_indicator))
    .sort((left, right) => {
      const healthRank = left.health_indicator === "Out of Stock" ? 0 : 1;
      const otherHealthRank = right.health_indicator === "Out of Stock" ? 0 : 1;
      if (healthRank !== otherHealthRank) return healthRank - otherHealthRank;

      const weightCompare = Number(left.weight_class) - Number(right.weight_class);
      if (weightCompare !== 0) return weightCompare;

      return String(left.brand).localeCompare(String(right.brand));
    })
    .map(normalizeProduct);
}

export async function getInventoryMetrics() {
  const result = await query(
    `SELECT product_id, brand, weight_class, status, stock_quantity, created_at
     FROM lpg_products
     WHERE is_archived = FALSE
     ORDER BY created_at ASC, product_id ASC`,
  );

  const canonicalProducts = selectCanonicalInventoryProducts(result.rows);
  const totals = canonicalProducts.reduce(
    (summary, product) => {
      if (product.status === "Filled Tank") summary.total_filled += Number(product.stock_quantity || 0);
      if (product.status === "Empty Cylinder") summary.total_empty += Number(product.stock_quantity || 0);
      return summary;
    },
    { total_filled: 0, total_empty: 0 },
  );

  return totals;
}

export async function findEmptyProduct(brand, weightClass, client = null) {
  const runner = client ? client.query.bind(client) : query;
  const result = await runner(
    `SELECT * FROM lpg_products
     WHERE brand = $1 AND weight_class = $2 AND status = 'Empty Cylinder' AND is_archived = FALSE
     ORDER BY created_at ASC, product_id ASC`,
    [brand, weightClass],
  );
  return selectCanonicalInventoryProducts(result.rows)[0] || null;
}

export async function executeTankSwap(
  { filledProductId, emptyBrand, quantity },
  client,
) {
  const filled = await getProductById(filledProductId, client);
  if (!filled) throw new AppError("Product not found", 404);
  if (filled.status !== "Filled Tank") {
    throw new AppError("Sale product must be a filled tank", 400);
  }

  const empty = await findEmptyProduct(emptyBrand, filled.weight_class, client);
  if (!empty) {
    throw new AppError(
      `No empty cylinder inventory found for ${emptyBrand} ${filled.weight_class}kg`,
      400,
    );
  }

  if (quantity > filled.stock_quantity) {
    throw new AppError(
      `Insufficient filled stock. Available: ${filled.stock_quantity}, requested: ${quantity}`,
      400,
    );
  }

  await adjustStock(filledProductId, -quantity, client);
  await adjustStock(empty.product_id, quantity, client);

  return { filled, empty };
}

export async function reverseTankSwap(
  { filledProductId, emptyBrand, quantity },
  client,
) {
  const filled = await getProductById(filledProductId, client);
  if (!filled) throw new AppError("Product not found", 404);

  const empty = await findEmptyProduct(emptyBrand, filled.weight_class, client);
  if (!empty) {
    throw new AppError(
      `Cannot reverse swap: no empty cylinder record for ${emptyBrand} ${filled.weight_class}kg`,
      400,
    );
  }

  await adjustStock(filledProductId, quantity, client);
  await adjustStock(empty.product_id, -quantity, client);

  return { filled, empty };
}

export async function getBrandInventoryOverview() {
  const result = await query(
    `SELECT brand, weight_class, status, stock_quantity, created_at
     FROM lpg_products
     WHERE is_archived = FALSE
     ORDER BY brand ASC, created_at ASC, product_id ASC`,
  );

  const canonicalProducts = selectCanonicalInventoryProducts(result.rows);
  const grouped = canonicalProducts.reduce((acc, product) => {
    if (!acc[product.brand]) {
      acc[product.brand] = { brand: product.brand, total_filled: 0, total_empty: 0 };
    }

    if (product.status === "Filled Tank") acc[product.brand].total_filled += Number(product.stock_quantity || 0);
    if (product.status === "Empty Cylinder") acc[product.brand].total_empty += Number(product.stock_quantity || 0);

    return acc;
  }, {});

  return Object.values(grouped)
    .sort((left, right) => String(left.brand).localeCompare(String(right.brand)))
    .map((row) => ({
      brand: row.brand,
      total_filled: row.total_filled,
      total_empty: row.total_empty,
      total_combined: row.total_filled + row.total_empty,
    }));
}
