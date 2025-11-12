import React, { useState, useRef } from "react";
import { HotTable } from "@handsontable/react";
import Handsontable from "handsontable";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { formatDate } from "../../utils/FormatDate";

const ViewMrOutstandingModal = ({ open, onClose, data }) => {
  const hotTableRef = useRef(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const textRenderer = (instance, td, row, col, prop, value) => {
    td.innerText = value || "-";
    td.style.color = "black";
    return td;
  };

  const dateRenderer = (instance, td, row, col, prop, value) => {
    td.innerText = formatDate(value);
    return td;
  };

  const statusRenderer = (instance, td, row, col, prop, value) => {
    td.innerText = value?.name || "-";
    return td;
  };

  const columns = [
    {
      data: "material_number",
      title: "Material Number",
      readOnly: true,
      renderer: textRenderer,
    },
    {
      data: "material_description",
      title: "Description",
      readOnly: true,
      renderer: textRenderer,
    },
    {
      data: "created_at",
      title: "Created At",
      readOnly: true,
      renderer: dateRenderer,
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
    {
      data: "mr_handover",
      title: "Handover To",
      readOnly: true,
      renderer: (instance, td, row, col, prop, value) => {
        td.innerText = value?.name || "-";
        return td;
      },
    },
    {
      data: "target_date",
      title: "Target Date",
      readOnly: true,
      renderer: dateRenderer,
    },
    {
      data: "material_status",
      title: "Status",
      readOnly: true,
      renderer: statusRenderer,
    },
    {
      data: "remark",
      title: "Remark",
      readOnly: true,
      renderer: textRenderer,
    },
  ];

  const paginatedData = data.slice(page * pageSize, page * pageSize + pageSize);
  const tableHeight = Math.min(pageSize * 50 + 50, 600);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
      <DialogTitle>
        MR Outstanding ({data.length} items)
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
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ViewMrOutstandingModal;
