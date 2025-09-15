// utils/storage.js
import Cookies from "js-cookie";

/**
 * Simpan user + token
 */
export const setAuth = (user, token) => {
  Cookies.set("access_token", token, {
    expires: 7, // token berlaku 7 hari (atau sesuai expiry token)
    secure: false, // true kalau sudah pakai HTTPS
    sameSite: "Strict",
  });

  Cookies.set("user", JSON.stringify(user), {
    expires: 7,
    secure: false,
    sameSite: "Strict",
  });
};

/**
 * Ambil token
 */
export const getToken = () => {
  const token = Cookies.get("access_token");
  return token || null;
};

/**
 * Ambil user
 */
export const getUser = () => {
  const user = Cookies.get("user");
  return user ? JSON.parse(user) : null;
};

/**
 * Hapus semua auth
 */
export const clearAuth = () => {
  Cookies.remove("access_token");
  Cookies.remove("user");

  // brute-force hapus semua cookie
  document.cookie.split(";").forEach((c) => {
    document.cookie = c
      .replace(/^ +/, "")
      .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
  });
};
