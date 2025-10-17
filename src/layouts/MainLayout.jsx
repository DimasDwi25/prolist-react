import { useState, useEffect } from "react";
import { FullScreen, useFullScreenHandle } from "react-full-screen";
import toast, { Toaster } from "react-hot-toast";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { getUser, getToken } from "../utils/storage";
import api from "../api/api";

export default function MainLayout({ children }) {
  const user = getUser();
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
  const fullScreenHandle = useFullScreenHandle();

  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!user) return;

    // Ambil notifikasi lama
    const token = getToken();
    if (!token) return;

    api
      .get("/notifications", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        console.log("📥 Notifikasi lama:", res.data);
        setNotifications(res.data.notifications || []);
      })
      .catch((err) => {
        console.error("❌ Error fetch notifikasi:", err);
      });

    // Listen realtime notifikasi baru
    if (window.Echo) {
      console.log("🔄 Setting up realtime notifications for user:", user.id);

      // Listen untuk broadcast notification (database + broadcast)
      const notificationChannel = window.Echo.private(
        `App.Models.User.${user.id}`
      ).notification((notif) => {
        console.log("🔔 Notifikasi baru via notification:", notif);
        setNotifications((prev) => [notif, ...prev]);

        // Tampilkan toast notification
        toast.success(notif.message || "Notifikasi baru!", {
          duration: 5000,
          position: "top-right",
        });
      });

      // Listen untuk custom event PHC created
      const phcChannel = window.Echo.private(
        `phc.notifications.${user.id}`
      ).listen(".phc.created", (e) => {
        console.log("🔔 PHC baru dibuat:", e);
        // Update state notifikasi tanpa reload
        setNotifications((prev) => [e, ...prev]);

        // Tampilkan toast notification untuk PHC
        toast.success("PHC baru telah dibuat!", {
          duration: 5000,
          position: "top-right",
        });
      });

      // Cleanup function untuk useEffect
      return () => {
        notificationChannel.stopListening("notification");
        phcChannel.stopListening(".phc.created");
      };
    } else {
      console.warn("⚠️ Echo tidak tersedia, realtime notifications disabled");
    }
  }, []); // kosong, supaya hanya jalan sekali

  const handleReadNotification = async (id) => {
    await api.post(`/notifications/${id}/read`);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read_at: new Date() } : n))
    );
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">You are not logged in</p>
      </div>
    );
  }

  return (
    <FullScreen handle={fullScreenHandle}>
      <div className="h-full min-h-screen flex flex-col bg-gray-100 font-sans">
        <div className="flex flex-1 overflow-hidden">
          <Sidebar role={user.role?.name} sidebarOpen={sidebarOpen} />

          {/* Overlay untuk mobile */}
          {sidebarOpen === false && window.innerWidth < 768 && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
              onClick={() => setSidebarOpen(false)}
            ></div>
          )}

          <div
            className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${
              sidebarOpen ? "md:ml-52" : "md:ml-0"
            }`}
          >
            {!fullScreenHandle.active && (
              <Header
                user={user}
                toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                fullScreenHandle={fullScreenHandle}
                notifications={notifications}
                onReadNotification={handleReadNotification}
              />
            )}

            <main className="flex-1 overflow-y-auto p-3 md:p-4">
              {children}
            </main>
          </div>
        </div>
      </div>
      <Toaster />
    </FullScreen>
  );
}
