import React, { useEffect, useState } from "react";
import { HotTable } from "@handsontable/react";
import "handsontable/dist/handsontable.full.min.css";
import api from "../../api/api";
import { formatDate } from "../../utils/FormatDate";
import { Box, Typography, TablePagination } from "@mui/material";

export default function OutstandingProjectsTable() {
  const [uploading, setUploading] = useState(false);
  const [picData, setPicData] = useState([]);

  // Pagination state
  const [page, setPage] = useState(0);

  const paginatedPicData = picData.slice(page, page + 1); // 1 PIC per halaman

  const currentYear = new Date().getFullYear();

  const handleChangePage = (event, newPage) => setPage(newPage);

  useEffect(() => {
    api
      .get("/outstanding-projects")
      .then((res) => {
        setPicData(res.data);
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
        setPicData(res.data);
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
        const photo = instance.getDataAtRowProp(row, 7); // kolom foto

        // Dapatkan domain utama React (bisa localhost, IP, atau virtualhost)
        const BASE_URL = window.location.origin;

        // Deteksi apakah sedang di development mode (localhost:5173 misalnya)
        const isLocalDev =
          BASE_URL.includes("localhost") || BASE_URL.includes("127.0.0.1");

        // Base URL Laravel (untuk fallback)
        const LARAVEL_DEV_URL = "http://192.168.0.90:8000";

        // Tentukan sumber gambar
        let imgSrc;

        if (photo) {
          if (photo.startsWith("http")) {
            // Jika URL lengkap, ubah agar sesuai domain publik
            imgSrc = photo
              .replace("localhost", "prolist.citasys")
              .replace("127.0.0.1", "prolist.citasys")
              .replace("192.168.0.90", "prolist.citasys");
          } else {
            // Jika hanya path relatif
            imgSrc = isLocalDev
              ? `${LARAVEL_DEV_URL}/storage/${photo}` // saat dev
              : `${BASE_URL}/storage/${photo}`; // saat production (via Apache proxy)
          }
        } else {
          // Jika tidak ada foto, gunakan avatar
          imgSrc = `https://ui-avatars.com/api/?name=${encodeURIComponent(
            pic || "User"
          )}&background=random&bold=true`;
        }

        // Buat elemen wrapper
        const wrapper = document.createElement("div");
        wrapper.className = "flex flex-col items-center gap-1";

        // Nama PIC
        const span = document.createElement("span");
        span.className = "text-gray-800 font-medium";
        span.textContent = pic || "-";
        wrapper.appendChild(span);

        // Gambar PIC
        const img = document.createElement("img");
        img.src = imgSrc;
        img.alt = pic || "User";
        img.className = "w-24 h-24 rounded object-cover border border-gray-300";
        img.onerror = function () {
          this.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
            pic || "User"
          )}&background=random&bold=true`;
        };
        wrapper.appendChild(img);

        // Masukkan ke dalam cell
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

  const formatted = [];
  const merges = [];
  let rowIndex = 0;

  paginatedPicData.forEach((item) => {
    if (item.projects.length === 0) {
      // Jika PIC tidak ada project, tetap tampilkan nama dan foto
      formatted.push([
        item.pic,
        "",
        "",
        "",
        "",
        "",
        item.user_id,
        item.photo ?? null,
      ]);
      rowIndex += 1;
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
          index === 0 ? item.user_id : null,
          index === 0 ? item.photo ?? null : null,
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

  const tableHeight = 600; // Tinggi table tetap untuk tampilan yang konsisten

  return (
    <Box p={4}>
      <Typography variant="h5" gutterBottom>
        List Project Outstanding Tahun {currentYear}
      </Typography>

      <HotTable
        data={formatted}
        colHeaders={columns.map((c) => c.title)}
        columns={columns}
        colWidths={[200, 150, 200, 200, 150, 400, 150]}
        width="100%"
        height={tableHeight}
        stretchH="all"
        wordWrap={true}
        mergeCells={merges}
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
          count={picData.length} // jumlah PIC
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={1} // 1 PIC per halaman
          rowsPerPageOptions={[1]}
        />
      </Box>
    </Box>
  );
}
