import React, { useEffect, useState } from "react";
import { HotTable } from "@handsontable/react";
import "handsontable/dist/handsontable.full.min.css";
import api from "../../api/api";
import { formatDate } from "../../utils/FormatDate";
import { Box, Typography, TablePagination } from "@mui/material";

export default function OutstandingProjectsTable() {
  const [data, setData] = useState([]);
  const [mergeCells, setMergeCells] = useState([]);
  const [uploading, setUploading] = useState(false);

  // Pagination state
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const currentYear = new Date().getFullYear();

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangePageSize = (event) => {
    setPageSize(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedData = data.slice(page * pageSize, page * pageSize + pageSize);

  const paginatedMergeCells = mergeCells
    .map((m) => ({
      ...m,
      row: m.row - page * pageSize,
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
            formatted.push([
              item.pic,
              "-",
              "-",
              "-",
              "-",
              "-",
              item.user_id,
              item.photo,
            ]);
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
                index === 0 ? item.user_id : null, // kolom user_id tersembunyi, hanya di row pertama
                index === 0 ? item.photo ?? null : null, // kolom photo untuk PIC
              ]);
            });

            if (item.projects.length > 1) {
              merges.push({
                row: rowIndex,
                col: 0,
                rowspan: item.projects.length,
                colspan: 1,
              });
              merges.push({
                row: rowIndex,
                col: 6,
                rowspan: item.projects.length,
                colspan: 1,
              });
            }
            rowIndex += item.projects.length;
          }
        });
        console.log(formatted);
        setData(formatted);
        setMergeCells(merges);
      })
      .catch((err) => console.error(err));
  }, []);

  const handleUpload = (userId) => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";

    fileInput.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const formData = new FormData();
      formData.append("photo", file);

      try {
        setUploading(true);
        await api.post(`/users/${userId}/upload-photo`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        alert("Photo uploaded successfully!");
        // refresh data
        const res = await api.get("/outstanding-projects");
        const formatted = [];
        const merges = [];
        let rowIndex = 0;

        res.data.forEach((item) => {
          if (!item.projects || item.projects.length === 0) {
            formatted.push([
              item.pic,
              "-",
              "-",
              "-",
              "-",
              "-",
              item.user_id,
              item.photo,
            ]);
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
                index === 0 ? item.user_id : null, // kolom user_id tersembunyi, hanya di row pertama
                index === 0 ? item.photo ?? null : null, // kolom photo untuk PIC
              ]);
            });

            if (item.projects.length > 1) {
              merges.push({
                row: rowIndex,
                col: 0,
                rowspan: item.projects.length,
                colspan: 1,
              });
              merges.push({
                row: rowIndex,
                col: 6,
                rowspan: item.projects.length,
                colspan: 1,
              });
            }
            rowIndex += item.projects.length;
          }
        });
        setData(formatted);
        setMergeCells(merges);
      } catch (err) {
        console.error(err);
        alert("Failed to upload photo");
      } finally {
        setUploading(false);
      }
    };

    fileInput.click();
  };

  const columns = [
    {
      data: 0,
      title: "PIC",
      renderer: function (instance, td, row, col, prop, value) {
        const pic = value; // kolom nama PIC
        const photo = instance.getDataAtRowProp(row, 7); //
        const imgSrc = photo
          ? photo.startsWith("http")
            ? photo.replace("localhost", "127.0.0.1").includes(":8000")
              ? photo.replace("localhost", "127.0.0.1")
              : photo.replace("localhost", "127.0.0.1:8000") // tambahkan :8000 jika tidak ada
            : `http://127.0.0.1:8000/storage/${photo}`
          : `https://ui-avatars.com/api/?name=${encodeURIComponent(
              pic || "User"
            )}&background=random&bold=true`;

        // Create wrapper div
        const wrapper = document.createElement("div");
        wrapper.className = "flex flex-col items-center gap-1";
        // wrapper.className = "flex items-center justify-start gap-2";

        // Create span for name
        const span = document.createElement("span");
        span.className = "text-gray-800 font-medium";
        span.textContent = pic;
        wrapper.appendChild(span);

        // Create img
        const img = document.createElement("img");
        img.src = imgSrc;
        img.alt = pic;
        img.className = "w-24 h-24 rounded object-cover border border-gray-300";
        img.onerror = function () {
          this.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
            pic
          )}&background=random&bold=true`;
        };
        wrapper.appendChild(img);

        td.innerHTML = "";
        td.appendChild(wrapper);
        return td;
      },
    },
    { data: 1, title: "Project Number" },
    { data: 2, title: "Project Name" },
    { data: 3, title: "Client" },
    { data: 4, title: "Target Date" },
    { data: 5, title: "Progress Update (3 latest)" },
    {
      data: 6,
      title: "Action",
      renderer: (instance, td, row) => {
        const rowData = instance.getDataAtRow(row);
        const userId = rowData ? rowData[6] : null;

        td.innerHTML = `<button class="upload-btn px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 disabled:bg-gray-400">Upload Photo</button>`;
        if (userId) {
          td.firstChild.onclick = () => handleUpload(userId);
          td.firstChild.disabled = uploading;
        } else {
          td.firstChild.disabled = true;
        }

        return td;
      },
    },
  ];

  const tableHeight = Math.min(pageSize * 40 + 50, window.innerHeight - 250);

  return (
    <Box p={4}>
      <Typography variant="h5" gutterBottom>
        List Project Outstanding Tahun {currentYear}
      </Typography>

      <HotTable
        data={paginatedData}
        colHeaders={columns.map((c) => c.title)}
        columns={columns}
        colWidths={[200, 150, 200, 200, 150, 400, 150]}
        width="100%"
        height={tableHeight}
        stretchH="all"
        wordWrap={true}
        mergeCells={paginatedMergeCells}
        licenseKey="non-commercial-and-evaluation"
        className="ht-theme-horizon"
        cells={(row, col) => {
          const cellProperties = {};
          if (col === 0 || col === 6)
            cellProperties.className = "htCenter htMiddle";
          return cellProperties;
        }}
      />

      {uploading && (
        <Typography color="blue" mt={1}>
          Uploading photo...
        </Typography>
      )}

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
