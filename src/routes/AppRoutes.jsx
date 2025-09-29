import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "../pages/auth/Login";
import MarketingDashboard from "../pages/dashboard/MarketingDashboard";
import ProtectedRoute from "../components/ProtectedRoute";
import MainLayout from "../layouts/MainLayout"; // layout utama
import ClientTable from "../pages/client/ClientTable";
import QuotationTable from "../pages/quotation/QuotationTable";
import CategorieProjectTable from "../pages/categorie-project/CategorieProjectTable";
import StatusProjectTable from "../pages/status-project/StatusProjectTable";
import SalesReportTable from "../pages/sales-report/SalesReport";
import MarketingReport from "../pages/marketing-report/MarketingReport";
import ProjectTable from "../pages/project/ProjectTable";
import ProjectDetails from "../pages/project/ProjectDetails";
import PhcForm from "../pages/phc/PhcForm";
import ApprovalPage from "../pages/approvall/ApprovallPage";
import EngineerDashboard from "../pages/dashboard/EngineerDashboard";
import ViewProjects from "../pages/engineer-page/project/ViewProjects";
import UpdateDocumentPhc from "../pages/engineer-page/phc/UpdateDocumentPhc";
import ViewPhc from "../pages/phc/ViewPhc";
import PhcEdit from "../pages/phc/PhcEdit";
import SucDashboard from "../pages/dashboard/SucDashboard";
import MaterialRequestPage from "../pages/material-request/MaterialRequestPage";
import MaterialRequestTable from "../pages/material-request/MaterialRequestTable";
import WorkOrderPage from "../pages/engineer-page/work-order/WorkOrderPage";
import WorkOrderTable from "../pages/engineer-page/work-order/WorkOrderTable";
import ManPowerAllocationTable from "../pages/engineer-page/man-power/ManPowerAllocationTable";
import PackingListPage from "../pages/packing-list/PackingListPage";
import AdminDashboard from "../pages/dashboard/AdminDashboard";
import UserTable from "../pages/users/UserTable";
import RoleTable from "../pages/role/RoleTable";
import DepartmentTable from "../pages/department/DepartmentTable";

