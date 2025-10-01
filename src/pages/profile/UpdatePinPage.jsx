import React, { useState } from "react";
import api from "../../api/api";
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  InputAdornment,
  Alert,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function UpdatePinPage() {
  const [form, setForm] = useState({
    pin: "",
    pin_confirmation: "",
  });
  const [showPin, setShowPin] = useState({
    pin: false,
    pin_confirmation: false,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleToggle = (field) => {
    setShowPin({ ...showPin, [field]: !showPin[field] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors([]);
    setSuccess("");

    if (form.pin.length !== 6) {
      setErrors(["PIN harus 6 digit"]);
      setLoading(false);
      return;
    }

    try {
      const res = await api.post("/account/pin", form);
      setSuccess(res.data.message);
      setForm({ pin: "", pin_confirmation: "" });
      toast.success(res.data.message);
    } catch (err) {
      if (err.response?.data?.errors) {
        const msgs = Object.values(err.response.data.errors).flat();
        setErrors(msgs);
      } else {
        setErrors([err.response?.data?.message || "Terjadi kesalahan"]);
      }
    }
    setLoading(false);
  };

  return (
    <Box maxWidth="500px" mx="auto" p={3}>
      <Typography variant="h5" fontWeight="bold" mb={1}>
        🔒 Change PIN
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={4}>
        Enter your new 6-digit PIN.
      </Typography>

      {/* Error Messages */}
      {errors.length > 0 && (
        <Box mb={3}>
          {errors.map((err, i) => (
            <Alert severity="error" key={i} sx={{ mb: 1 }}>
              {err}
            </Alert>
          ))}
        </Box>
      )}

      {/* Success Message */}
      {success && (
        <Box mb={3}>
          <Alert severity="success">{success}</Alert>
        </Box>
      )}

      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
      >
        {/* New PIN */}
        <TextField
          label="New PIN"
          name="pin"
          type={showPin.pin ? "text" : "password"}
          value={form.pin}
          onChange={handleChange}
          required
          fullWidth
          inputProps={{ maxLength: 6 }}
          placeholder="******"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => handleToggle("pin")} edge="end">
                  {showPin.pin ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        {/* Confirm New PIN */}
        <TextField
          label="Confirm New PIN"
          name="pin_confirmation"
          type={showPin.pin_confirmation ? "text" : "password"}
          value={form.pin_confirmation}
          onChange={handleChange}
          required
          fullWidth
          inputProps={{ maxLength: 6 }}
          placeholder="******"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => handleToggle("pin_confirmation")}
                  edge="end"
                >
                  {showPin.pin_confirmation ? (
                    <VisibilityOff />
                  ) : (
                    <Visibility />
                  )}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        {/* Actions */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mt={2}
        >
          <Button href="/profile" variant="text" color="inherit">
            ⬅ Back
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="secondary"
            disabled={loading}
          >
            {loading ? "Saving..." : "Save PIN"}
          </Button>
        </Box>
      </form>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        draggable
        theme="colored"
      />
    </Box>
  );
}
