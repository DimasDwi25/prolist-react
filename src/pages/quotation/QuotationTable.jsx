import React, { useEffect, useState, useRef, useMemo } from "react";
import { HotTable } from "@handsontable/react";
import { Plus } from "lucide-react";
import {
  Box,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Snackbar,
  Alert,
  Stack,
  Chip,
  TextField,
  TablePagination,
} from "@mui/material";

import api from "../../api/api";
import ColumnVisibilityModal from "../../components/ColumnVisibilityModal";
import QuotationFormModal from "./QuotationFormModal";
import QuotationDetailModal from "./QuotationDetailModal";
import { formatDate } from "../../utils/FormatDate";
import { filterBySearch } from "../../utils/filter"; // gunakan util filter yang sama dengan ProjectTable
import Handsontable from "handsontable";
import LoadingOverlay from "../../components/loading/LoadingOverlay";

export default function QuotationTable() {
  const hotTableRef = useRef(null);
  const [quotations, setQuotations] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [openDetailModal, setOpenDetailModal] = useState(false);
  const [selectedQuotationId, setSelectedQuotationId] = useState(null);

  const [openConfirmModal, setOpenConfirmModal] = useState(false);
  const [changedCell, setChangedCell] = useState(null);

  // column visibility
  const [columnVisibility, setColumnVisibility] = useState({});

  // fetch quotations
  const fetchQuotations = async () => {
    try {
      setLoading(true);
      const res = await api.get("/quotations");
      setQuotations(
        res.data.map((q) => ({
          ...q,
          id: q.quotation_number,
          client_name: q.client?.name || "-",
          quotation_value: Number(q.quotation_value) || null,
        }))
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // fetch clients
  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        const res = await api.get("/clients");
        setClients(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchClients();
  }, []);

  useEffect(() => {
    fetchQuotations();
  }, []);

  // delete quotation
  // const handleDelete = async (quotation_number) => {
  //   if (!window.confirm("Are you sure you want to delete this quotation?"))
  //     return;
  //   try {
  //     await api.delete(`/quotations/${quotation_number}`);
  //     setQuotations((prev) =>
  //       prev.filter((q) => q.quotation_number !== quotation_number)
  //     );
  //     setSnackbar({
  //       open: true,
  //       message: "Quotation deleted successfully!",
  //       severity: "success",
  //     });
  //   } catch {
  //     setSnackbar({
  //       open: true,
  //       message: "Failed to delete quotation.",
  //       severity: "error",
  //     });
  //   }
  // };

  // inline edit confirm
  const confirmUpdate = async () => {
    if (!changedCell) return;
    try {
      const { quotation_number, field, newValue } = changedCell;

      let payload = { [field]: newValue };

      // ✅ Mapping khusus untuk client
      if (field === "client_name") {
        const selectedClient = clients.find(
          (c) => c.name.toLowerCase() === newValue.toLowerCase()
        );
        if (selectedClient) {
          payload = { client_id: selectedClient.id }; // ubah ke ID
        } else {
          throw new Error("Client not found");
        }
      }

      const res = await api.put(`/quotations/${quotation_number}`, payload);

      // ✅ Update data di frontend
      setQuotations((prev) =>
        prev.map((q) =>
          q.quotation_number === quotation_number
            ? { ...q, ...res.data.quotation }
            : q
        )
      );

      setSnackbar({
        open: true,
        message: "Quotation updated successfully!",
        severity: "success",
      });
    } catch (err) {
      console.error(err);
      setSnackbar({
        open: true,
        message: "Failed to update quotation.",
        severity: "error",
      });
    } finally {
      setOpenConfirmModal(false);
      setChangedCell(null);
    }
  };

  // render helpers
  // ✅ Renderer hanya untuk tampilan (tidak ubah data asli)
  const currencyRenderer = (instance, td, row, col, prop, value) => {
    td.innerHTML = "";
    td.style.textAlign = "right";
    td.style.paddingRight = "8px";
    td.style.fontWeight = "600";
    td.style.color = "#065f46"; // hijau lembut

    if (value != null && value !== "") {
      const num = Number(value);
      if (!isNaN(num)) {
        td.textContent = `Rp ${num.toLocaleString("id-ID")}`;
      } else {
        td.textContent = "-";
        td.style.color = "#9ca3af";
      }
    } else {
      td.textContent = "-";
      td.style.color = "#9ca3af";
    }

    return td;
  };

  // ✅ Custom editor dengan auto-format ribuan
  const currencyEditor = Handsontable.editors.TextEditor.prototype.extend();

  currencyEditor.prototype.open = function () {
    Handsontable.editors.TextEditor.prototype.open.apply(this, arguments);
    const input = this.TEXTAREA;

    // Ambil angka murni dari nilai sebelumnya (hindari format double)
    const numericValue = Number(
      String(this.originalValue).replace(/[^0-9]/g, "")
    );
    input.value =
      !isNaN(numericValue) && numericValue > 0
        ? numericValue.toLocaleString("id-ID")
        : "";

    input.style.textAlign = "right";
    input.style.paddingRight = "4px";

    // Auto-format ribuan saat user mengetik
    this._onInputFormat = () => {
      const raw = input.value.replace(/[^0-9]/g, "");
      if (raw) {
        input.value = Number(raw).toLocaleString("id-ID");
      } else {
        input.value = "";
      }
    };

    input.addEventListener("input", this._onInputFormat);
  };

  currencyEditor.prototype.close = function () {
    const input = this.TEXTAREA;
    input.removeEventListener("input", this._onInputFormat);
    Handsontable.editors.TextEditor.prototype.close.apply(this, arguments);
  };

  // ✅ Pastikan value disimpan angka murni
  currencyEditor.prototype.getValue = function () {
    const raw = this.TEXTAREA.value.replace(/[^0-9]/g, "");
    return raw ? Number(raw) : null;
  };
  const dateRenderer = (instance, td, row, col, prop, value) => {
    td.innerText = formatDate(value);
    return td;
  };

  const actionsRenderer = (instance, td, row) => {
    td.innerHTML = "";
    const wrapper = document.createElement("div");
    wrapper.style.display = "flex";
    wrapper.style.gap = "6px";

    // View
    const viewBtn = document.createElement("button");
    viewBtn.innerText = "👁️";
    viewBtn.title = "View";
    viewBtn.style.border = "none";
    viewBtn.style.background = "transparent";
    viewBtn.style.cursor = "pointer";
    viewBtn.onclick = () => {
      const quotation = instance.getSourceDataAtRow(row);
      setSelectedQuotationId(quotation.id);
      setOpenDetailModal(true);
    };
    wrapper.appendChild(viewBtn);

    // // Delete
    // const delBtn = document.createElement("button");
    // delBtn.innerText = "🗑️";
    // delBtn.title = "Delete";
    // delBtn.style.border = "none";
    // delBtn.style.background = "transparent";
    // delBtn.style.cursor = "pointer";
    // delBtn.onclick = () => {
    //   const quotation = instance.getSourceDataAtRow(row);
    //   handleDelete(quotation.quotation_number);
    // };
    // wrapper.appendChild(delBtn);

    td.appendChild(wrapper);
    return td;
  };

  const columns = useMemo(
    () => [
      {
        data: "actions",
        title: "Actions",
        readOnly: true,
        renderer: actionsRenderer,
        width: 90,
      },
      { data: "no_quotation", title: "No. Quotation", width: 150 },
      { data: "title_quotation", title: "Title", width: 250 },
      {
        data: "client_name",
        title: "Client",
        width: 180,
        type: "dropdown",
        source: clients.map((c) => c.name), // ✅ daftar nama client dari API
        strict: true,
        allowInvalid: false,
        renderer: (instance, td, row, col, prop, value) => {
          td.innerHTML = "";
          td.style.textAlign = "left";
          td.style.paddingLeft = "8px";
          td.style.fontWeight = "500";
          td.textContent = value || "-";
          return td;
        },
      },

      { data: "client_pic", title: "PIC", width: 150 },
      {
        data: "quotation_date",
        title: "Date",
        renderer: dateRenderer,
        width: 120,
        editor: false,
      },
      {
        data: "quotation_value",
        title: "Value",
        renderer: currencyRenderer,
        editor: currencyEditor,
        width: 150,
      },
      { data: "quotation_weeks", title: "Week", width: 100, editor: false },
      {
        data: "revision_quotation_date",
        title: "Revision Date",
        type: "date",
        dateFormat: "YYYY-MM-DD",
        correctFormat: true,
        allowEmpty: true,
        width: 150,
        renderer: (instance, td, row, col, prop, value) => {
          td.innerHTML = "";
          td.style.textAlign = "center";

          if (value) {
            const dateObj = new Date(value);
            const formattedDate = `${String(dateObj.getDate()).padStart(
              2,
              "0"
            )}-${String(dateObj.getMonth() + 1).padStart(
              2,
              "0"
            )}-${dateObj.getFullYear()}`;

            td.textContent = formattedDate; // ✅ hasil: 12-12-2025
            td.style.color = "#111827";
            td.style.fontWeight = "500";
          } else {
            td.textContent = "-";
            td.style.color = "#9ca3af";
          }

          return td;
        },
      },
      { data: "revisi", title: "Revision", width: 100 },
      {
        data: "status",
        title: "Status",
        type: "dropdown",
        source: ["A", "D", "E", "F", "O"], // daftar kode status yang valid
        strict: true,
        allowInvalid: false,
        width: 180,
        renderer: (instance, td, row, col, prop, value) => {
          const statusMap = {
            A: "[A] ✓ Completed",
            D: "[D] ⏳ No PO Yet",
            E: "[E] ❌ Cancelled",
            F: "[F] ⚠️ Lost Bid",
            O: "[O] 🕒 On Going",
          };

          // Bersihkan konten lama
          td.innerHTML = "";
          td.style.textAlign = "center";
          td.style.fontWeight = "600";

          const span = document.createElement("span");
          span.textContent = statusMap[value] || "-";

          // Warna berdasarkan status
          switch (value) {
            case "A":
              span.style.color = "#16a34a";
              span.style.background = "#dcfce7";
              break;
            case "D":
              span.style.color = "#92400e";
              span.style.background = "#fef3c7";
              break;
            case "E":
              span.style.color = "#b91c1c";
              span.style.background = "#fee2e2";
              break;
            case "F":
              span.style.color = "#9333ea";
              span.style.background = "#f3e8ff";
              break;
            case "O":
              span.style.color = "#2563eb";
              span.style.background = "#dbeafe";
              break;
            default:
              span.style.color = "#6b7280";
              span.style.background = "#f3f4f6";
              break;
          }

          span.style.padding = "4px 8px";
          span.style.borderRadius = "8px";
          td.appendChild(span);

          return td;
        },
      },

      { data: "notes", title: "Notes", width: 200 },
    ],
    [clients]
  );

  // handle cell edit
  const handleCellEdit = (changes) => {
    if (!changes) return;
    const [row, prop, oldValue, newValue] = changes[0];
    if (oldValue !== newValue) {
      const quotation = quotations[row];
      setChangedCell({
        quotation_number: quotation.quotation_number,
        field: prop,
        oldValue,
        newValue,
      });
      setOpenConfirmModal(true);
    }
  };

  // pagination & search
  const filteredData = filterBySearch(quotations, searchTerm);
  const paginatedData = filteredData.slice(
    page * pageSize,
    page * pageSize + pageSize
  );

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setPageSize(parseInt(event.target.value, 10));
    setPage(0);
  };

  const tableHeight = Math.min(pageSize * 40 + 50, window.innerHeight - 250);

  return (
    <Box>
      <LoadingOverlay loading={loading} />
      {/* Top Controls */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
        spacing={2}
      >
        <TextField
          size="small"
          placeholder="Search quotation..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(0);
          }}
          sx={{ width: 260 }}
        />

        <Box display="flex" alignItems="center" gap={1}>
          <IconButton
            onClick={() => setOpenCreateModal(true)}
            sx={{
              backgroundColor: "#2563eb",
              color: "#fff",
              width: 36,
              height: 36,
              "&:hover": { backgroundColor: "#1d4ed8" },
            }}
          >
            <Plus fontSize="small" />
          </IconButton>
          <ColumnVisibilityModal
            columns={columns}
            columnVisibility={columnVisibility}
            handleToggleColumn={(field) =>
              setColumnVisibility((prev) => ({
                ...prev,
                [field]: !prev[field],
              }))
            }
          />
        </Box>
      </Stack>

      <HotTable
        ref={hotTableRef}
        data={paginatedData}
        colHeaders={columns.map((c) => c.title)}
        columns={columns}
        width="100%"
        height={tableHeight}
        stretchH="all"
        manualColumnResize
        manualColumnFreeze
        fixedColumnsLeft={3}
        licenseKey="non-commercial-and-evaluation"
        afterChange={handleCellEdit}
        className="ht-theme-horizon"
        filters
        dropdownMenu
        columnSorting
      />

      {/* Pagination */}
      <TablePagination
        component="div"
        count={filteredData.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={pageSize}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 20, 50]}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          severity={snackbar.severity}
          sx={{ width: "100%" }}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Confirm Modal */}
      <Dialog
        open={openConfirmModal}
        onClose={() => setOpenConfirmModal(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Confirm Change</DialogTitle>
        <DialogContent>
          {changedCell && (
            <Stack spacing={2} alignItems="center">
              <Typography variant="body2" color="text.secondary">
                Update field: <b>{changedCell.field}</b>
              </Typography>

              {/* 🔍 Format nilai berdasarkan field */}
              {(() => {
                const formatValue = (value) => {
                  if (!value) return "—";

                  // Jika field berkaitan dengan tanggal
                  if (changedCell.field.toLowerCase().includes("date")) {
                    const date = new Date(value);
                    if (isNaN(date)) return value;
                    return date
                      .toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })
                      .replace(/\//g, "-");
                  }

                  // Jika field berkaitan dengan nominal/value
                  if (changedCell.field.toLowerCase().includes("value")) {
                    const num = Number(String(value).replace(/[^0-9.-]/g, ""));
                    if (isNaN(num)) return value;
                    return "Rp " + num.toLocaleString("id-ID");
                  }

                  // Default: tampilkan teks apa adanya
                  return value;
                };

                return (
                  <Box display="flex" gap={2}>
                    <Chip
                      label={formatValue(changedCell.oldValue)}
                      color="error"
                      variant="outlined"
                    />
                    <Chip
                      label={formatValue(changedCell.newValue)}
                      color="success"
                      variant="outlined"
                    />
                  </Box>
                );
              })()}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirmModal(false)}>Cancel</Button>
          <Button variant="contained" onClick={confirmUpdate}>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      <QuotationFormModal
        open={openCreateModal}
        onClose={() => setOpenCreateModal(false)}
        clients={clients}
        onSave={fetchQuotations}
      />

      <QuotationDetailModal
        open={openDetailModal}
        onClose={() => setOpenDetailModal(false)}
        quotationId={selectedQuotationId}
      />
    </Box>
  );
}
