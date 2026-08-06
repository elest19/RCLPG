export function formatProductMixLabel(item) {
  const weightValue = item?.weightClass ?? item?.weight_class;
  const brandValue = item?.brand;

  const weightLabel =
    weightValue != null && weightValue !== ""
      ? `${Number(weightValue)}kg`
      : "";

  if (brandValue && weightLabel) {
    return `${brandValue} - ${weightLabel}`;
  }

  return brandValue || weightLabel || "Unknown mix";
}
