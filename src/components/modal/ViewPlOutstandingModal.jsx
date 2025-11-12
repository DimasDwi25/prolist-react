import React, { useState, useRef, useMemo } from "react";
import { HotTable } from "@handsontable/react";
import Handsontable from "handsontable";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  TablePagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { formatDate } from "../../utils/FormatDate";

const ViewPlOutstandingModal = ({ open, onClose, data, availableTypes }) => {
  const hotTableRef = useRef(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [selectedType, setSelectedType] = useState("");

  const textRenderer = (instance, td, row, col, prop, value) => {
    td.innerText = value || "-";
    td.style.color = "black";
    return td;
  };

  const dateRenderer = (instance, td, row, col, prop, value) => {
    td.innerText = formatDate(value);
    return td;
  };

  const columns = [
    {
      data: "pl_number",
      title: "PL Number",
      readOnly: true,
      renderer: textRenderer,
    },
    {
      data: "project",
      title: "Project",
      readOnly: true,
      renderer: (instance, td, row, col, prop, value) => {
        td.innerText = value?.project_number || "-";
        return td;
      },
    },
    {
      data: "destination",
      title: "Destination",
      readOnly: true,
      renderer: (instance, td, row, col, prop, value) => {
        td.innerText = value?.destination || "-";
        return td;
      },
    },
    {
      data: "expedition",
      title: "Expedition",
      readOnly: true,
      renderer: (instance, td, row, col, prop, value) => {
        td.innerText = value?.name || "-";
        return td;
      },
    },
    {
      data: "pl_type",
      title: "PL Type",
      readOnly: true,
      renderer: (instance, td, row, col, prop, value) => {
        td.innerText = value?.name || "-";
        return td;
      },
    },
    {
      data: "pl_date",
      title: "PL Date",
      readOnly: true,
      renderer: dateRenderer,
    },
    {
      data: "ship_date",
      title: "Ship Date",
      readOnly: true,
      renderer: dateRenderer,
    },
    {
      data: "receive_date",
      title: "Receive Date",
      readOnly: true,
      renderer: dateRenderer,
    },
    {
      data: "int_pic",
      title: "INT PIC",
      readOnly: true,
      renderer: (instance, td, row, col, prop, value) => {
        td.innerText = value?.name || "-";
        return td;
      },
    },
    {
      data: "client_pic",
      title: "Client PIC",
      readOnly: true,
      renderer: textRenderer,
    },
    {
      data: "remark",
      title: "Remark",
      readOnly: true,
      renderer: textRenderer,
    },
    {
      data: "creator",
      title: "Created By",
      readOnly: true,
      renderer: (instance, td, row, col, prop, value) => {
        td.innerText = value?.name || "-";
        return td;
      },
    },
  ];

  const filteredData = useMemo(() => {
    if (!selectedType) return data;
    return data.filter((item) => item.pl_type_id == selectedType);
  }, [data, selectedType]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangePageSize = (event) => {
    setPageSize(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleTypeChange = (event) => {
    setSelectedType(event.target.value);
    setPage(0);
  };

  const paginatedData = filteredData.slice(
    page * pageSize,
    page * pageSize + pageSize
  );
  const tableHeight = Math.min(pageSize * 50 + 50, 600);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
      <DialogTitle>
        PL Outstanding ({filteredData.length} items)
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
      </DialogTitle>
      <DialogContent>
        {/* Filter */}
        <div className="mb-4">
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Filter by PL Type</InputLabel>
            <Select
              value={selectedType}
              onChange={handleTypeChange}
              label="Filter by PL Type"
            >
              <MenuItem value="">
                <em>All Types</em>
              </MenuItem>
              {availableTypes.map((type) => (
                <MenuItem key={type.id} value={type.id}>
                  {type.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>

        <div className="table-wrapper">
          <div className="table-inner">
            <HotTable
              ref={hotTableRef}
              data={paginatedData}
              colHeaders={columns.map((c) => c.title)}
              columns={columns}
              width="auto"
              height={tableHeight}
              manualColumnResize
              licenseKey="non-commercial-and-evaluation"
              manualColumnFreeze
              fixedColumnsLeft={2}
              stretchH="all"
              filters
              dropdownMenu
              className="ht-theme-horizon"
              manualColumnMove
              rowHeights={50}
              autoRowSize={false}
            />
          </div>
        </div>
        <TablePagination
          component="div"
          count={filteredData.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={pageSize}
          onRowsPerPageChange={handleChangePageSize}
          rowsPerPageOptions={[10, 25, 50]}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ViewPlOutstandingModal;
