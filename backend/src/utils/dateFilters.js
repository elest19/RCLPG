import {
  SQL_TODAY,
  SQL_WEEK_START,
  SQL_MONTH_START,
  SQL_YEAR_START,
  getManilaYear,
  sqlManilaDate,
} from "./timezone.js";

export function buildReportDateFilter(quickFilter, startDate, endDate, dateColumn = 'sr.date_created') {
  const clauses = [];
  const params = [];
  let idx = 1;

  const manilaDate = sqlManilaDate(dateColumn);
  const columnExpr = dateColumn === 'e.date' ? 'e.date' : manilaDate;

  const addRangeClause = (startExpr, endExpr) => {
    clauses.push(`${columnExpr} BETWEEN ${startExpr} AND ${endExpr}`);
  };

  if (quickFilter === 'today') {
    addRangeClause(SQL_TODAY, SQL_TODAY);
  } else if (quickFilter === 'week') {
    addRangeClause(
      `DATE_TRUNC('week', ${SQL_TODAY}::timestamp)::date`,
      `(DATE_TRUNC('week', ${SQL_TODAY}::timestamp) + INTERVAL '6 days')::date`,
    );
  } else if (quickFilter === 'month') {
    addRangeClause(
      `DATE_TRUNC('month', ${SQL_TODAY}::timestamp)::date`,
      `(DATE_TRUNC('month', ${SQL_TODAY}::timestamp) + INTERVAL '1 month - 1 day')::date`,
    );
  } else if (quickFilter === 'year') {
    addRangeClause(
      `DATE_TRUNC('year', ${SQL_TODAY}::timestamp)::date`,
      `(DATE_TRUNC('year', ${SQL_TODAY}::timestamp) + INTERVAL '1 year - 1 day')::date`,
    );
  } else if (quickFilter === 'first_half') {
    const yearStart = getManilaYear();
    addRangeClause(`'${yearStart}-01-01'`, `'${yearStart}-06-30'`);
  } else if (quickFilter === 'second_half') {
    const yearStart = getManilaYear();
    addRangeClause(`'${yearStart}-07-01'`, `'${yearStart}-12-31'`);
  } else if (startDate && endDate) {
    clauses.push(`${columnExpr} BETWEEN $${idx++} AND $${idx++}`);
    params.push(startDate, endDate);
  }

  return {
    where: clauses.length ? `AND ${clauses.join(' AND ')}` : '',
    params,
    nextIdx: idx,
  };
}

export function buildExportDateFilter(period, startDate, endDate, dateColumn = 'sr.date_created') {
  const clauses = [];
  const params = [];
  let idx = 1;

  const manilaDate = sqlManilaDate(dateColumn);
  const columnExpr = dateColumn === 'e.date' ? 'e.date' : manilaDate;

  const addRangeClause = (startExpr, endExpr) => {
    clauses.push(`${columnExpr} BETWEEN ${startExpr} AND ${endExpr}`);
  };

  if (period === 'today' || period === 'current_day') {
    addRangeClause(SQL_TODAY, SQL_TODAY);
  } else if (period === 'daily' && startDate) {
    clauses.push(`${columnExpr} = $${idx++}`);
    params.push(startDate);
  } else if (period === 'monthly') {
    if (startDate) {
      clauses.push(`DATE_TRUNC('month', ${columnExpr}) = DATE_TRUNC('month', $${idx++}::date)`);
      params.push(startDate);
    } else {
      addRangeClause(
        `DATE_TRUNC('month', ${SQL_TODAY}::timestamp)::date`,
        `(DATE_TRUNC('month', ${SQL_TODAY}::timestamp) + INTERVAL '1 month - 1 day')::date`,
      );
    }
  } else if (period === 'weekly') {
    if (startDate) {
      addRangeClause(
        `DATE_TRUNC('week', $${idx++}::date)::date`,
        `(DATE_TRUNC('week', $${idx++}::date) + INTERVAL '6 days')::date`,
      );
      params.push(startDate, startDate);
    } else {
      addRangeClause(
        `DATE_TRUNC('week', ${SQL_TODAY}::timestamp)::date`,
        `(DATE_TRUNC('week', ${SQL_TODAY}::timestamp) + INTERVAL '6 days')::date`,
      );
    }
  } else if ((period === 'first_half' || period === 'second_half')) {
    const year = startDate ? new Date(`${startDate}T12:00:00`).getFullYear() : getManilaYear();
    if (period === 'first_half') {
      addRangeClause(`'${year}-01-01'`, `'${year}-06-30'`);
    } else {
      addRangeClause(`'${year}-07-01'`, `'${year}-12-31'`);
    }
  } else if (period === 'yearly' && startDate) {
    clauses.push(`DATE_TRUNC('year', ${columnExpr}) = DATE_TRUNC('year', $${idx++}::date)`);
    params.push(startDate);
  } else if (period === 'custom' && startDate && endDate) {
    clauses.push(`${columnExpr} BETWEEN $${idx++} AND $${idx++}`);
    params.push(startDate, endDate);
  }

  return { where: clauses.length ? `AND ${clauses.join(' AND ')}` : '', params, nextIdx: idx };
}
