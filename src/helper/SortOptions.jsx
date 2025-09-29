export function sortOptions(options, key = "label") {
  if (!Array.isArray(options)) return [];

  return [...options].sort((a, b) => {
    const valA = typeof a === "string" ? a : a[key];
    const valB = typeof b === "string" ? b : b[key];
    return valA.localeCompare(valB, "en", { sensitivity: "base" });
  });
}
