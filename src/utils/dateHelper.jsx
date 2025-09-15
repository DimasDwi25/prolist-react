// src/utils/dateHelpers.js

// Hitung minggu keberapa dalam tahun
export function getWeekOfYear(date) {
  const target = new Date(date);
  const firstDay = new Date(target.getFullYear(), 0, 1);
  const pastDays = (target - firstDay) / 86400000; // ms → hari
  return Math.ceil((pastDays + firstDay.getDay() + 1) / 7);
}

// Konversi angka → Romawi
export function convertToRoman(num) {
  const romans = [
    ["M", 1000],
    ["CM", 900],
    ["D", 500],
    ["CD", 400],
    ["C", 100],
    ["XC", 90],
    ["L", 50],
    ["XL", 40],
    ["X", 10],
    ["IX", 9],
    ["V", 5],
    ["IV", 4],
    ["I", 1],
  ];

  let result = "";
  for (let [letter, value] of romans) {
    while (num >= value) {
      result += letter;
      num -= value;
    }
  }
  return result;
}
