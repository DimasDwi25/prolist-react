// import { useState, useEffect, useRef } from "react";
// import NotificationsIcon from "@mui/icons-material/Notifications";
// import Badge from "@mui/material/Badge";

// export default function NotificationDropdown({ notifications, onRead }) {
//   const [open, setOpen] = useState(false);
//   const dropdownRef = useRef(null);

//   // Close kalau klik di luar dropdown
//   useEffect(() => {
//     function handleClickOutside(event) {
//       if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
//         setOpen(false);
//       }
//     }
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);
//   useEffect(() => {
//     console.log("🔔 Notifications props diterima:", notifications);
//   }, [notifications]);
//   const unreadCount = notifications.filter((n) => !n.read_at).length;

//   return (
//     <div className="relative" ref={dropdownRef}>
//       {/* Tombol Lonceng */}
//       <button
//         onClick={() => setOpen(!open)}
//         className="p-2 rounded hover:bg-gray-100 transition relative"
//       >
//         <Badge badgeContent={unreadCount} color="error">
//           <NotificationsIcon className="text-gray-700" />
//         </Badge>
//       </button>

//       {/* Dropdown */}
//       {open && (
//         <div className="absolute right-0 mt-2 w-80 bg-white border rounded-lg shadow-lg z-50">
//           <div className="p-3 border-b font-semibold text-gray-700">
//             Notifications
//           </div>
//           <div className="max-h-72 overflow-y-auto">
//             {notifications.length === 0 ? (
//               <p className="p-3 text-sm text-gray-500 text-center">
//                 No notifications
//               </p>
//             ) : (
//               notifications.map((notif) => (
//                 <button
//                   key={notif.id}
//                   onClick={() => onRead(notif.id)}
//                   className={`block w-full text-left px-4 py-3 text-sm border-b last:border-none transition ${
//                     notif.read_at
//                       ? "bg-white hover:bg-gray-50 text-gray-600"
//                       : "bg-blue-50 hover:bg-blue-100 text-gray-800"
//                   }`}
//                 >
//                   {notif.data.message || notif.data}
//                   <div className="text-xs text-gray-400 mt-1">
//                     {new Date(notif.created_at).toLocaleString()}
//                   </div>
//                 </button>
//               ))
//             )}
//           </div>
//           <div className="p-2 text-center border-t">
//             <button className="text-sm text-primary-600 hover:underline">
//               View All
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
