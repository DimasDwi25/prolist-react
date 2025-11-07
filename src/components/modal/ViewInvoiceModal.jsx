import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Divider,
  Paper,
  Card,
  CardContent,
  Chip,
  Stack,
} from "@mui/material";
import {
  Info as InfoIcon,
  AttachMoney as AttachMoneyIcon,
  Schedule as ScheduleIcon,
  Description as DescriptionIcon,
  Receipt as ReceiptIcon,
} from "@mui/icons-material";
import { formatValue } from "../../utils/formatValue";
import { formatDate } from "../../utils/FormatDate";
import api from "../../api/api";
import LoadingOverlay from "../loading/LoadingOverlay";

const ViewInvoiceModal = ({ open, onClose, invoice }) => {
  const [holdingTax, setHoldingTax] = useState(null);
  const [loadingHoldingTax, setLoadingHoldingTax] = useState(false);

  const fetchHoldingTax = async () => {
    if (!invoice?.invoice_id) return;
    setLoadingHoldingTax(true);
    try {
      const response = await api.get(
        `/finance/holding-taxes/invoice?invoice_id=${encodeURIComponent(
          invoice.invoice_id
        )}`
      );

      setHoldingTax(response.data.data.holding_tax);
    } catch (err) {
      console.error("Failed to fetch holding tax:", err);
      setHoldingTax(null);
    } finally {
      setLoadingHoldingTax(false);
    }
  };

  useEffect(() => {
    if (open && invoice?.invoice_id) {
      fetchHoldingTax();
    }
  }, [open, invoice?.invoice_id]);

  if (!invoice) return null;
  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle
        sx={{
          backgroundColor: "primary.main",
          color: "white",
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <InfoIcon />
        <Typography variant="body1" fontWeight="bold">
          Invoice Details - {invoice.invoice_id}
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ p: 3 }}>
        <Box sx={{ position: "relative", mt: 2 }}>
          <LoadingOverlay loading={loadingHoldingTax} />
          <Stack spacing={3}>
            {/* Basic Information */}
            <Card elevation={2} sx={{ borderRadius: 2 }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <InfoIcon color="primary" />
                  <Typography variant="h6" color="primary" fontWeight="bold">
                    Basic Information
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      fontWeight="bold"
                    >
                      Invoice ID
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {invoice.invoice_id || "-"}
                    </Typography>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      fontWeight="bold"
                    >
                      Project Number
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {invoice.project_number || "-"}
                    </Typography>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      fontWeight="bold"
                    >
                      Project Name
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {invoice.project?.project_name ||
                        invoice.project_name ||
                        "-"}
                    </Typography>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      fontWeight="bold"
                    >
                      Client Name
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {invoice.project?.client?.name ||
                        invoice.project?.quotation?.client?.name ||
                        invoice.client_name ||
                        "-"}
                    </Typography>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      fontWeight="bold"
                    >
                      PO Number
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {invoice.po_number || "-"}
                    </Typography>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      fontWeight="bold"
                    >
                      PO Value
                    </Typography>
                    <Typography variant="body1" fontWeight="bold" color="green">
                      {invoice.po_value
                        ? formatValue(invoice.po_value).formatted
                        : "-"}
                    </Typography>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      fontWeight="bold"
                    >
                      Invoice Type
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {invoice.invoice_type || "-"}
                    </Typography>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      fontWeight="bold"
                    >
                      No Faktur
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {invoice.no_faktur || "-"}
                    </Typography>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      fontWeight="bold"
                    >
                      Invoice Date
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {formatDate(invoice.invoice_date)}
                    </Typography>
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      fontWeight="bold"
                    >
                      Description
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {invoice.invoice_description || "-"}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Financial Information */}
            <Card elevation={2} sx={{ borderRadius: 2 }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <AttachMoneyIcon color="primary" />
                  <Typography variant="h6" color="primary" fontWeight="bold">
                    Financial Information
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      fontWeight="bold"
                    >
                      Invoice Value
                    </Typography>
                    <Typography variant="body1" fontWeight="bold" color="green">
                      {formatValue(invoice.invoice_value).formatted}
                    </Typography>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      fontWeight="bold"
                    >
                      Due Date
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {formatDate(invoice.invoice_due_date)}
                    </Typography>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      fontWeight="bold"
                    >
                      Payment Status
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {invoice.payment_status || "-"}
                    </Typography>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      fontWeight="bold"
                    >
                      Total Payment Amount
                    </Typography>
                    <Typography variant="body1" fontWeight="bold" color="green">
                      {formatValue(invoice.total_payment_amount).formatted}
                    </Typography>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      fontWeight="bold"
                    >
                      Payment Percentage
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {invoice.payment_percentage
                        ? `${invoice.payment_percentage}%`
                        : "-"}
                    </Typography>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      fontWeight="bold"
                    >
                      Currency
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {invoice.currency || "-"}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Additional Information */}
            <Card elevation={2} sx={{ borderRadius: 2 }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <DescriptionIcon color="primary" />
                  <Typography variant="h6" color="primary" fontWeight="bold">
                    Additional Information
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12 }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      fontWeight="bold"
                    >
                      Remarks
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {invoice.remarks || "-"}
                    </Typography>
                  </Grid>

                  {invoice.created_at && (
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        fontWeight="bold"
                      >
                        Created At
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {formatDate(invoice.created_at)}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>

            {/* Holding Tax Information */}
            {holdingTax && (
              <Card elevation={2} sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <ReceiptIcon color="primary" />
                    <Typography variant="h6" color="primary" fontWeight="bold">
                      With Holding Tax Information
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        fontWeight="bold"
                      >
                        PPh 23 Rate
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {holdingTax.pph23_rate !== null &&
                        holdingTax.pph23_rate !== undefined
                          ? `${(holdingTax.pph23_rate * 100).toFixed(2)}%`
                          : "-"}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        fontWeight="bold"
                      >
                        Nilai PPh 23
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {holdingTax.nilai_pph23 !== null &&
                        holdingTax.nilai_pph23 !== undefined
                          ? formatValue(holdingTax.nilai_pph23).formatted
                          : "-"}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        fontWeight="bold"
                      >
                        PPh 42 Rate
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {holdingTax.pph42_rate !== null &&
                        holdingTax.pph42_rate !== undefined
                          ? `${(holdingTax.pph42_rate * 100).toFixed(2)}%`
                          : "-"}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        fontWeight="bold"
                      >
                        Nilai PPh 42
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {holdingTax.nilai_pph42 !== null &&
                        holdingTax.nilai_pph42 !== undefined
                          ? formatValue(holdingTax.nilai_pph42).formatted
                          : "-"}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        fontWeight="bold"
                      >
                        No Bukti Potong
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {holdingTax.no_bukti_potong || "-"}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        fontWeight="bold"
                      >
                        Nilai Potongan
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {holdingTax.nilai_potongan !== null &&
                        holdingTax.nilai_potongan !== undefined
                          ? formatValue(holdingTax.nilai_potongan).formatted
                          : "-"}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        fontWeight="bold"
                      >
                        Tanggal WHT
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {holdingTax.tanggal_wht
                          ? formatDate(holdingTax.tanggal_wht)
                          : "-"}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            )}
          </Stack>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 2 }}>
        <Button
          onClick={onClose}
          variant="contained"
          color="primary"
          sx={{ borderRadius: 2, px: 4, py: 1.5, fontWeight: "bold" }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ViewInvoiceModal;
