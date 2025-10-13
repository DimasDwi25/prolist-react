// export function formatDate(value) {
//   if (!value) return "-";

//   // Jika Date object langsung
//   if (value instanceof Date && !isNaN(value)) {
//     const day = String(value.getDate()).padStart(2, "0");
//     const month = String(value.getMonth() + 1).padStart(2, "0");
//     const year = value.getFullYear();
//     return `${day}-${month}-${year}`;
//   }

//   // Normalisasi: hilangkan microsecond (.000000Z) → JS tidak suka format itu
//   if (typeof value === "string") {
//     value = value.replace(/\.\d{6}Z$/, "Z"); // ubah `2025-07-27T17:00:00.000000Z` jadi `2025-07-27T17:00:00Z`
//   }

//   // Cek apakah formatnya YYYY-MM-DD
//   if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
//     const [year, month, day] = value.split("-");
//     return `${day}-${month}-${year}`;
//   }

//   // Coba parse ISO atau format lain
//   const date = new Date(value);
//   if (isNaN(date)) return "-";

//   return `${String(date.getDate()).padStart(2, "0")}-${String(
//     date.getMonth() + 1
//   ).padStart(2, "0")}-${date.getFullYear()}`;
// }

import { parseISO, format } from "date-fns";

export function formatDate(value, fallback = "-") {
  if (!value) return fallback;

  try {
    let date;

    // Jika value sudah Date object
    if (value instanceof Date) {
      date = value;
    }
    // Jika string ISO atau string dari DB
    else if (typeof value === "string") {
      // Coba parse ISO
      date = parseISO(value);
      // Jika parseISO gagal (Invalid Date), fallback
      if (isNaN(date)) {
        // Coba parse dengan Date constructor
        date = new Date(value);
        if (isNaN(date)) return fallback;
      }
    }
    // Jika number / timestamp
    else if (typeof value === "number") {
      date = new Date(value);
    } else {
      return fallback;
    }

    return format(date, "yyyy-MM-dd");
  } catch {
    return fallback;
  }
}
