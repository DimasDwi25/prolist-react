import { useState, useEffect } from "react";
import { FullScreen, useFullScreenHandle } from "react-full-screen";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { getUser } from "../utils/storage";
import api from "../api/api";

export default function MainLayout({ children }) {
  const user = getUser();
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
  const fullScreenHandle = useFullScreenHandle();

  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!user) return;

    // Ambil notifikasi lama
    api
      .get("/notifications", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      .then((res) => {
        console.log("📥 Notifikasi lama:", res.data);
        setNotifications(res.data);
      })
      .catch((err) => {
        console.error("❌ Error fetch notifikasi:", err);
      });

    // Listen realtime notifikasi baru
    if (window.Echo) {
      window.Echo.private(`App.Models.User.${user.id}`).notification(
        (notif) => {
          console.log("🔔 Notifikasi baru:", notif);
          setNotifications((prev) => [notif, ...prev]);
        }
      );
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
            <Header
              user={user}
              toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
              fullScreenHandle={fullScreenHandle}
              notifications={notifications}
              onReadNotification={handleReadNotification}
            />

            <main className="flex-1 overflow-y-auto p-3 md:p-4">
              {children}
            </main>
          </div>
        </div>
      </div>
    </FullScreen>
  );
}
