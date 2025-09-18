import { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Typography,
  CircularProgress,
  Autocomplete,
  FormControlLabel,
  Radio,
  Box,
  IconButton,
} from "@mui/material";
import api from "../../api/api";
import CloseIcon from "@mui/icons-material/Close";

export default function ViewPhcModal({ projectId, open, handleClose }) {
  const [phcData, setPhcData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (!projectId || !open) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [phcRes, marketingRes, engineeringRes] = await Promise.all([
          api.get(`/phc/${projectId}`),
          api.get("/phc/users/marketing"),
          api.get("/phc/users/engineering"),
        ]);

        console.log("PHC Response:", phcRes.data);
        console.log("Marketing Users:", marketingRes.data);
        console.log("Engineering Users:", engineeringRes.data);

        if (phcRes.data.success) setPhcData(phcRes.data.data);
      } catch (err) {
        console.error("Error fetching PHC data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId, open]);

  const formatDate = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (isNaN(date.getTime())) return "";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  if (loading)
    return (
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="lg">
        <DialogTitle>📄 View PHC</DialogTitle>
        <DialogContent
          dividers
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: 160,
          }}
        >
          <CircularProgress />
        </DialogContent>
      </Dialog>
    );

  if (!phcData)
    return (
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="lg">
        <DialogTitle>📄 View PHC</DialogTitle>
        <DialogContent dividers>
          <Typography>No PHC data found for this project.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
        </DialogActions>
      </Dialog>
    );

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xl">
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        📄 View Project Handover Checklist (PHC)
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ py: 3 }}>
        {/* Step Indicator */}
        <Typography
          variant="body2"
          sx={{ textAlign: "center", mb: 3, color: "text.secondary" }}
        >
          {step === 1
            ? "🔹 Step 1 of 2: General Information"
            : "📋 Step 2 of 2: Handover Checklist"}
        </Typography>

        {/* Step Tabs */}
        <Stack direction="row" spacing={2} justifyContent="center" mb={3}>
          {[1, 2].map((s) => (
            <Button
              key={s}
              variant={step === s ? "contained" : "outlined"}
              color={step === s ? "primary" : "inherit"}
              onClick={() => setStep(s)}
            >
              {s === 1 ? "1️⃣ Information" : "2️⃣ Checklist"}
            </Button>
          ))}
        </Stack>

        {/* Step 1 */}
        {step === 1 && (
          <Stack spacing={3}>
            {/* Project Info */}
            <Box
              sx={{
                p: 2,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2,
                bgcolor: "#f9fafb",
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Project Info
              </Typography>
              <Stack direction="row" spacing={2} mt={2}>
                <TextField
                  label="Project Name"
                  fullWidth
                  value={phcData.project?.project_name || ""}
                  InputProps={{ readOnly: true }}
                />
                <TextField
                  label="PN Number"
                  fullWidth
                  value={phcData.project?.project_number || ""}
                  InputProps={{ readOnly: true }}
                />
              </Stack>
            </Box>
            <Box
              sx={{
                p: 2,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2,
                bgcolor: "#f9fafb",
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Quotation Info
              </Typography>
              <Stack direction="row" spacing={2} mt={2}>
                <TextField
                  label="Quotation Number"
                  fullWidth
                  value={phcData.project?.quotation?.no_quotation || ""}
                  InputProps={{ readOnly: true }}
                />
                <TextField
                  label="Quotation Date"
                  fullWidth
                  value={formatDate(phcData.project?.quotation?.quotation_date)}
                  InputProps={{ readOnly: true }}
                />
              </Stack>
            </Box>

            <Box
              sx={{
                p: 2,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2,
                bgcolor: "#f9fafb",
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Dates
              </Typography>
              {/* Dates */}
              <Stack direction="row" spacing={2} flexWrap="wrap" mt={2}>
                <TextField
                  label="Handover Date"
                  value={formatDate(phcData.handover_date)}
                  InputProps={{ readOnly: true }}
                  sx={{ flex: 1, minWidth: 150 }}
                />
                <TextField
                  label="Start Date"
                  value={formatDate(phcData.start_date)}
                  InputProps={{ readOnly: true }}
                  sx={{ flex: 1, minWidth: 150 }}
                />
                <TextField
                  label="Target Finish Date"
                  value={formatDate(phcData.target_finish_date)}
                  InputProps={{ readOnly: true }}
                  sx={{ flex: 1, minWidth: 150 }}
                />
              </Stack>
            </Box>

            {/* Client Info */}
            <Box
              sx={{
                p: 2,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2,
                bgcolor: "#f9fafb",
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Client Information
              </Typography>
              <Stack direction="row" spacing={2} mt={2}>
                <TextField
                  label="Client PIC Name"
                  fullWidth
                  value={phcData.client_pic_name || ""}
                  InputProps={{ readOnly: true }}
                />
                <TextField
                  label="Client Mobile"
                  fullWidth
                  value={phcData.client_mobile || ""}
                  InputProps={{ readOnly: true }}
                />
              </Stack>
              <TextField
                label="Client Office Address"
                fullWidth
                multiline
                rows={2}
                value={phcData.client_reps_office_address || ""}
                InputProps={{ readOnly: true }}
                sx={{ mt: 2, mb: 2 }}
              />
              <Stack direction="row" spacing={2} mt={2}>
                <TextField
                  label="Client Site Address"
                  fullWidth
                  value={phcData.client_site_address || ""}
                  InputProps={{ readOnly: true }}
                />
                <TextField
                  label="Client Representative"
                  fullWidth
                  value={phcData.client_site_representatives || ""}
                  InputProps={{ readOnly: true }}
                />
                <TextField
                  label="Site Phone Number"
                  fullWidth
                  value={phcData.site_phone_number || ""}
                  InputProps={{ readOnly: true }}
                />
              </Stack>
            </Box>

            {/* Marketing & Engineering */}
            <Box
              sx={{
                p: 2,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2,
                bgcolor: "#f9fafb",
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                HO & PIC Marketing
              </Typography>
              <Stack direction="row" spacing={2} mt={2}>
                <TextField
                  label="HO Marketing"
                  fullWidth
                  value={phcData.ho_marketing?.name || "-"}
                  InputProps={{ readOnly: true }}
                />
                <TextField
                  label="PIC Marketing"
                  fullWidth
                  value={phcData.pic_marketing?.name || "-"}
                  InputProps={{ readOnly: true }}
                />
              </Stack>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }} mt={2}>
                HO & PIC Engineering
              </Typography>
              <Stack direction="row" spacing={2} mt={2}>
                <TextField
                  label="HO Engineering"
                  fullWidth
                  value={phcData.ho_engineering?.name || "-"}
                  InputProps={{ readOnly: true }}
                />
                <TextField
                  label="PIC Engineering"
                  fullWidth
                  value={phcData.pic_engineering?.name || "-"}
                  InputProps={{ readOnly: true }}
                />
              </Stack>

              <TextField
                label="Notes"
                fullWidth
                multiline
                rows={3}
                value={phcData.notes || ""}
                InputProps={{ readOnly: true }}
                sx={{ mt: 2 }}
              />
            </Box>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded"
              >
                ⏭️ Next: Checklist
              </button>
            </div>
          </Stack>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              📋 Handover Checklist
            </Typography>

            {/* Baris pertama: 2 item */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: 2,
                mb: 2,
              }}
            >
              {[
                { key: "costing_by_marketing", label: "Costing by Marketing" },
                { key: "boq", label: "Bill of Quantity (BOQ)" },
              ].map(({ key, label }) => (
                <Box
                  key={key}
                  sx={{
                    p: 2,
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 2,
                    bgcolor: "#f9f9f9",
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 600, mb: 1 }}
                  >
                    {label}
                  </Typography>
                  <Stack direction="row" spacing={3}>
                    <FormControlLabel
                      control={
                        <Radio checked={phcData[key] === "1"} readOnly />
                      }
                      label="Applicable"
                    />
                    <FormControlLabel
                      control={
                        <Radio checked={phcData[key] === "0"} readOnly />
                      }
                      label="Not Applicable"
                    />
                  </Stack>
                </Box>
              ))}
            </Box>

            {/* Baris kedua: 3 item */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 2,
              }}
            >
              {[
                { key: "retention", label: "Retention", hasDetail: true },
                { key: "warranty", label: "Warranty", hasDetail: true },
                { key: "penalty", label: "Penalty", hasDetail: true },
              ].map(({ key, label, hasDetail }) => (
                <Box
                  key={key}
                  sx={{
                    p: 2,
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 2,
                    bgcolor: "#f9f9f9",
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 600, mb: 1 }}
                  >
                    {label}
                  </Typography>
                  <Stack direction="row" spacing={3}>
                    <FormControlLabel
                      control={
                        <Radio checked={phcData[key] === "A"} readOnly />
                      }
                      label="Applicable"
                    />
                    <FormControlLabel
                      control={
                        <Radio checked={phcData[key] === "NA"} readOnly />
                      }
                      label="Not Applicable"
                    />
                  </Stack>
                  {hasDetail && phcData[key] === "A" && (
                    <TextField
                      label={`${label} Detail`}
                      fullWidth
                      value={phcData[`${key}_detail`] || ""}
                      InputProps={{ readOnly: true }}
                      sx={{ mt: 1 }}
                    />
                  )}
                </Box>
              ))}
            </Box>
            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-5 py-2 border rounded text-sm md:text-base"
              >
                ⬅️ Back
              </button>
            </div>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} variant="outlined">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
