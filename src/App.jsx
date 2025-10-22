import React, { useState, useEffect } from "react";
import AppRoutes from "./routes/AppRoutes";
import "./handsontable.config"; // Import Handsontable config for styling
import LoadingScreen from "../src/components/loading/loadingScreen";
import "handsontable/styles/handsontable.min.css";
import "handsontable/styles/ht-theme-main.min.css";

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // simulasi loading awal (misal ambil auth/user dari API)
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  return <AppRoutes />;
}

export default App;
