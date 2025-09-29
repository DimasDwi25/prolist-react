import { Typography } from "@mui/material";

/**
 * Format value nominal ke IDR
 * @param {any} value - nilai input
 * @returns {object} { value: number|null, formatted: string, render: JSX.Element }
 */
export function formatValue(value) {
  let processedValue = value;

  if (value === "" || value === undefined || isNaN(value)) {
    processedValue = null;
  } else {
    processedValue = Number(value);
  }

  const formatted =
    processedValue != null
      ? new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
          maximumFractionDigits: 0,
        }).format(processedValue)
      : "-";

  const render = (
    <Typography
      fontWeight={600}
      color={processedValue != null ? "green" : "text.secondary"}
    >
      {formatted}
    </Typography>
  );

  return { value: processedValue, formatted, render };
}
