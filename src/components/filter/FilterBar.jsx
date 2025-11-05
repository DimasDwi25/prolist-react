import React, { useState, useEffect } from "react";
import {
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Button,
} from "@mui/material";

export default function FilterBar({
  stats,
  onFilter,
  initialFilters,
  loading = false,
}) {
  const currentYear = new Date().getFullYear();

  const months = [
    { value: 1, label: "Januari" },
    { value: 2, label: "Februari" },
    { value: 3, label: "Maret" },
    { value: 4, label: "April" },
    { value: 5, label: "Mei" },
    { value: 6, label: "Juni" },
    { value: 7, label: "Juli" },
    { value: 8, label: "Agustus" },
    { value: 9, label: "September" },
    { value: 10, label: "Oktober" },
    { value: 11, label: "November" },
    { value: 12, label: "Desember" },
  ];

  const [selectedYear, setSelectedYear] = useState(
    initialFilters?.year || currentYear
  );
  const [rangeType, setRangeType] = useState(
    initialFilters?.rangeType || "monthly"
  );
  const [selectedMonth, setSelectedMonth] = useState(
    initialFilters?.month || null
  );
  const [customFrom, setCustomFrom] = useState(initialFilters?.from || "");
  const [customTo, setCustomTo] = useState(initialFilters?.to || "");

  // Trigger parent callback saat filter berubah
  useEffect(() => {
    onFilter({
      year: selectedYear,
      rangeType,
      month: selectedMonth,
      from: customFrom,
      to: customTo,
    });
  }, [selectedYear, rangeType, selectedMonth, customFrom, customTo]);

  const handleClear = () => {
    setSelectedYear(currentYear);
    setRangeType("monthly");
    setSelectedMonth(null);
    setCustomFrom("");
    setCustomTo("");
  };

  return (
    <Box
      display="flex"
      flexWrap="wrap"
      gap={1.5}
      alignItems="center"
      mb={3}
      sx={{
        backgroundColor: "#f3f4f6",
        p: 2,
        borderRadius: 2,
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      }}
    >
      {/* Tahun */}
      <FormControl size="small" sx={{ minWidth: 100 }}>
        <InputLabel>Tahun</InputLabel>
        <Select
          value={selectedYear}
          label="Tahun"
          onChange={(e) => setSelectedYear(Number(e.target.value))}
        >
          {stats.availableYears?.map((y) => (
            <MenuItem key={y} value={y}>
              {y}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Range Type */}
      <FormControl size="small" sx={{ minWidth: 120 }}>
        <InputLabel>Range</InputLabel>
        <Select
          value={rangeType}
          label="Range"
          onChange={(e) => setRangeType(e.target.value)}
        >
          <MenuItem value="yearly">Yearly</MenuItem>
          <MenuItem value="monthly">Monthly</MenuItem>
          <MenuItem value="weekly">Weekly</MenuItem>
          <MenuItem value="custom">Custom</MenuItem>
        </Select>
      </FormControl>

      {/* Pilih bulan jika monthly */}
      {rangeType === "monthly" && (
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Bulan</InputLabel>
          <Select
            value={selectedMonth || ""}
            label="Bulan"
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
          >
            {months.map((m) => (
              <MenuItem key={m.value} value={m.value}>
                {m.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {/* Pilih tanggal jika custom */}
      {rangeType === "custom" && (
        <>
          <TextField
            label="From"
            type="date"
            size="small"
            value={customFrom}
            onChange={(e) => setCustomFrom(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 130 }}
          />
          <TextField
            label="To"
            type="date"
            size="small"
            value={customTo}
            onChange={(e) => setCustomTo(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 130 }}
          />
        </>
      )}

      {/* Clear Filter */}
      <Button
        variant="outlined"
        color="secondary"
        size="small"
        onClick={handleClear}
        disabled={loading}
        sx={{ minWidth: 100 }}
      >
        {loading ? "Filtering..." : "Clear"}
      </Button>
    </Box>
  );
}
