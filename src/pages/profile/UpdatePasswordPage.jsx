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

export default function UpdatePasswordPage() {
  const [form, setForm] = useState({
    password: "",
    password_confirmation: "",
  });
  const [showPassword, setShowPassword] = useState({
    password: false,
    password_confirmation: false,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleToggle = (field) => {
    setShowPassword({ ...showPassword, [field]: !showPassword[field] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors([]);
    setSuccess("");

    try {
      const res = await api.post("/account/password", form);
      setSuccess(res.data.message);
      setForm({ password: "", password_confirmation: "" });
      toast.success(res.data.message);
    } catch (err) {
      if (err.response?.data?.errors) {
        // Laravel validation errors
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
        🔑 Change Password
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={4}>
        Enter your new password below.
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
        <TextField
          label="New Password"
          name="password"
          type={showPassword.password ? "text" : "password"}
          value={form.password}
          onChange={handleChange}
          required
          fullWidth
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => handleToggle("password")} edge="end">
                  {showPassword.password ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        <TextField
          label="Confirm New Password"
          name="password_confirmation"
          type={showPassword.password_confirmation ? "text" : "password"}
          value={form.password_confirmation}
          onChange={handleChange}
          required
          fullWidth
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => handleToggle("password_confirmation")}
                  edge="end"
                >
                  {showPassword.password_confirmation ? (
                    <VisibilityOff />
                  ) : (
                    <Visibility />
                  )}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

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
            color="primary"
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Password"}
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
