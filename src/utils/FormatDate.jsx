// helpers/date.js
export function formatDate(value) {
  if (!value) return "-"; // jika null atau undefined
  const date = new Date(value);
  if (isNaN(date)) return "-"; // jika value bukan tanggal valid
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}
