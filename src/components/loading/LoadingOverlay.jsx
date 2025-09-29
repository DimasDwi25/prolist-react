import React from "react";
import { Box, CircularProgress } from "@mui/material";

export default function LoadingOverlay({ loading }) {
  if (!loading) return null;

  return (
    <Box
      sx={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        bgcolor: "rgba(255,255,255,0.7)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 10,
      }}
    >
      <CircularProgress />
    </Box>
  );
}
