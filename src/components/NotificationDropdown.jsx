import { useState, useEffect, useRef } from "react";
import NotificationsIcon from "@mui/icons-material/Notifications";
import Badge from "@mui/material/Badge";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { AnimatePresence, motion } from "framer-motion";

const _ = motion; // suppress unused var warning

export default function NotificationDropdown({ notifications, onRead }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close kalau klik di luar dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    console.log("🔔 Notifications props diterima:", notifications);
  }, [notifications]);

  const safeNotifications = Array.isArray(notifications) ? notifications : [];
  const unreadCount = safeNotifications.filter((n) => !n.read_at).length;

  const handleMarkAsRead = (id) => {
    onRead(id);
  };

  const handleMarkAllAsRead = () => {
    safeNotifications.forEach((notif) => {
      if (!notif.read_at) {
        onRead(notif.id);
      }
    });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Tombol Lonceng */}
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50"
      >
        <Badge
          badgeContent={unreadCount}
          color="error"
          classes={{
            badge: "bg-red-500 text-white font-semibold",
          }}
        >
          {unreadCount > 0 ? (
            <NotificationsIcon className="text-gray-700 w-6 h-6" />
          ) : (
            <NotificationsNoneIcon className="text-gray-500 w-6 h-6" />
          )}
        </Badge>
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-3 w-96 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-primary-50 to-primary-100">
              <h3 className="font-semibold text-gray-800 text-lg">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
                >
                  Mark all as read
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {safeNotifications.length === 0 ? (
                <div className="p-8 text-center">
                  <NotificationsNoneIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No notifications yet</p>
                  <p className="text-xs text-gray-400 mt-1">
                    We'll notify you when something important happens
                  </p>
                </div>
              ) : (
                safeNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`relative group ${
                      !notif.read_at
                        ? "bg-blue-50 border-l-4 border-blue-500"
                        : "bg-white hover:bg-gray-50"
                    }`}
                  >
                    <button
                      onClick={() => handleMarkAsRead(notif.id)}
                      className="block w-full text-left p-4 transition-all duration-200"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {notif.data?.title ||
                              notif.message ||
                              "PHC Validation Requested"}
                          </p>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {notif.data?.message ||
                              notif.message ||
                              "New notification"}
                          </p>
                          <p className="text-xs text-gray-400 mt-2">
                            {notif.created_at
                              ? new Date(notif.created_at).toLocaleString()
                              : "Just now"}
                          </p>
                        </div>
                        {!notif.read_at && (
                          <div className="ml-3 flex-shrink-0">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          </div>
                        )}
                      </div>
                    </button>

                    {/* Mark as read button on hover */}
                    {!notif.read_at && (
                      <button
                        onClick={() => handleMarkAsRead(notif.id)}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 rounded-full hover:bg-gray-200"
                      >
                        <CheckCircleIcon className="w-4 h-4 text-green-600" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {safeNotifications.length > 0 && (
              <div className="p-3 border-t border-gray-100 bg-gray-50">
                <button className="w-full text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors text-center">
                  View All Notifications
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
