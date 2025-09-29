// src/handsontable.config.js
import Handsontable from "handsontable/base";
import { registerAllModules } from "handsontable/registry";
import "handsontable/styles/ht-theme-horizon.css";

// Register semua modul secara global
registerAllModules();

export default Handsontable;
