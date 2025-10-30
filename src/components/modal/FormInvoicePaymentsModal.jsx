import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Autocomplete,
  Box,
  Typography,
  Grid,
  Paper,
  Snackbar,
  Alert,
  CircularProgress,
} from "@mui/material";
import { Receipt, DollarSign, FileText, Calendar } from "lucide-react";
import api from "../../api/api";
import { formatValue } from "../../utils/formatValue";

export default function FormInvoicePaymentsModal({
  open,
  onClose,
  invoiceId,
  paymentData = null,
  onSave,
}) {
  const [formData, setFormData] = useState({
    payment_date: "",
    payment_amount: "",
    notes: "",
    currency: "IDR",
    nomor_bukti_pembayaran: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const [warningModal, setWarningModal] = useState({
    open: false,
    message: "",
    onConfirm: null,
  });

  const [paymentSummary, setPaymentSummary] = useState({
    total_paid: 0,
    remaining_payment: 0,
    expected_payment: 0,
  });

  const isEditMode = Boolean(paymentData);

  // Initialize form data and fetch invoice data
  useEffect(() => {
    if (open && invoiceId) {
      // Fetch payment summary
      api
        .get(`/finance/invoice-payments?invoice_id=${invoiceId}`)
        .then((response) => {
          const { total_paid, remaining_payment, expected_payment } =
            response.data;
          setPaymentSummary({
            total_paid: total_paid || 0,
            remaining_payment: remaining_payment || 0,
            expected_payment: expected_payment || 0,
          });
        })
        .catch((error) => {
          console.error("Failed to fetch payment summary:", error);
        });
      if (isEditMode && paymentData) {
        setFormData({
          payment_date: paymentData.payment_date
            ? paymentData.payment_date.slice(0, 10)
            : "",
          payment_amount: paymentData.payment_amount || "",
          notes: paymentData.notes || "",
          currency: paymentData.currency || "IDR",
          nomor_bukti_pembayaran: paymentData.nomor_bukti_pembayaran || "",
        });
      } else {
        setFormData({
          payment_date: "",
          payment_amount: "",
          notes: "",
          currency: "IDR",
        });
      }
    }
  }, [open, isEditMode, paymentData, invoiceId]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCurrencyChange = (value) => {
    const numericValue = value.replace(/[^0-9]/g, "");
    setFormData((prev) => ({ ...prev, payment_amount: numericValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.payment_date) {
      setSnackbar({
        open: true,
        message: "Payment date is required.",
        severity: "error",
      });
      return;
    }

    if (!formData.payment_amount || parseFloat(formData.payment_amount) <= 0) {
      setSnackbar({
        open: true,
        message: "Payment amount must be greater than 0.",
        severity: "error",
      });
      return;
    }

    // Validation: Check if payment amount exceeds invoice value using API
    if (formData.payment_amount) {
      try {
        const params = {
          invoice_id: invoiceId,
          payment_amount: parseFloat(formData.payment_amount),
          ...(isEditMode && paymentData?.id && { payment_id: paymentData.id }),
        };

        const response = await api.get("/finance/invoice-payments/validate", {
          params,
        });

        if (!response.data.valid) {
          const details = response.data;
          const currency = formData.currency || "IDR";
          const detailedMessage = `${
            response.data.message
          }\n\nDetails:\n- Current total payments: ${
            formatValue(details.current_total || 0, currency).formatted
          }\n- New total after this payment: ${
            formatValue(details.new_total || 0, currency).formatted
          }\n- Invoice value: ${
            formatValue(details.invoice_value || 0, currency).formatted
          }\n- Exceeds by: ${
            formatValue(details.exceeds_by || 0, currency).formatted
          }`;
          setWarningModal({
            open: true,
            message: detailedMessage,
            onConfirm: () => {
              setWarningModal({ open: false, message: "", onConfirm: null });
              proceedWithSubmit();
            },
          });
          return;
        }
      } catch (error) {
        console.error("Validation failed:", error);
        setSnackbar({
          open: true,
          message: "Failed to validate payment. Please try again.",
          severity: "error",
        });
        return;
      }
    }

    proceedWithSubmit();
  };

  const proceedWithSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        invoice_id: invoiceId,
        payment_date: formData.payment_date,
        payment_amount: parseFloat(formData.payment_amount),
        notes: formData.notes || null,
        currency: formData.currency,
        nomor_bukti_pembayaran: formData.nomor_bukti_pembayaran || null,
      };

      console.log("Payload:", payload); // Debug log

      if (isEditMode) {
        await api.put(`/finance/invoice-payments/${paymentData.id}`, payload);
      } else {
        await api.post("/finance/invoice-payments", payload);
      }

      setSnackbar({
        open: true,
        message: `Payment ${isEditMode ? "updated" : "created"} successfully!`,
        severity: "success",
      });

      if (onSave) onSave();
      onClose();
    } catch (error) {
      console.error("Failed to save payment:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Failed to save payment. Please try again.";
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
        <form onSubmit={handleSubmit}>
          <DialogTitle
            sx={{
              fontSize: "1.25rem",
              fontWeight: 700,
              color: "text.primary",
              borderBottom: 1,
              borderColor: "divider",
              pb: 1.5,
            }}
          >
            <Receipt style={{ marginRight: 8 }} />
            {isEditMode ? "Edit Payment" : "Add New Payment"}
          </DialogTitle>

          <DialogContent dividers sx={{ py: 3 }}>
            <Box sx={{ p: 2 }}>
              {/* Payment Summary Section */}
              <Paper
                elevation={1}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: "divider",
                  mb: 3,
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    mb: 3,
                    fontWeight: 700,
                    color: "primary.main",
                    display: "flex",
                    alignItems: "center",
                    fontSize: "1.1rem",
                  }}
                >
                  <DollarSign sx={{ mr: 1.5, fontSize: 22 }} />
                  Payment Summary
                </Typography>

                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Box sx={{ textAlign: "center" }}>
                      <Typography
                        variant="subtitle2"
                        sx={{ color: "text.secondary", mb: 1 }}
                      >
                        Total Paid
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: 700, color: "success.main" }}
                      >
                        {
                          formatValue(paymentSummary.total_paid, "IDR")
                            .formatted
                        }
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Box sx={{ textAlign: "center" }}>
                      <Typography
                        variant="subtitle2"
                        sx={{ color: "text.secondary", mb: 1 }}
                      >
                        Remaining Payment
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: 700, color: "warning.main" }}
                      >
                        {
                          formatValue(paymentSummary.remaining_payment, "IDR")
                            .formatted
                        }
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Box sx={{ textAlign: "center" }}>
                      <Typography
                        variant="subtitle2"
                        sx={{ color: "text.secondary", mb: 1 }}
                      >
                        Expected Payment
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: 700, color: "primary.main" }}
                      >
                        {
                          formatValue(paymentSummary.expected_payment, "IDR")
                            .formatted
                        }
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>

              {/* Payment Details Section */}
              <Paper
                elevation={1}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    mb: 3,
                    fontWeight: 700,
                    color: "primary.main",
                    display: "flex",
                    alignItems: "center",
                    fontSize: "1.1rem",
                  }}
                >
                  <DollarSign sx={{ mr: 1.5, fontSize: 22 }} />
                  Payment Details
                </Typography>

                <Grid container spacing={3}>
                  {/* Payment Date */}
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Box sx={{ mb: 1 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          mb: 1,
                          fontWeight: 600,
                          color: "text.primary",
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                        }}
                      >
                        <Calendar
                          sx={{ fontSize: 16, color: "primary.main" }}
                        />
                        Payment Date *
                        <Typography
                          component="span"
                          variant="caption"
                          sx={{ color: "error.main", fontWeight: 500 }}
                        >
                          (Required)
                        </Typography>
                      </Typography>
                      <TextField
                        fullWidth
                        type="date"
                        placeholder="Select payment date"
                        InputLabelProps={{ shrink: true }}
                        value={formData.payment_date}
                        onChange={(e) =>
                          handleChange("payment_date", e.target.value)
                        }
                        InputProps={{
                          startAdornment: (
                            <Calendar
                              sx={{
                                mr: 1,
                                color: "action.active",
                                fontSize: 18,
                              }}
                            />
                          ),
                        }}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 2,
                            backgroundColor: "background.paper",
                            "&:hover .MuiOutlinedInput-notchedOutline": {
                              borderColor: "primary.main",
                            },
                            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                              borderColor: "primary.main",
                              borderWidth: 2,
                            },
                          },
                        }}
                      />
                    </Box>
                  </Grid>

                  {/* Currency Selection */}
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          mb: 1.5,
                          fontWeight: 600,
                          color: "text.primary",
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                        }}
                      >
                        <DollarSign
                          sx={{ fontSize: 16, color: "primary.main" }}
                        />
                        Currency *
                        <Typography
                          component="span"
                          variant="caption"
                          sx={{ color: "error.main", fontWeight: 500 }}
                        >
                          (Required)
                        </Typography>
                      </Typography>

                      <Autocomplete
                        fullWidth
                        options={["IDR", "USD"]}
                        value={formData.currency}
                        onChange={(e, newValue) =>
                          handleChange("currency", newValue || "IDR")
                        }
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            placeholder="Select currency"
                            InputProps={{
                              ...params.InputProps,
                              startAdornment: (
                                <Typography
                                  sx={{
                                    mr: 1,
                                    fontWeight: 600,
                                    color:
                                      formData.currency === "IDR"
                                        ? "#1976d2"
                                        : "#2e7d32",
                                    fontSize: 16,
                                    minWidth: 20,
                                    textAlign: "center",
                                  }}
                                >
                                  {formData.currency === "USD" ? "$" : "Rp"}
                                </Typography>
                              ),
                            }}
                            sx={{
                              "& .MuiOutlinedInput-root": {
                                borderRadius: 2,
                                backgroundColor: "background.paper",
                                "&:hover": {
                                  "& .MuiOutlinedInput-notchedOutline": {
                                    borderColor: "primary.main",
                                    borderWidth: 2,
                                  },
                                },
                                "&.Mui-focused": {
                                  "& .MuiOutlinedInput-notchedOutline": {
                                    borderColor: "primary.main",
                                    borderWidth: 2,
                                  },
                                  boxShadow: "0 0 0 3px rgba(37, 99, 235, 0.1)",
                                },
                              },
                            }}
                          />
                        )}
                        renderOption={(props, option) => {
                          const { key, ...otherProps } = props;
                          return (
                            <Box
                              component="li"
                              key={key}
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 2,
                                py: 1.5,
                                px: 2,
                                borderRadius: 1,
                              }}
                              {...otherProps}
                            >
                              <Typography
                                sx={{
                                  fontSize: 18,
                                  fontWeight: 600,
                                  color:
                                    option === "IDR" ? "#1976d2" : "#2e7d32",
                                  minWidth: 32,
                                  textAlign: "center",
                                }}
                              >
                                {option === "IDR" ? "Rp" : "$"}
                              </Typography>
                              <Box>
                                <Typography
                                  variant="body2"
                                  sx={{ fontWeight: 600 }}
                                >
                                  {option === "IDR"
                                    ? "Indonesian Rupiah"
                                    : "US Dollar"}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  sx={{ color: "text.secondary" }}
                                >
                                  {option === "IDR"
                                    ? "Local Currency"
                                    : "International Currency"}
                                </Typography>
                              </Box>
                            </Box>
                          );
                        }}
                      />
                    </Box>
                  </Grid>

                  {/* Payment Amount */}
                  <Grid size={{ xs: 12 }}>
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          mb: 1.5,
                          fontWeight: 600,
                          color: "text.primary",
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                        }}
                      >
                        <DollarSign
                          sx={{ fontSize: 16, color: "primary.main" }}
                        />
                        Payment Amount *
                        <Typography
                          component="span"
                          variant="caption"
                          sx={{ color: "error.main", fontWeight: 500 }}
                        >
                          (Required)
                        </Typography>
                      </Typography>

                      <TextField
                        fullWidth
                        placeholder="Enter payment amount"
                        value={
                          formData.payment_amount
                            ? Number(formData.payment_amount).toLocaleString(
                                formData.currency === "USD" ? "en-US" : "id-ID"
                              )
                            : ""
                        }
                        onChange={(e) => handleCurrencyChange(e.target.value)}
                        InputProps={{
                          startAdornment: (
                            <Box
                              sx={{
                                width: 32,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                mr: 1,
                              }}
                            >
                              <Typography
                                sx={{
                                  fontWeight: 600,
                                  color:
                                    formData.currency === "IDR"
                                      ? "#1976d2"
                                      : "#2e7d32",
                                  fontSize: 16,
                                }}
                              >
                                {formData.currency === "USD" ? "$" : "Rp"}
                              </Typography>
                            </Box>
                          ),
                        }}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 2,
                            backgroundColor: "background.paper",
                            "&:hover .MuiOutlinedInput-notchedOutline": {
                              borderColor: "primary.main",
                            },
                            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                              borderColor: "primary.main",
                              borderWidth: 2,
                            },
                          },
                        }}
                      />
                    </Box>
                  </Grid>
                </Grid>
              </Paper>

              {/* Additional Information Section */}
              <Paper
                elevation={1}
                sx={{
                  p: 3,
                  mt: 3,
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: "divider",
                  background:
                    "linear-gradient(135deg, #fafbfc 0%, #f1f3f4 100%)",
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    mb: 3,
                    fontWeight: 700,
                    color: "primary.main",
                    display: "flex",
                    alignItems: "center",
                    fontSize: "1.1rem",
                  }}
                >
                  <FileText sx={{ mr: 1.5, fontSize: 22 }} />
                  Additional Information
                </Typography>

                {/* Nomor Bukti Pembayaran */}
                <Box sx={{ mb: 3 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      mb: 1.5,
                      fontWeight: 600,
                      color: "text.primary",
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <FileText sx={{ fontSize: 16, color: "primary.main" }} />
                    Payment Receipt Number
                  </Typography>
                  <TextField
                    fullWidth
                    label="Payment Receipt Number"
                    placeholder="Enter payment receipt number"
                    value={formData.nomor_bukti_pembayaran}
                    onChange={(e) =>
                      handleChange("nomor_bukti_pembayaran", e.target.value)
                    }
                    InputProps={{
                      startAdornment: (
                        <FileText
                          sx={{
                            mr: 1,
                            color: "action.active",
                            fontSize: 18,
                          }}
                        />
                      ),
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                        backgroundColor: "background.paper",
                        "&:hover .MuiOutlinedInput-notchedOutline": {
                          borderColor: "primary.main",
                        },
                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                          borderColor: "primary.main",
                          borderWidth: 2,
                        },
                      },
                      "& .MuiInputLabel-root": {
                        color: "text.secondary",
                        "&.Mui-focused": {
                          color: "primary.main",
                        },
                      },
                    }}
                  />
                </Box>

                {/* Notes */}
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Notes"
                  placeholder="Additional notes or remarks about this payment"
                  value={formData.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      backgroundColor: "background.paper",
                      transition: "all 0.2s ease",
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "primary.main",
                        borderWidth: 2,
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "primary.main",
                        borderWidth: 2,
                      },
                    },
                    "& .MuiInputLabel-root": {
                      color: "text.secondary",
                      "&.Mui-focused": {
                        color: "primary.main",
                      },
                    },
                  }}
                />
              </Paper>
            </Box>
          </DialogContent>

          <DialogActions
            sx={{ p: 3, borderTop: 1, borderColor: "divider", gap: 2 }}
          >
            <Button
              onClick={onClose}
              color="inherit"
              variant="outlined"
              disabled={submitting}
              sx={{
                px: 3,
                fontWeight: 600,
                textTransform: "none",
                borderRadius: 2,
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              sx={{
                bgcolor: "#2563eb",
                px: 4,
                fontWeight: 600,
                textTransform: "none",
                borderRadius: 2,
                "&:hover": {
                  bgcolor: "#1d4ed8",
                },
              }}
            >
              {submitting ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CircularProgress size={16} sx={{ color: "white" }} />
                  Saving...
                </Box>
              ) : (
                `${isEditMode ? "Update" : "Create"} Payment`
              )}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Warning Modal */}
      <Dialog
        open={warningModal.open}
        onClose={() =>
          setWarningModal({ open: false, message: "", onConfirm: null })
        }
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            fontSize: "1.25rem",
            fontWeight: 700,
            color: "warning.main",
            borderBottom: 1,
            borderColor: "divider",
            pb: 1.5,
          }}
        >
          ⚠️ Warning
        </DialogTitle>
        <DialogContent sx={{ py: 3 }}>
          <Typography variant="body1" sx={{ color: "text.primary" }}>
            {warningModal.message}
          </Typography>
        </DialogContent>
        <DialogActions
          sx={{ p: 3, borderTop: 1, borderColor: "divider", gap: 2 }}
        >
          <Button
            onClick={() =>
              setWarningModal({ open: false, message: "", onConfirm: null })
            }
            color="inherit"
            variant="outlined"
            sx={{
              px: 3,
              fontWeight: 600,
              textTransform: "none",
              borderRadius: 2,
            }}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
