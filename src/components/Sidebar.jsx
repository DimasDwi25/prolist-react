import { useState } from "react";
import { Link } from "react-router-dom";
import {
  FaTachometerAlt,
  FaFileInvoice,
  FaTools,
  FaChartLine,
  FaUsers,
  FaTasks,
  FaChevronRight,
  FaCheckCircle,
} from "react-icons/fa";

const roleMapping = {
  super_admin: "admin",
  marketing_director: "marketing",
  "supervisor marketing": "marketing",
  manager_marketing: "marketing",
  sales_supervisor: "marketing",
  marketing_admin: "marketing",
  marketing_estimator: "marketing",
  engineering_director: "engineer",
  engineer: "manPower",
  "project controller": "engineer",
  "project manager": "engineer",
  warehouse: "suc",
  // tambahkan role engineer lainnya jika ada
};

// Menu per role dengan icon
const menuByRole = {
  admin: [
    {
      name: "Dashboard",
      icon: <FaTools />,
      submenu: [
        { name: "Admin Dashboard", path: "/admin", icon: <FaTachometerAlt /> },
        {
          name: "Marketing Dashboard",
          path: "/marketing",
          icon: <FaTachometerAlt />,
        },
        {
          name: "Engineer Dashboard",
          path: "/engineer",
          icon: <FaTachometerAlt />,
        },
        { name: "SUC Dashboard", path: "/suc", icon: <FaTachometerAlt /> },
      ],
    },
    {
      name: "Manajamen User",
      icon: <FaUsers />,
      submenu: [
        {
          name: "Department",
          path: "/department",
          icon: <FaUsers />,
        },
        { name: "Role", path: "/role", icon: <FaUsers /> },
        { name: "User", path: "/user", icon: <FaUsers /> },
      ],
    },
    {
      name: "Master Data",
      icon: <FaTools />,
      submenu: [
        { name: "Client", path: "/client", icon: <FaUsers /> },
        {
          name: "Categories Project",
          path: "/category-project",
          icon: <FaTasks />,
        },
        { name: "Status Project", path: "/status-project", icon: <FaTasks /> },
      ],
    },
    {
      name: "Reports",
      icon: <FaChartLine />,
      submenu: [
        {
          name: "Marketing Reports",
          path: "/marketing-report",
          icon: <FaChartLine />,
        },
        { name: "Sales Reports", path: "/sales-report", icon: <FaChartLine /> },
      ],
    },
    { name: "Quotation", path: "/quotation", icon: <FaFileInvoice /> },
    { name: "Projects", path: "/projects", icon: <FaTools /> },
    { name: "Work Order", path: "/work-order", icon: <FaFileInvoice /> },
    {
      name: "Material Request",
      icon: <FaTools />,
      submenu: [
        {
          name: "Material Request",
          path: "/material-request",
          icon: <FaTasks />,
        },
        { name: "Packing List", path: "/packing-list", icon: <FaTasks /> },
      ],
    },
    { name: "Approvall", path: "/approvall", icon: <FaCheckCircle /> },
  ],
  marketing: [
    { name: "Dashboard", path: "/marketing", icon: <FaTachometerAlt /> },
    {
      name: "Master Data",
      icon: <FaTools />,
      submenu: [
        { name: "Client", path: "/client", icon: <FaUsers /> },
        {
          name: "Categories Project",
          path: "/category-project",
          icon: <FaTasks />,
        },
        { name: "Status Project", path: "/status-project", icon: <FaTasks /> },
      ],
    },
    {
      name: "Reports",
      icon: <FaChartLine />,
      submenu: [
        {
          name: "Marketing Reports",
          path: "/marketing-report",
          icon: <FaChartLine />,
        },
        { name: "Sales Reports", path: "/sales-report", icon: <FaChartLine /> },
      ],
    },
    { name: "Quotation", path: "/quotation", icon: <FaFileInvoice /> },
    { name: "Projects", path: "/projects", icon: <FaTools /> },
    { name: "Approvall", path: "/approvall", icon: <FaCheckCircle /> },
  ],
  engineer: [
    {
      name: "Dashboard",
      path: "/engineer",
      icon: <FaTachometerAlt />,
    },
    {
      name: "Master Data",
      icon: <FaTools />,
      submenu: [
        {
          name: "Document",
          path: "/document",
          icon: <FaTasks />,
        },
        {
          name: "Purpose Work Order",
          path: "/purpose-work-order",
          icon: <FaTasks />,
        },
        {
          name: "Category Log",
          path: "/categorie-log",
          icon: <FaTasks />,
        },
        {
          name: "Categories Project",
          path: "/category-project",
          icon: <FaTasks />,
        },
        { name: "Status Project", path: "/status-project", icon: <FaTasks /> },
      ],
    },
    {
      name: "Material Request",
      icon: <FaTools />,
      submenu: [
        {
          name: "Material Request",
          path: "/material-request",
          icon: <FaTasks />,
        },
        { name: "Packing List", path: "/packing-list", icon: <FaTasks /> },
      ],
    },
    {
      name: "List Project Outstanding",
      path: "/outstanding-project",
      icon: <FaTasks />,
    },
    { name: "Work Order", path: "/work-order", icon: <FaFileInvoice /> },
    { name: "Projects", path: "/projects", icon: <FaTools /> },
    { name: "Approvall", path: "/approvall", icon: <FaCheckCircle /> },
  ],
  suc: [
    { name: "Dashboard", path: "/suc", icon: <FaTachometerAlt /> },
    {
      name: "Material Request",
      icon: <FaTools />,
      submenu: [
        {
          name: "Material Request",
          path: "/material-request",
          icon: <FaTasks />,
        },
        { name: "Packing List", path: "/packing-list", icon: <FaTasks /> },
      ],
    },
    { name: "Projects", path: "/projects", icon: <FaTools /> },
  ],
  manPower: [
    {
      name: "Dashboard",
      path: "/man-power",
      icon: <FaTachometerAlt />,
    },
    { name: "Work Order", path: "/work-order", icon: <FaFileInvoice /> },
    { name: "Projects", path: "/projects", icon: <FaTools /> },
    { name: "Tasks", path: "/tasks", icon: <FaTasks /> },
    { name: "Approvall", path: "/approvall", icon: <FaCheckCircle /> },
  ],
};