function AppRoutes() {
  return (
    <Router>
      <Routes>
        {/* Auth */}
        <Route path="/login" element={<Login />} />
        {/* Marketing Dashboard (protected) */}
        <Route
          path="/marketing"
          element={
            <ProtectedRoute
              allowedRoles={[
                "marketing_admin",
                "manager_marketing",
                "sales_supervisor",
                "super_admin",
                "marketing_director",
                "supervisor marketing",
                "sales_supervisor",
                "marketing_estimator",
                "engineering_director",
              ]}
            >
              <MainLayout>
                <MarketingDashboard />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/client"
          element={
            <ProtectedRoute
              allowedRoles={[
                "marketing_admin",
                "manager_marketing",
                "sales_supervisor",
                "super_admin",
                "marketing_director",
                "supervisor marketing",
                "sales_supervisor",
                "marketing_estimator",
                "engineering_director",
              ]}
            >
              <MainLayout>
                <ClientTable />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/quotation"
          element={
            <ProtectedRoute
              allowedRoles={[
                "marketing_admin",
                "manager_marketing",
                "sales_supervisor",
                "super_admin",
                "marketing_director",
                "supervisor marketing",
                "sales_supervisor",
                "marketing_estimator",
                "engineering_director",
              ]}
            >
              <MainLayout>
                <QuotationTable />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/category-project"
          element={
            <ProtectedRoute
              allowedRoles={[
                "marketing_admin",
                "manager_marketing",
                "sales_supervisor",
                "super_admin",
                "marketing_director",
                "supervisor marketing",
                "sales_supervisor",
                "marketing_estimator",
                "engineering_director",
              ]}
            >
              <MainLayout>
                <CategorieProjectTable />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/status-project"
          element={
            <ProtectedRoute
              allowedRoles={[
                "marketing_admin",
                "manager_marketing",
                "sales_supervisor",
                "super_admin",
                "marketing_director",
                "supervisor marketing",
                "sales_supervisor",
                "marketing_estimator",
                "engineering_director",
              ]}
            >
              <MainLayout>
                <StatusProjectTable />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/sales-report"
          element={
            <ProtectedRoute
              allowedRoles={[
                "marketing_admin",
                "manager_marketing",
                "sales_supervisor",
                "super_admin",
                "marketing_director",
                "supervisor marketing",
                "sales_supervisor",
                "marketing_estimator",
                "engineering_director",
              ]}
            >
              <MainLayout>
                <SalesReportTable />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/marketing-report"
          element={
            <ProtectedRoute
              allowedRoles={[
                "marketing_admin",
                "manager_marketing",
                "sales_supervisor",
                "super_admin",
                "marketing_director",
                "supervisor marketing",
                "sales_supervisor",
                "marketing_estimator",
                "engineering_director",
              ]}
            >
              <MainLayout>
                <MarketingReport />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects"
          element={
            <ProtectedRoute
              allowedRoles={[
                "marketing_admin",
                "manager_marketing",
                "sales_supervisor",
                "super_admin",
                "marketing_director",
                "supervisor marketing",
                "sales_supervisor",
                "marketing_estimator",
                "engineering_director",
                "project controller",
                "project manager",
                "warehouse",
              ]}
            >
              <MainLayout>
                <ProjectTable />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/:pn_number"
          element={
            <ProtectedRoute
              allowedRoles={[
                "marketing_admin",
                "manager_marketing",
                "sales_supervisor",
                "super_admin",
                "marketing_director",
                "supervisor marketing",
                "sales_supervisor",
                "marketing_estimator",
                "engineering_director",
                "project controller",
                "project manager",
              ]}
            >
              <MainLayout>
                <ProjectDetails />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/phc/:pn_number"
          element={
            <ProtectedRoute
              allowedRoles={[
                "marketing_admin",
                "manager_marketing",
                "sales_supervisor",
                "super_admin",
                "marketing_director",
                "supervisor marketing",
                "sales_supervisor",
                "marketing_estimator",
                "engineering_director",
              ]}
            >
              <MainLayout>
                <PhcForm />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/approvall"
          element={
            <ProtectedRoute
              allowedRoles={[
                "marketing_admin",
                "manager_marketing",
                "sales_supervisor",
                "super_admin",
                "marketing_director",
                "supervisor marketing",
                "sales_supervisor",
                "marketing_estimator",
                "engineering_director",
                "engineer",
                "project controller",
                "project manager",
              ]}
            >
              <MainLayout>
                <ApprovalPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/phcs/show/:phcId"
          element={
            <ProtectedRoute
              allowedRoles={[
                "marketing_admin",
                "manager_marketing",
                "sales_supervisor",
                "super_admin",
                "marketing_director",
                "supervisor marketing",
                "sales_supervisor",
                "marketing_estimator",
                "engineering_director",
                "engineer",
                "project controller",
                "project manager",
              ]}
            >
              <MainLayout>
                <ViewPhc />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/phc/:projectId/edit"
          element={
            <ProtectedRoute
              allowedRoles={[
                "marketing_admin",
                "manager_marketing",
                "sales_supervisor",
                "super_admin",
                "marketing_director",
                "supervisor marketing",
                "sales_supervisor",
                "marketing_estimator",
                "engineering_director",
                "engineer",
                "project controller",
                "project manager",
              ]}
            >
              <MainLayout>
                <PhcEdit />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        {/* Engineer */}
        <Route
          path="/engineer"
          element={
            <ProtectedRoute
              allowedRoles={[
                "engineer",
                "project controller",
                "project manager",
                "engineering_director",
              ]}
            >
              <MainLayout>
                <EngineerDashboard />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/engineer/projects/:pn_number"
          element={
            <ProtectedRoute
              allowedRoles={[
                "project controller",
                "project manager",
                "engineering_director",
              ]}
            >
              <MainLayout>
                <ViewProjects />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/engineer/phc/:phcId"
          element={
            <ProtectedRoute
              allowedRoles={[
                "project controller",
                "project manager",
                "engineering_director",
              ]}
            >
              <MainLayout>
                <UpdateDocumentPhc />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/work-order"
          element={
            <ProtectedRoute
              allowedRoles={[
                "project controller",
                "project manager",
                "engineering_director",
                "engineer",
              ]}
            >
              <MainLayout>
                <WorkOrderPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/work-order/:pn_number"
          element={
            <ProtectedRoute
              allowedRoles={[
                "project controller",
                "project manager",
                "engineering_director",
                "engineer",
              ]}
            >
              <MainLayout>
                <WorkOrderTable />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/man-power/:pn_number"
          element={
            <ProtectedRoute
              allowedRoles={[
                "project controller",
                "project manager",
                "engineering_director",
              ]}
            >
              <MainLayout>
                <ManPowerAllocationTable />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/suc"
          element={
            <ProtectedRoute allowedRoles={["warehouse"]}>
              <MainLayout>
                <SucDashboard />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/material-request"
          element={
            <ProtectedRoute allowedRoles={["warehouse"]}>
              <MainLayout>
                <MaterialRequestPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/material-request/:pn_number"
          element={
            <ProtectedRoute allowedRoles={["warehouse"]}>
              <MainLayout>
                <MaterialRequestTable />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/packing-list"
          element={
            <ProtectedRoute allowedRoles={["warehouse"]}>
              <MainLayout>
                <PackingListPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute
              allowedRoles={[
                "super_admin",
                "engineering_director",
                "marketing_director",
              ]}
            >
              <MainLayout>
                <AdminDashboard />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/user"
          element={
            <ProtectedRoute allowedRoles={["super_admin"]}>
              <MainLayout>
                <UserTable />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/role"
          element={
            <ProtectedRoute allowedRoles={["super_admin"]}>
              <MainLayout>
                <RoleTable />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/department"
          element={
            <ProtectedRoute allowedRoles={["super_admin"]}>
              <MainLayout>
                <DepartmentTable />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        {/* Default */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        {/* 404 */}
        <Route path="*" element={<h1>Page Not Found</h1>} />
      </Routes>
    </Router>
  );
}

export default AppRoutes;
