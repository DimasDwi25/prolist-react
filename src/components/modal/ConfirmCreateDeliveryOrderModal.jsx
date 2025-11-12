import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  CircularProgress,
  Box,
  Divider,
  Chip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import IconButton from "@mui/material/IconButton";
import { formatDate } from "../../utils/FormatDate";

export default function ConfirmCreateDeliveryOrderModal({
  open,
  onClose,
  onConfirm,
  loading,
  packingList,
  confirmData,
}) {
  // Generate preview of delivery order data
  const generateDeliveryOrderPreview = () => {
    if (!packingList) return null;

    const year = new Date().getFullYear().toString().slice(-2); // Get last 2 digits of year
    const prefix = "SP" + year;
    const doPrefix = "SP/" + year + "/";

    // This is a preview, actual numbering will be done on backend
    const previewDoNumber = `${prefix}XXX`;
    const previewDoNo = `${doPrefix}XXX`;

    return {
      do_number: previewDoNumber,
      do_no: previewDoNo,
      do_description: "Packing List Type Finance",
      pn_id: confirmData?.project_number || packingList.project?.project_number,
      do_send: confirmData?.ship_date || packingList.ship_date,
      client_name:
        confirmData?.client ||
        packingList.project?.client?.name ||
        packingList.project?.quotation?.client?.name ||
        "N/A",
    };
  };

  const doPreview = generateDeliveryOrderPreview();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "#f5f5f5",
        }}
      >
        <div style={{ fontWeight: 600, fontSize: "1.25rem", lineHeight: 1.6 }}>
          Create Delivery Order
        </div>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom color="primary">
          Packing List Information
        </Typography>
        <Box sx={{ mb: 3 }}>
          <Typography variant="body1" gutterBottom>
            <strong>PL Number:</strong>{" "}
            {confirmData?.packing_list?.pl_number ||
              packingList?.pl_number ||
              "N/A"}
          </Typography>
          <Typography variant="body1" gutterBottom>
            <strong>Type:</strong>{" "}
            <Chip
              label={
                confirmData?.type_packing_list ||
                packingList?.plType?.name ||
                "N/A"
              }
              color="primary"
              size="small"
            />
          </Typography>
          <Typography variant="body1" gutterBottom>
            <strong>Project:</strong>{" "}
            {confirmData?.project_number ||
              packingList?.project?.project_number ||
              "N/A"}
          </Typography>
          <Typography variant="body1" gutterBottom>
            <strong>Client:</strong>{" "}
            {confirmData?.client || doPreview?.client_name || "N/A"}
          </Typography>
          <Typography variant="body1" gutterBottom>
            <strong>Ship Date:</strong>{" "}
            {formatDate(confirmData?.ship_date || packingList?.ship_date) ||
              "N/A"}
          </Typography>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom color="secondary">
          Delivery Order Preview
        </Typography>
        <Box sx={{ backgroundColor: "#f9f9f9", p: 2, borderRadius: 1 }}>
          <Typography variant="body2" gutterBottom>
            <strong>DO Number:</strong> {doPreview?.do_number}
          </Typography>
          <Typography variant="body2" gutterBottom>
            <strong>DO No:</strong> {doPreview?.do_no}
          </Typography>
          <Typography variant="body2" gutterBottom>
            <strong>Description:</strong> {doPreview?.do_description}
          </Typography>
          <Typography variant="body2" gutterBottom>
            <strong>Project Number:</strong> {doPreview?.pn_id}
          </Typography>
          <Typography variant="body2" gutterBottom>
            <strong>Send Date:</strong> {formatDate(doPreview?.do_send)}
          </Typography>
          <Typography variant="body2" gutterBottom>
            <strong>Source:</strong> PL ID {packingList?.pl_id}
          </Typography>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
          This will create a new Delivery Order linked to this Packing List. Do
          you want to proceed?
        </Typography>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, backgroundColor: "#f5f5f5" }}>
        <Button onClick={onClose} variant="outlined" color="inherit">
          Skip
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={onConfirm}
          disabled={loading}
          sx={{ minWidth: 150 }}
        >
          {loading ? <CircularProgress size={20} /> : "Create Delivery Order"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
