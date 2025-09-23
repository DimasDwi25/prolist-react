import React, { useState, useRef, useEffect } from "react";
import { DataGrid } from "@mui/x-data-grid";
import {
  Box,
  FormControl,
  FormGroup,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import FreezeColumnModal from "./FreezeColumnModal";

export default function InteractiveFreezeGrid({
  rows,
  columns,
  paginationModel,
  onPaginationModelChange,
  pageSizeOptions = [10, 20, 50],
}) {
  const [frozenColumns, setFrozenColumns] = useState([]);
  const scrollRef = useRef(null);
  const mainRef = useRef(null);

  const toggleColumn = (field) => {
    setFrozenColumns((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field]
    );
  };

  // Split columns
  const frozenCols = columns.filter((col) => frozenColumns.includes(col.field));
  const otherCols = columns.filter((col) => !frozenColumns.includes(col.field));

  // Pagination slice

  // Sinkronisasi scroll vertical
  const handleScroll = (e) => {
    if (mainRef.current) {
      mainRef.current.scrollTop = e.target.scrollTop;
    }
  };

  useEffect(() => {
    if (scrollRef.current && mainRef.current) {
      scrollRef.current.onscroll = handleScroll;
    }
  }, [scrollRef.current, mainRef.current]);

  return (
    <Box>
      {/* Checkbox freeze */}
      <FreezeColumnModal
        columns={columns}
        frozenColumns={frozenColumns}
        toggleColumn={toggleColumn}
      />

      {/* Grid */}
      <Box display="flex" width="100%" height={600}>
        {/* Frozen Columns */}
        {frozenCols.length > 0 && (
          <Box
            sx={{
              minWidth: frozenCols.length * 150,
              borderRight: "1px solid rgba(224,224,224,1)",
              "& .MuiDataGrid-virtualScroller": { overflowY: "hidden" },
            }}
          >
            <DataGrid
              rows={rows} // gunakan slice rows
              columns={frozenCols}
              autoHeight
              hideFooter
              showToolbar
              disableColumnMenu
              rowHeight={40}
              pagination
              paginationModel={paginationModel}
              onPaginationModelChange={onPaginationModelChange}
              pageSizeOptions={pageSizeOptions}
              getRowId={(row) => row.id}
              ref={scrollRef}
              sx={{ "& .MuiDataGrid-row": { cursor: "pointer" } }}
            />
          </Box>
        )}

        {/* Scrollable Columns */}
        <Box sx={{ flex: 1, overflowX: "auto" }} ref={mainRef}>
          <DataGrid
            rows={rows} // gunakan slice rows
            columns={otherCols}
            autoHeight
            disableSelectionOnClick
            showToolbar
            rowHeight={40}
            pagination
            paginationModel={paginationModel}
            onPaginationModelChange={onPaginationModelChange}
            pageSizeOptions={pageSizeOptions}
            getRowId={(row) => row.id}
            sx={{
              ".MuiDataGrid-columnHeaders": {
                backgroundColor: "#f5f5f5",
                fontWeight: 600,
              },
              "& .MuiDataGrid-row": { cursor: "pointer" },
            }}
          />
        </Box>
      </Box>
    </Box>
  );
}
