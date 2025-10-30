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
  TextField,
  Divider,
  Card,
  CardContent,
  Chip,
  Stack,
} from "@mui/material";
import { Edit, FileText, Calculator, Calendar, Receipt } from "lucide-react";
import api from "../../api/api";
import LoadingOverlay from "../loading/LoadingOverlay";
import { formatDate } from "../../utils/FormatDate";
import { formatValue } from "../../utils/formatValue";

const ViewHoldingTaxModal = ({ open, onClose, invoiceId, onEdit }) => {
  const [holdingTax, setHoldingTax] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchHoldingTax = async () => {
    if (!invoiceId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(
        `/finance/holding-taxes/invoice/${invoiceId}`
      );
      setHoldingTax(response.data.data.holding_tax);
    } catch (err) {
      console.error("Failed to fetch holding tax:", err);
      setError("Holding tax not found for this invoice");
      setHoldingTax(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && invoiceId) {
      fetchHoldingTax();
    }
  }, [open, invoiceId]);

  const handleEdit = () => {
    if (onEdit) {
      onEdit(holdingTax);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={2}>
            <Receipt size={24} color="#1976d2" />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                With Holding Tax Details
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Invoice #{invoiceId}
              </Typography>
            </Box>
          </Box>
          {holdingTax && (
            <Button
              variant="contained"
              startIcon={<Edit size={16} />}
              size="small"
              onClick={handleEdit}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 500,
                boxShadow: "0 2px 8px rgba(25, 118, 210, 0.2)",
                "&:hover": {
                  boxShadow: "0 4px 12px rgba(25, 118, 210, 0.3)",
                },
              }}
            >
              Edit WHT
            </Button>
          )}
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ position: "relative", minHeight: 300 }}>
          <LoadingOverlay loading={loading} />

          {error ? (
            <Box sx={{ textAlign: "center", py: 6 }}>
              <Typography variant="h6" color="error" sx={{ mb: 1 }}>
                {error}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Unable to load holding tax information
              </Typography>
            </Box>
          ) : holdingTax ? (
            <Stack spacing={3}>
              {/* Invoice Information Card */}
              <Card
                sx={{ borderRadius: 2, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
              >
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <FileText size={20} color="#1976d2" />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Invoice Information
                    </Typography>
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Box sx={{ mb: 1 }}>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 0.5 }}
                        >
                          PN Number
                        </Typography>
                        <Chip
                          label={
                            holdingTax.invoice?.project?.pn_number || "N/A"
                          }
                          variant="outlined"
                          size="small"
                          sx={{ borderRadius: 1 }}
                        />
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Box sx={{ mb: 1 }}>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 0.5 }}
                        >
                          Project Name
                        </Typography>
                        <Chip
                          label={
                            holdingTax.invoice?.project?.project_name || "N/A"
                          }
                          variant="outlined"
                          size="small"
                          sx={{ borderRadius: 1 }}
                        />
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Box sx={{ mb: 1 }}>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 0.5 }}
                        >
                          Client
                        </Typography>
                        <Chip
                          label={
                            holdingTax.invoice?.project?.client?.name ||
                            holdingTax.invoice?.project?.quotation?.client
                              ?.name ||
                            "N/A"
                          }
                          variant="outlined"
                          size="small"
                          sx={{ borderRadius: 1 }}
                        />
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Box sx={{ mb: 1 }}>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 0.5 }}
                        >
                          Invoice ID
                        </Typography>
                        <Chip
                          label={holdingTax.invoice?.invoice_id || "N/A"}
                          variant="outlined"
                          size="small"
                          sx={{ borderRadius: 1 }}
                        />
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Box sx={{ mb: 1 }}>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 0.5 }}
                        >
                          Invoice Type
                        </Typography>
                        <Chip
                          label={
                            holdingTax.invoice?.invoice_type?.code_type || "N/A"
                          }
                          variant="outlined"
                          size="small"
                          sx={{ borderRadius: 1 }}
                        />
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Box sx={{ mb: 1 }}>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 0.5 }}
                        >
                          Total Invoice
                        </Typography>
                        <Typography
                          variant="h6"
                          sx={{ fontWeight: 600, color: "#1976d2" }}
                        >
                          {holdingTax.invoice?.total_invoice
                            ? formatValue(holdingTax.invoice.total_invoice)
                                .formatted
                            : "Not set"}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* PPh 23 Card */}
              <Card
                sx={{ borderRadius: 2, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
              >
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <Calculator size={20} color="#2e7d32" />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      PPh 23 Details
                    </Typography>
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Box sx={{ p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          PPh 23 Rate
                        </Typography>
                        <Typography
                          variant="h6"
                          sx={{ fontWeight: 600, color: "#2e7d32" }}
                        >
                          {holdingTax.pph23_rate !== null &&
                          holdingTax.pph23_rate !== undefined
                            ? `${(holdingTax.pph23_rate * 100).toFixed(2)}%`
                            : "Not set"}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Box sx={{ p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Nilai PPh 23
                        </Typography>
                        <Typography
                          variant="h6"
                          sx={{ fontWeight: 600, color: "#2e7d32" }}
                        >
                          {holdingTax.nilai_pph23 !== null &&
                          holdingTax.nilai_pph23 !== undefined
                            ? formatValue(holdingTax.nilai_pph23).formatted
                            : "Not set"}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* PPh 42 Card */}
              <Card
                sx={{ borderRadius: 2, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
              >
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <Calculator size={20} color="#ed6c02" />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      PPh 42 Details
                    </Typography>
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Box sx={{ p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          PPh 42 Rate
                        </Typography>
                        <Typography
                          variant="h6"
                          sx={{ fontWeight: 600, color: "#ed6c02" }}
                        >
                          {holdingTax.pph42_rate !== null &&
                          holdingTax.pph42_rate !== undefined
                            ? `${(holdingTax.pph42_rate * 100).toFixed(2)}%`
                            : "Not set"}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Box sx={{ p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Nilai PPh 42
                        </Typography>
                        <Typography
                          variant="h6"
                          sx={{ fontWeight: 600, color: "#ed6c02" }}
                        >
                          {holdingTax.nilai_pph42 !== null &&
                          holdingTax.nilai_pph42 !== undefined
                            ? formatValue(holdingTax.nilai_pph42).formatted
                            : "Not set"}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Additional Information Card */}
              <Card
                sx={{ borderRadius: 2, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
              >
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <Calendar size={20} color="#9c27b0" />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Additional Information
                    </Typography>
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <Box sx={{ p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          No Bukti Potong
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {holdingTax.no_bukti_potong !== null &&
                          holdingTax.no_bukti_potong !== undefined
                            ? holdingTax.no_bukti_potong
                            : "Not set"}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Box sx={{ p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Nilai Potongan
                        </Typography>
                        <Typography
                          variant="h6"
                          sx={{ fontWeight: 600, color: "#d32f2f" }}
                        >
                          {holdingTax.nilai_potongan !== null &&
                          holdingTax.nilai_potongan !== undefined
                            ? formatValue(holdingTax.nilai_potongan).formatted
                            : "Not set"}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Box sx={{ p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Tanggal WHT
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {holdingTax.tanggal_wht !== null &&
                          holdingTax.tanggal_wht !== undefined
                            ? formatDate(holdingTax.tanggal_wht)
                            : "Not set"}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Stack>
          ) : (
            <Box sx={{ textAlign: "center", py: 6 }}>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                No holding tax data available
              </Typography>
              <Typography variant="body2" color="text.secondary">
                This invoice doesn't have withholding tax information yet
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 2 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 500,
            px: 3,
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ViewHoldingTaxModal;
