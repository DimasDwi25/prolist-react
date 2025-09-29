// Fungsi reusable untuk filtering array of objects berdasarkan searchTerm
export function filterBySearch(data, searchTerm, keys = []) {
  if (!searchTerm) return data;

  const term = searchTerm.toLowerCase();

  return data.filter((item) => {
    // jika ada keys spesifik, hanya cari di keys tsb
    if (keys.length > 0) {
      return keys.some((key) => {
        const val = item[key];
        return val && String(val).toLowerCase().includes(term);
      });
    }

    // kalau tidak ada keys, cek semua values
    return Object.values(item).join(" ").toLowerCase().includes(term);
  });
}
