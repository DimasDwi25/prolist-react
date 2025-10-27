import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Stack,
  Card,
  CardContent,
  Grid,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
  Autocomplete,
} from "@mui/material";
import { Search, Refresh, Visibility } from "@mui/icons-material";
import {
  getActivityLogs,
  getActivityLog,
  getActions,
  getModelTypes,
  getUsers,
} from "../../api/api";
import LoadingOverlay from "../../components/loading/LoadingOverlay";
import FilterBar from "../../components/filter/FilterBar";
import { formatDate } from "../../utils/FormatDate";
import { sortOptions } from "../../helper/SortOptions";
import { formatValue } from "../../utils/formatValue";

export default function ActivityLogPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [total, setTotal] = useState(0);

  // Filters
  const [filters, setFilters] = useState({
    year: new Date().getFullYear(),
    rangeType: "monthly",
    month: null,
    from: "",
    to: "",
  });
  const [search, setSearch] = useState("");
  const [selectedAction, setSelectedAction] = useState("");
  const [selectedModelType, setSelectedModelType] = useState("");
  const [selectedModelId, setSelectedModelId] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");

  // Dropdown options
  const [actions, setActions] = useState([]);
  const [modelTypes, setModelTypes] = useState([]);
  const [users, setUsers] = useState([]);
  const [availableYears, setAvailableYears] = useState([]);

  // Modal state
  const [selectedLog, setSelectedLog] = useState(null);
  const [openDetailModal, setOpenDetailModal] = useState(false);

  const fetchLogs = async (params = {}) => {
    setLoading(true);
    try {
      const response = await getActivityLogs({
        page: page + 1,
        per_page: rowsPerPage,
        ...params,
      });
      setLogs(response.data.data.data);
      setTotal(response.data.data.total);
      setAvailableYears(response.data.availableYears || []);
    } catch (error) {
      console.error("Error fetching activity logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdowns = async () => {
    try {
      const [actionsRes, modelTypesRes, usersRes] = await Promise.all([
        getActions(),
        getModelTypes(),
        getUsers(),
      ]);
      setActions(sortOptions(actionsRes.data.data));
      setModelTypes(sortOptions(modelTypesRes.data.data));
      setUsers(sortOptions(usersRes.data.data, "name"));
    } catch (error) {
      console.error("Error fetching dropdown data:", error);
    }
  };

  useEffect(() => {
    fetchDropdowns();
    fetchLogs();
  }, []);

  useEffect(() => {
    const params = buildParams();
    fetchLogs(params);
  }, [
    page,
    rowsPerPage,
    filters,
    search,
    selectedAction,
    selectedModelType,
    selectedModelId,
    selectedUserId,
  ]);

  const buildParams = () => {
    const params = {};

    // Date filters from FilterBar
    if (filters.year) params.year = filters.year;
    if (filters.rangeType === "monthly" && filters.month) {
      params.month = filters.month;
    }
    if (filters.rangeType === "custom") {
      if (filters.from) params.start_date = filters.from;
      if (filters.to) params.end_date = filters.to;
    }
    // For single date, we can add a custom option in FilterBar later

    // Other filters
    if (search) params.search = search;
    if (selectedAction) params.action = selectedAction;
    if (selectedModelType) params.model_type = selectedModelType;
    if (selectedModelId) params.model_id = selectedModelId;
    if (selectedUserId) params.user_id = selectedUserId;

    return params;
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPage(0); // Reset to first page
  };

  const handleRefresh = () => {
    setSelectedUserId("");
    setSelectedAction("");
    setSelectedModelType("");
    fetchLogs(buildParams());
  };

  const handleViewDetails = async (log) => {
    try {
      const response = await getActivityLog(log.id);
      console.log("Log details response:", response.data.data);
      setSelectedLog(response.data.data);
      setOpenDetailModal(true);
    } catch (error) {
      console.error("Error fetching log details:", error);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const formatChangesData = (data) => {
    if (!data || typeof data !== "object") {
      return JSON.stringify(data, null, 2);
    }

    const formatValueRecursive = (obj) => {
      if (obj === null || obj === undefined) return obj;
      if (typeof obj === "object") {
        const formatted = {};
        for (const key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const value = obj[key];
            // Check if key suggests it's a date
            if (
              key.toLowerCase().includes("date") ||
              key.toLowerCase().includes("created_at") ||
              key.toLowerCase().includes("updated_at")
            ) {
              formatted[key] = formatDate(value);
            }
            // Check if key suggests it's a monetary value
            else if (
              key.toLowerCase().includes("price") ||
              key.toLowerCase().includes("amount") ||
              key.toLowerCase().includes("cost") ||
              key.toLowerCase().includes("value") ||
              key.toLowerCase().includes("nominal")
            ) {
              formatted[key] = formatValue(value).formatted;
            }
            // Recursively format nested objects/arrays
            else if (typeof value === "object") {
              formatted[key] = formatValueRecursive(value);
            } else {
              formatted[key] = value;
            }
          }
        }
        return formatted;
      }
      return obj;
    };

    return JSON.stringify(formatValueRecursive(data), null, 2);
  };

  return (
    <Box sx={{ width: "100%", p: 2 }}>
      <LoadingOverlay loading={loading} />

      {/* Header */}
      <Typography variant="h4" gutterBottom>
        Activity Logs
      </Typography>

      {/* FilterBar */}
      <FilterBar
        stats={{
          availableYears:
            availableYears.length > 0
              ? availableYears
              : [new Date().getFullYear()],
        }}
        onFilter={handleFilterChange}
        initialFilters={filters}
      />

      {/* Additional Filters */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Search Description"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <Search sx={{ mr: 1, color: "action.active" }} />
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Autocomplete
                size="small"
                options={actions}
                value={selectedAction}
                onChange={(event, newValue) => {
                  setSelectedAction(newValue || "");
                }}
                renderInput={(params) => (
                  <TextField {...params} label="Action" />
                )}
                freeSolo
                clearOnEscape
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Autocomplete
                size="small"
                options={modelTypes}
                value={selectedModelType}
                onChange={(event, newValue) => {
                  setSelectedModelType(newValue || "");
                }}
                renderInput={(params) => (
                  <TextField {...params} label="Model Type" />
                )}
                freeSolo
                clearOnEscape
                sx={{ minWidth: 250 }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                size="small"
                label="Model ID"
                value={selectedModelId}
                onChange={(e) => setSelectedModelId(e.target.value)}
                type="number"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Autocomplete
                size="small"
                options={users}
                getOptionLabel={(option) => option.name || ""}
                value={users.find((user) => user.id === selectedUserId) || null}
                onChange={(event, newValue) => {
                  setSelectedUserId(newValue ? newValue.id : "");
                }}
                renderInput={(params) => <TextField {...params} label="User" />}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                sx={{ minWidth: 200 }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={1}>
              <Tooltip title="Refresh">
                <IconButton onClick={handleRefresh} color="primary">
                  <Refresh />
                </IconButton>
              </Tooltip>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <strong>Actions</strong>
              </TableCell>
              <TableCell>
                <strong>User</strong>
              </TableCell>
              <TableCell>
                <strong>Action</strong>
              </TableCell>
              <TableCell>
                <strong>Model Type</strong>
              </TableCell>
              <TableCell>
                <strong>Model ID</strong>
              </TableCell>
              <TableCell>
                <strong>Description</strong>
              </TableCell>
              <TableCell>
                <strong>Created At</strong>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id} hover>
                <TableCell>
                  <Tooltip title="View Details">
                    <IconButton
                      size="small"
                      onClick={() => handleViewDetails(log)}
                    >
                      <Visibility />
                    </IconButton>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  {log.user ? `${log.user.name} (${log.user.email})` : "System"}
                </TableCell>
                <TableCell>
                  <Chip label={log.action} color="primary" size="small" />
                </TableCell>
                <TableCell>{log.model_type || "-"}</TableCell>
                <TableCell>{log.model_id || "-"}</TableCell>
                <TableCell
                  sx={{
                    maxWidth: 300,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {log.description}
                </TableCell>
                <TableCell>{formatDate(log.created_at)}</TableCell>
              </TableRow>
            ))}
            {logs.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography variant="body2" color="textSecondary">
                    No activity logs found.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <TablePagination
        component="div"
        count={total}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[10, 15, 25, 50]}
      />

      {/* Detail Modal */}
      <Dialog
        open={openDetailModal}
        onClose={() => setOpenDetailModal(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Activity Log Details</DialogTitle>
        <DialogContent>
          {selectedLog && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Basic Information
              </Typography>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    User
                  </Typography>
                  <Typography>
                    {selectedLog.user
                      ? `${selectedLog.user.name} (${selectedLog.user.email})`
                      : "System"}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Action
                  </Typography>
                  <Chip
                    label={selectedLog.action}
                    color="primary"
                    size="small"
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Model Type
                  </Typography>
                  <Typography>{selectedLog.model_type || "-"}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Model ID
                  </Typography>
                  <Typography>{selectedLog.model_id || "-"}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">
                    Created At
                  </Typography>
                  <Typography>{formatDate(selectedLog.created_at)}</Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>
                Description
              </Typography>
              <Typography sx={{ mb: 2 }}>{selectedLog.description}</Typography>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>
                Changes
              </Typography>
              {selectedLog.changes ? (
                <Box>
                  {selectedLog.action === "update" &&
                  selectedLog.changes.old &&
                  selectedLog.changes.new ? (
                    <Box>
                      <Typography
                        variant="subtitle1"
                        color="error"
                        gutterBottom
                      >
                        Old Values:
                      </Typography>
                      <Paper sx={{ p: 2, mb: 2, bgcolor: "#ffebee" }}>
                        <pre
                          style={{
                            whiteSpace: "pre-wrap",
                            fontSize: "0.875rem",
                          }}
                        >
                          {formatChangesData(selectedLog.changes.old)}
                        </pre>
                      </Paper>
                      <Typography
                        variant="subtitle1"
                        color="success.main"
                        gutterBottom
                      >
                        New Values:
                      </Typography>
                      <Paper sx={{ p: 2, bgcolor: "#e8f5e8" }}>
                        <pre
                          style={{
                            whiteSpace: "pre-wrap",
                            fontSize: "0.875rem",
                          }}
                        >
                          {formatChangesData(selectedLog.changes.new)}
                        </pre>
                      </Paper>
                    </Box>
                  ) : selectedLog.action === "create" &&
                    selectedLog.changes.new ? (
                    <Box>
                      <Typography
                        variant="subtitle1"
                        color="success.main"
                        gutterBottom
                      >
                        Created Data:
                      </Typography>
                      <Paper sx={{ p: 2, bgcolor: "#e8f5e8" }}>
                        <pre
                          style={{
                            whiteSpace: "pre-wrap",
                            fontSize: "0.875rem",
                          }}
                        >
                          {formatChangesData(selectedLog.changes.new)}
                        </pre>
                      </Paper>
                    </Box>
                  ) : selectedLog.action === "delete" &&
                    selectedLog.changes.old ? (
                    <Box>
                      <Typography
                        variant="subtitle1"
                        color="error"
                        gutterBottom
                      >
                        Deleted Data:
                      </Typography>
                      <Paper sx={{ p: 2, bgcolor: "#ffebee" }}>
                        <pre
                          style={{
                            whiteSpace: "pre-wrap",
                            fontSize: "0.875rem",
                          }}
                        >
                          {formatChangesData(selectedLog.changes.old)}
                        </pre>
                      </Paper>
                    </Box>
                  ) : selectedLog.action === "update" &&
                    selectedLog.changes.new &&
                    !selectedLog.changes.old ? (
                    <Box>
                      <Typography
                        variant="subtitle1"
                        color="success.main"
                        gutterBottom
                      >
                        Updated Data:
                      </Typography>
                      <Paper sx={{ p: 2, bgcolor: "#e8f5e8" }}>
                        <pre
                          style={{
                            whiteSpace: "pre-wrap",
                            fontSize: "0.875rem",
                          }}
                        >
                          {formatChangesData(selectedLog.changes.new)}
                        </pre>
                      </Paper>
                    </Box>
                  ) : (
                    <Typography color="textSecondary">
                      No detailed changes available
                    </Typography>
                  )}
                </Box>
              ) : (
                <Typography color="textSecondary">
                  No changes data available
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetailModal(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
