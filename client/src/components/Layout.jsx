import React from "react";
import "../index.css"; // Make sure your CSS is imported

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gym-black text-white font-sans antialiased">
      {children}
    </div>
  );
}
