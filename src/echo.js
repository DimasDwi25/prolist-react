import Echo from "laravel-echo";
import Pusher from "pusher-js";
import { getToken } from "./utils/storage";

import "handsontable/styles/handsontable.min.css";
import "handsontable/styles/ht-theme-main.min.css";

window.Pusher = Pusher;

window.Echo = new Echo({
  broadcaster: "pusher",
  key: import.meta.env.VITE_PUSHER_APP_KEY,
  cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER,
  forceTLS: true, // gunakan TLS untuk production
  enabledTransports: ["ws", "wss"],
  // penting 👉 arahkan authEndpoint ke Laravel, bukan ke React
  authEndpoint: "http://localhost:8000/api/broadcasting/auth",
  auth: {
    headers: {
      Authorization: `Bearer ${getToken()}`, // gunakan getToken() dari storage.js
      "X-CSRF-TOKEN": document
        .querySelector('meta[name="csrf-token"]')
        ?.getAttribute("content"),
    },
  },
});

export default window.Echo;
