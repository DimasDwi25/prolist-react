import { Typography, Paper } from "@mui/material";

const SectionCard = ({ title, icon, children }) => (
  <Paper
    variant="outlined"
    sx={{ p: 3, mb: 3, borderRadius: 2, bgcolor: "#fff" }}
  >
    <Typography
      variant="h6"
      sx={{
        mb: 2,
        fontWeight: 700,
        display: "flex",
        alignItems: "center",
        gap: 1,
      }}
    >
      {icon} {title}
    </Typography>
    {children}
  </Paper>
);

export default SectionCard;
