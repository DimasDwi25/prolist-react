import React, { useEffect, useState } from "react";
import { HotTable } from "@handsontable/react";
import "handsontable/dist/handsontable.full.min.css";
import api from "../../api/api";
import { formatDate } from "../../utils/FormatDate";
import { Box, Typography, TablePagination } from "@mui/material";

export default function OutstandingProjectsTable() {
  const [data, setData] = useState([]);
  const [mergeCells, setMergeCells] = useState([]);

  // Pagination state
  const [page, setPage] = useState(0); // MUI TablePagination menggunakan 0-based index
  const [pageSize, setPageSize] = useState(10);

  const currentYear = new Date().getFullYear();

  // Handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangePageSize = (event) => {
    setPageSize(parseInt(event.target.value, 10));
    setPage(0); // reset ke page pertama
  };

  // Data paginated
  const paginatedData = data.slice(page * pageSize, page * pageSize + pageSize);

  const paginatedMergeCells = mergeCells
    .map((m) => ({
      ...m,
      row: m.row - page * pageSize, // sesuaikan index merge cell
    }))
    .filter((m) => m.row >= 0 && m.row < pageSize);

  useEffect(() => {
    api
      .get("/outstanding-projects")
      .then((res) => {
        const formatted = [];
        const merges = [];
        let rowIndex = 0;

        res.data.forEach((item) => {
          if (!item.projects || item.projects.length === 0) {
            formatted.push([item.pic, "-", "-", "-", "-", "-"]);
            rowIndex++;
          } else {
            item.projects.forEach((proj, index) => {
              formatted.push([
                index === 0 ? item.pic : "",
                proj.project_number,
                proj.project_name,
                proj.client ?? "-",
                formatDate(proj.target_date),
                (proj.logs ?? [])
                  .slice(-3)
                  .map((l) => l.log)
                  .join("\n"),
              ]);
            });

            if (item.projects.length > 1) {
              merges.push({
                row: rowIndex,
                col: 0,
                rowspan: item.projects.length,
                colspan: 1,
              });
            }
            rowIndex += item.projects.length;
          }
        });

        setData(formatted);
        setMergeCells(merges);
      })
      .catch((err) => console.error(err));
  }, []);

  // Tinggi tabel menyesuaikan pageSize
  const tableHeight = pageSize * 40 + 50;

  return (
    <Box p={4}>
      <Typography variant="h5" gutterBottom>
        List Project Outstanding Tahun {currentYear}
      </Typography>

      <HotTable
        data={paginatedData}
        colHeaders={[
          "PIC",
          "Project Number",
          "Project Name",
          "Client",
          "Target Date",
          "Progress Update (3 latest)",
        ]}
        colWidths={[120, 150, 200, 200, 150, 400]}
        rowHeaders={true}
        width="100%"
        height={tableHeight}
        stretchH="all"
        wordWrap={true}
        mergeCells={paginatedMergeCells}
        licenseKey="non-commercial-and-evaluation"
        className="ht-theme-horizon"
        cells={(row, col) => {
          const cellProperties = {};
          if (col === 0) {
            cellProperties.className = "htCenter htMiddle";
          }
          return cellProperties;
        }}
      />

      {/* MUI TablePagination */}
      <Box display="flex" justifyContent="flex-end" mt={2}>
        <TablePagination
          component="div"
          count={data.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={pageSize}
          onRowsPerPageChange={handleChangePageSize}
          rowsPerPageOptions={[10, 25, 50]}
        />
      </Box>
    </Box>
  );
}
