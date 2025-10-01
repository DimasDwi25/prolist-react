import React, { useEffect, useState } from "react";
import api from "../../api/api";
import { Box, Typography, Paper, Grid, Button, Avatar } from "@mui/material";

export default function ProfilePage() {
  const [user, setUser] = useState({});

  useEffect(() => {
    api
      .get("/account/profile")
      .then((res) => setUser(res.data.data))
      .catch((err) => console.error(err));
  }, []);

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "";

  return (
    <Box maxWidth="900px" mx="auto" p={3}>
      {/* Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={6}
      >
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            👤 Account Information
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your profile, change your password, and update your PIN.
          </Typography>
        </Box>
        <Avatar
          sx={{
            bgcolor: "primary.main",
            width: 56,
            height: 56,
            fontWeight: "bold",
            fontSize: 20,
            background: "linear-gradient(45deg, #6366F1, #A78BFA)",
          }}
        >
          {initials}
        </Avatar>
      </Box>

      {/* Account Info Card */}
      <Paper
        elevation={3}
        sx={{ p: 4, mb: 6, borderRadius: 3, border: "1px solid #E5E7EB" }}
      >
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Full Name
            </Typography>
            <Typography variant="h6" fontWeight="medium">
              {user.name}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Email Address
            </Typography>
            <Typography variant="h6" fontWeight="medium">
              {user.email}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Role
            </Typography>
            <Typography variant="h6" fontWeight="medium">
              {user.role?.name ?? "-"}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Action Buttons */}
      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Paper
            elevation={3}
            sx={{
              p: 4,
              borderRadius: 3,
              border: "1px solid #E5E7EB",
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <Typography variant="h6" fontWeight="bold">
              🔑 Change Password
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Make sure your new password is strong and secure.
            </Typography>
            <Button
              href="/update-password"
              variant="contained"
              sx={{
                mt: 1,
                bgcolor: "#4F46E5",
                "&:hover": { bgcolor: "#4338CA" },
              }}
            >
              Update Password
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper
            elevation={3}
            sx={{
              p: 4,
              borderRadius: 3,
              border: "1px solid #E5E7EB",
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <Typography variant="h6" fontWeight="bold">
              🔒 Change PIN
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Use a new PIN for additional account security.
            </Typography>
            <Button
              href="/update-pin"
              variant="contained"
              sx={{
                mt: 1,
                bgcolor: "#7C3AED",
                "&:hover": { bgcolor: "#6D28D9" },
              }}
            >
              Update PIN
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
