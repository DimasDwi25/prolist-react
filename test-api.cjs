// Test API endpoints untuk notifikasi
// Jalankan dengan: node test-api.js

const axios = require("axios");

// Konfigurasi
const BASE_URL = "http://localhost:8000/api";
const TOKEN = process.env.TOKEN || "your-jwt-token-here"; // Ganti dengan token yang valid

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    Authorization: `Bearer ${TOKEN}`,
    "Content-Type": "application/json",
  },
});

// Test functions
async function testUserEndpoint() {
  try {
    console.log("🔍 Testing /api/user endpoint...");
    const response = await api.get("/user");
    console.log("✅ User endpoint OK:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "❌ User endpoint failed:",
      error.response?.data || error.message
    );
    return null;
  }
}

async function testNotificationsEndpoint() {
  try {
    console.log("🔍 Testing /api/notifications endpoint...");
    const response = await api.get("/notifications");
    console.log("✅ Notifications endpoint OK:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "❌ Notifications endpoint failed:",
      error.response?.data || error.message
    );
    return null;
  }
}

async function testBroadcastingAuth() {
  try {
    console.log("🔍 Testing broadcasting auth endpoint...");
    const response = await api.post("/broadcasting/auth", {
      channel_name: "private-App.Models.User.1", // Ganti dengan user ID yang valid
      socket_id: "test-socket-id",
    });
    console.log("✅ Broadcasting auth OK:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "❌ Broadcasting auth failed:",
      error.response?.data || error.message
    );
    return null;
  }
}

async function testSendNotification(userId) {
  try {
    console.log("📤 Testing send notification...");
    const response = await api.post("/test-notification", {
      message: "Test notification from API tester",
      user_id: userId,
    });
    console.log("✅ Send notification OK:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "❌ Send notification failed:",
      error.response?.data || error.message
    );
    return null;
  }
}

async function testPHCCreated() {
  try {
    console.log("📤 Testing PHC created event...");
    const response = await api.post("/test-phc-created", {
      phc_id: 1,
      project_name: "Test Project",
      user_id: 1, // Ganti dengan user ID yang valid
    });
    console.log("✅ PHC created event OK:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "❌ PHC created event failed:",
      error.response?.data || error.message
    );
    return null;
  }
}

// Main test function
async function runTests() {
  console.log("🚀 Starting API tests...\n");

  // Test 1: User endpoint
  const user = await testUserEndpoint();
  console.log("");

  // Test 2: Notifications endpoint
  await testNotificationsEndpoint();
  console.log("");

  // Test 3: Broadcasting auth
  await testBroadcastingAuth();
  console.log("");

  if (user && user.id) {
    // Test 4: Send test notification
    await testSendNotification(user.id);
    console.log("");

    // Test 5: Test PHC created event
    await testPHCCreated();
    console.log("");
  }

  console.log("✅ All API tests completed!");
}

// Export for use in other files
module.exports = {
  testUserEndpoint,
  testNotificationsEndpoint,
  testBroadcastingAuth,
  testSendNotification,
  testPHCCreated,
  runTests,
};

// Run tests if called directly
if (require.main === module) {
  runTests().catch(console.error);
}
