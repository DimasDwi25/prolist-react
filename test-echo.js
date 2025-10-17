// Test koneksi Echo dan Pusher
// Jalankan di browser console atau sebagai script terpisah

import Echo from "laravel-echo";
import Pusher from "pusher-js";
import { getToken } from "./utils/storage";

// 1. Test koneksi Pusher
console.log("🔄 Testing Pusher connection...");

const pusher = new Pusher(import.meta.env.VITE_PUSHER_APP_KEY, {
  cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER,
  forceTLS: true,
  enabledTransports: ["ws", "wss"],
});

// Test koneksi Pusher
pusher.connection.bind("connected", () => {
  console.log("✅ Pusher connected successfully!");
});

pusher.connection.bind("error", (error) => {
  console.error("❌ Pusher connection error:", error);
});

pusher.connection.bind("disconnected", () => {
  console.log("⚠️ Pusher disconnected");
});

// 2. Test Echo setup
console.log("🔄 Testing Echo setup...");

window.Pusher = Pusher;

const echo = new Echo({
  broadcaster: "pusher",
  key: import.meta.env.VITE_PUSHER_APP_KEY,
  cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER,
  forceTLS: true,
  enabledTransports: ["ws", "wss"],
  authEndpoint: "http://localhost:8000/api/broadcasting/auth",
  auth: {
    headers: {
      Authorization: `Bearer ${getToken()}`,
      "X-CSRF-TOKEN": document
        .querySelector('meta[name="csrf-token"]')
        ?.getAttribute("content"),
    },
  },
});

// 3. Test channel subscription
const user = JSON.parse(localStorage.getItem("user"));
if (user && user.id) {
  console.log(`🔄 Testing channel subscription for user ${user.id}...`);

  // Test private channel
  const privateChannel = echo.private(`App.Models.User.${user.id}`);
  console.log("📡 Private channel created:", privateChannel);

  // Test notification listening
  privateChannel.notification((notification) => {
    console.log("🔔 Notification received:", notification);
  });

  // Test custom event listening
  const phcChannel = echo.private(`phc.notifications.${user.id}`);
  phcChannel.listen(".phc.created", (e) => {
    console.log("🔔 PHC created event:", e);
  });

  console.log("✅ Echo channels subscribed successfully!");
} else {
  console.warn("⚠️ No user found in localStorage");
}

// 4. Test public channel (jika ada)
console.log("🔄 Testing public channel...");
const publicChannel = echo.channel("test-channel");
publicChannel.listen(".test-event", (e) => {
  console.log("📢 Public event received:", e);
});

// 5. Utility functions untuk manual testing
window.testEcho = {
  echo,
  pusher,
  sendTestNotification: () => {
    // Kirim test notification via API
    fetch("http://localhost:8000/api/test-notification", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Test notification from frontend",
        user_id: user.id,
      }),
    })
      .then((res) => res.json())
      .then((data) => console.log("📤 Test notification sent:", data))
      .catch((err) =>
        console.error("❌ Error sending test notification:", err)
      );
  },

  checkConnection: () => {
    console.log("🔍 Connection status:");
    console.log("- Pusher:", pusher.connection.state);
    console.log("- Echo available:", !!window.Echo);
  },
};

console.log("🎯 Test utilities available:");
console.log(
  "- window.testEcho.sendTestNotification() - Send test notification"
);
console.log("- window.testEcho.checkConnection() - Check connection status");
console.log("- window.Echo - Access Echo instance");
console.log("- window.Pusher - Access Pusher instance");

export default { echo, pusher };
