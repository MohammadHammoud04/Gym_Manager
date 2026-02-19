import React from "react";
import "../index.css"; 

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gym-black text-white font-sans antialiased">
      {children}
    </div>
  );
}
