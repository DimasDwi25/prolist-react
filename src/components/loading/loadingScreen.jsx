import React from "react";
import loadingImg from "../../assets/CITASys-Logo.gif";

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
      <img
        src={loadingImg}
        alt="Loading..."
        className="w-48 h-auto animate-pulse"
      />
    </div>
  );
}