export default function Sidebar({ role, sidebarOpen }) {
  const [openSubmenu, setOpenSubmenu] = useState({});

  // Mapping role dari props
  const mappedRole = roleMapping[role] || role;
  const menu = menuByRole[mappedRole] || [];

  return (
    <div
      className={`fixed inset-y-0 left-0 bg-[#0074A8] text-white shadow-md z-30 transform transition-all duration-300 ease-in-out flex flex-col justify-between overflow-y-auto text-sm ${
        sidebarOpen ? "translate-x-0 md:w-52" : "-translate-x-full md:w-0"
      }`}
    >
      {/* Menu */}
      <nav className="mt-3 space-y-1 px-2">
        {menu.map((item, idx) => {
          const hasSubmenu = item.submenu?.length > 0;
          const isOpen = openSubmenu[idx];

          return (
            <div key={idx}>
              {hasSubmenu ? (
                <button
                  onClick={() =>
                    setOpenSubmenu((prev) => ({ ...prev, [idx]: !prev[idx] }))
                  }
                  className="flex items-center justify-between w-full px-3 py-2 rounded hover:bg-[#005f87] transition"
                >
                  <div className="flex items-center gap-2">
                    {item.icon} <span>{item.name}</span>
                  </div>

                  <FaChevronRight
                    className={`transition-transform duration-300 ${
                      isOpen ? "rotate-90" : ""
                    }`}
                  />
                </button>
              ) : (
                <Link
                  to={item.path}
                  className="flex items-center gap-2 px-3 py-2 rounded hover:bg-[#005f87] transition"
                >
                  {item.icon} <span>{item.name}</span>
                </Link>
              )}

              {hasSubmenu && isOpen && (
                <div className="pl-6 mt-1 space-y-1 text-xs">
                  {item.submenu.map((sub, sidx) => (
                    <Link
                      key={sidx}
                      to={sub.path}
                      className="flex items-center gap-2 px-3 py-2 rounded hover:bg-[#005f87]"
                    >
                      {sub.icon} <span>{sub.name}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
}
