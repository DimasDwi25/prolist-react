import React, { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import {
  Dialog,
  IconButton,
  Button,
  Box,
  TextField,
  Grid,
  Autocomplete,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { Link } from "react-router-dom";
import api from "../../api/api";
import LoadingScreen from "../../components/loading/loadingScreen";
import LogTable from "../../components/table/LogTable";
import BoqModal from "./BoqModal";
import PhcFormModal from "./PhcFormModal";
import ViewPhcModal from "./ViewPhcModal";

const ProjectDetailsModal = ({ open, onClose, pn_number }) => {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("project");
  const [showPhcForm, setShowPhcForm] = useState(false);
  const [showViewPhc, setShowViewPhc] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const fetchProject = async () => {
    try {
      setLoading(true);
      // ✅ pakai axios instance yang sudah ada
      const res = await api.get(`/projects/${pn_number}`);

      const projectData = res.data?.data?.project;

      setProject(projectData);
    } catch (err) {
      console.error(err.response?.data || err);
      setError("Failed to fetch project details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open || !pn_number) return;

    fetchProject();
  }, [pn_number, open]);

  // Helper functions
  const display = (value) => value || "—";

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    try {
      return format(parseISO(dateString), "dd MMM yyyy");
    } catch {
      return "Invalid date";
    }
  };

  const formatDecimal = (value) => {
    if (!value) return "0";
    return new Intl.NumberFormat("id-ID").format(parseFloat(value));
  };

  if (loading)
    return (
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth></Dialog>
    );
  if (error)
    return (
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <div className="text-red-500 text-center p-8">Error: {error}</div>
      </Dialog>
    );
  if (!project)
    return (
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <div className="text-center p-8">Project not found</div>
      </Dialog>
    );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
      <div
        className="w-full mx-auto bg-white p-6 rounded-2xl shadow-lg border border-gray-100 space-y-8 relative"
        style={{ maxHeight: "100vh", overflowY: "auto", paddingRight: "1rem" }}
      >
        {/* Close Button */}
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>

        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                Project Details
              </h1>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium
              ${
                project.statusProject?.name === "Active"
                  ? "bg-green-100 text-green-800"
                  : project.statusProject?.name === "On Hold"
                  ? "bg-yellow-100 text-yellow-800"
                  : project.statusProject?.name === "Completed"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-gray-100 text-gray-800"
              }`}
              >
                {display(project.statusProject?.name)}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {/* PHC Actions */}
            {project.phc ? (
              <>
                <button
                  onClick={() => {
                    setShowPhcForm(true);
                  }}
                  className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  Edit PHC
                </button>

                <button
                  onClick={() => setShowViewPhc(true)}
                  className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                  View PHC
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setShowPhcForm(true);
                }}
                className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Create PHC
              </button>
            )}
          </div>
        </div>
        {/* PHC Status Alert */}
        {project.phc && project.phc.status === "ready" && (
          <div className="w-full bg-green-50 border-l-4 border-green-500 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-green-500"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  PHC is ready for next steps
                </p>
                <p className="mt-1 text-sm text-green-700">
                  All approvals have been completed for this PHC document.
                </p>
              </div>
            </div>
          </div>
        )}

        {project.phc &&
          project.pendingApprovals &&
          project.pendingApprovals.length > 0 && (
            <div className="w-full bg-yellow-50 border-l-4 border-yellow-500 rounded-lg p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-yellow-500"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-yellow-800">
                    Pending PHC Approvals
                  </p>
                  <p className="mt-1 text-sm text-yellow-700">
                    Awaiting approval from:
                  </p>
                  <ul className="mt-1 space-y-1">
                    {project.pendingApprovals.map((approval, index) => (
                      <li
                        key={index}
                        className="text-sm text-yellow-700 flex items-center"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 mr-1.5 text-yellow-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                          />
                        </svg>
                        {approval.user?.name || "User not found"}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

        {/* Tabs Navigation */}
        <div className="mt-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("project")}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "project"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Project Information
              </button>
              <button
                onClick={() => setActiveTab("quotation")}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "quotation"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Quotation Details
              </button>
              <button
                onClick={() => setActiveTab("relationships")}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "relationships"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Variatian Order
              </button>
              <button
                onClick={() => setActiveTab("status")}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "status"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Status & Timeline
              </button>
            </nav>
          </div>

          {/* Project Information Tab */}
          {activeTab === "project" && (
            <div className="py-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project Number
                  </h3>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {display(project.project_number)}
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project Name
                  </h3>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {display(project.project_name)}
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </h3>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {display(project.category?.name)}
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mandays (Engineer)
                  </h3>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {display(project.mandays_engineer)}
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mandays (Technician)
                  </h3>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {display(project.mandays_technician)}
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Target Date
                  </h3>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {formatDate(project.target_dates)}
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PO Date
                  </h3>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {formatDate(project.po_date)}
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PO Week
                  </h3>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {project.sales_weeks || "—"}
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PO Value
                  </h3>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {project.po_value
                      ? `Rp ${formatDecimal(project.po_value)}`
                      : "—"}
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PO Number
                  </h3>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {display(project.po_number)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Quotation Details Tab */}
          {activeTab === "quotation" && (
            <div className="py-6">
              {project.quotation ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quotation Number
                    </h3>
                    <p className="mt-1 text-sm font-medium text-gray-900">
                      {display(project.quotation.no_quotation)}
                    </p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </h3>
                    <p className="mt-1 text-sm font-medium text-gray-900">
                      {display(project.quotation.client?.name)}
                    </p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quotation Value
                    </h3>
                    <p className="mt-1 text-sm font-medium text-gray-900">
                      Rp {formatDecimal(project.quotation.quotation_value)}
                    </p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quotation Date
                    </h3>
                    <p className="mt-1 text-sm font-medium text-gray-900">
                      {formatDate(project.quotation.quotation_date)}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-yellow-400"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">
                        No quotation information available for this project.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Project Relationships Tab */}
          {activeTab === "relationships" && (
            <div className="py-6">
              {project.hasParent || project.hasVariants ? (
                <div className="space-y-6">
                  {/* Parent Project Section */}
                  {project.hasParent && project.parentProject && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-3">
                        Parent Project
                      </h3>
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <h4 className="text-xs font-medium text-blue-800 uppercase tracking-wider">
                              Project Number
                            </h4>
                            <p className="mt-1 text-sm font-medium text-blue-900">
                              {project.parentProject.project_number}
                            </p>
                          </div>
                          <div>
                            <h4 className="text-xs font-medium text-blue-800 uppercase tracking-wider">
                              Project Name
                            </h4>
                            <p className="mt-1 text-sm font-medium text-blue-900">
                              {project.parentProject.project_name}
                            </p>
                          </div>
                          <div>
                            <h4 className="text-xs font-medium text-blue-800 uppercase tracking-wider">
                              Status
                            </h4>
                            <p className="mt-1 text-sm font-medium text-blue-900">
                              {project.parentProject.statusProject?.name ||
                                "N/A"}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3">
                          <Link
                            to={`/supervisor/project/${project.parentProject.id}`}
                            className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
                          >
                            View Parent Project
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 ml-1"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Child Projects Section */}
                  {project.hasVariants &&
                    project.childProjects &&
                    project.childProjects.length > 0 && (
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-3">
                          Variant Orders
                        </h3>
                        <div className="bg-white shadow overflow-hidden sm:rounded-md">
                          <ul className="divide-y divide-gray-200">
                            {project.childProjects.map((child) => (
                              <li key={child.id}>
                                <div className="px-4 py-4 sm:px-6">
                                  <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-indigo-600 truncate">
                                      {child.project_number}
                                    </p>
                                    <div className="ml-2 flex-shrink-0 flex">
                                      <p
                                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                    ${
                                      child.statusProject?.name === "Active"
                                        ? "bg-green-100 text-green-800"
                                        : child.statusProject?.name ===
                                          "On Hold"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : child.statusProject?.name ===
                                          "Completed"
                                        ? "bg-blue-100 text-blue-800"
                                        : "bg-gray-100 text-gray-800"
                                    }`}
                                      >
                                        {child.statusProject?.name || "N/A"}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="mt-2 sm:flex sm:justify-between">
                                    <div className="sm:flex">
                                      <p className="flex items-center text-sm text-gray-500">
                                        <svg
                                          className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400"
                                          xmlns="http://www.w3.org/2000/svg"
                                          viewBox="0 0 20 20"
                                          fill="currentColor"
                                        >
                                          <path
                                            fillRule="evenodd"
                                            d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                                            clipRule="evenodd"
                                          />
                                        </svg>
                                        Target: {formatDate(child.target_dates)}
                                      </p>
                                    </div>
                                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                      <svg
                                        className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400"
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                      >
                                        <path
                                          fillRule="evenodd"
                                          d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                      Created: {formatDate(child.created_at)}
                                    </div>
                                  </div>
                                  <div className="mt-2">
                                    <Link
                                      to={`/supervisor/project/${child.id}`}
                                      className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-900"
                                    >
                                      View Details
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-4 w-4 ml-1"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth="2"
                                          d="M9 5l7 7-7 7"
                                        />
                                      </svg>
                                    </Link>
                                  </div>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                </div>
              ) : (
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 text-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-12 w-12 mx-auto text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                      d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No variatian order
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    This project doesn't have any parent or variant projects
                    associated with it.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Status & Timeline Tab */}
          {activeTab === "status" && (
            <div className="py-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Status
                  </h3>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {display(project.statusProject?.name)}
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created At
                  </h3>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {formatDate(project.created_at)}
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Updated
                  </h3>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {formatDate(project.updated_at)}
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Target Completion
                  </h3>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {formatDate(project.target_dates)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Recent Activity Section */}
        <LogTable projectId={project.pn_number} />
      </div>

      {/* Render PHC Form Modal */}
      <PhcFormModal
        open={showPhcForm}
        onClose={() => setShowPhcForm(false)}
        project={project}
        phcData={project.phc}
        onSave={(success) => {
          fetchProject();
          setShowPhcForm(false);
          if (success) {
            setSnackbar({
              open: true,
              message: "PHC created successfully!",
              severity: "success",
            });
            // Notify parent component to refresh project list
            if (window.parentRefreshProjects) {
              window.parentRefreshProjects();
            }
          }
        }}
      />

      {/* Render View PHC Modal */}
      <ViewPhcModal
        phcId={project.phc?.id}
        open={showViewPhc}
        handleClose={() => setShowViewPhc(false)}
      />

      {/* Snackbar for success messages */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        sx={{ zIndex: 9999 }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

export default ProjectDetailsModal;
