import { useState } from "react";
import { Routes, Route, Navigate, Link, useLocation, HashRouter} from "react-router-dom";
import { 
  Dumbbell, LayoutDashboard, Users, CreditCard, 
  ShoppingBag, Receipt, TrendingUp, LogOut, Logs
} from "lucide-react";

// Page Imports
import Login from "./pages/Login";
import Members from "./pages/Members";
import Memberships from "./pages/Memberships";
import Payments from "./pages/Payments";
import Log from "./pages/Logs"
import Dashboard from "./pages/Dashboard";
import Expenses from "./pages/Expenses";
import Sales from "./pages/Sales";
import logo from "/Logo.png"

export default function App() {
  const [role, setRole] = useState(localStorage.getItem("role") || null);
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("role");
    setRole(null);
  };

  // 1. IF NOT LOGGED IN: Show only the Login screen
  if (!role) {
    return <Login onLogin={(r) => setRole(r)} />;
  }

  // 2. NAV ITEMS: Filtered based on role
  const navItems = [
    ...(role === "admin" ? [{ name: "Dashboard", path: "/dashboard", icon: LayoutDashboard }] : []),
    { name: "Members", path: "/members", icon: Users },
    { name: "Payments", path: "/payments", icon: CreditCard },
    ...(role === "admin" ? [{ name: "Memberships", path: "/membership-types", icon: ShoppingBag }] : []),
    { name: "Sales", path: "/sales", icon: TrendingUp },
    { name: "Expenses", path: "/expenses", icon: Receipt },
    ...(role === "admin" ? [{ name: "Log", path: "/log", icon: Logs }] : []),
  ];

  // 3. LOGGED IN DESIGN: The Premium Navbar + Page Content
  return (
    <div className="min-h-screen bg-gym-black flex flex-col text-white">
      
      {/* --- PREMIUM NAVBAR START --- */}
      <nav className="bg-gym-gray-dark border-b-2 border-gym-gray-border px-6 py-4 w-full sticky top-0 z-50">
        <div className="flex items-center max-w-7xl mx-auto">
          
          {/* Logo Section */}
          <div className="flex-1 flex items-center gap-2">
          <img src={logo} alt="Gym Logo" className="w-17 h-17 object-contain"/>
            <span className="text-3xl font-bold text-white tracking-tighter">
              B7<span className="text-gym-yellow">GYM</span>
            </span>
          </div>

          {/* Links Section */}
          <div className="hidden md:flex items-center bg-gym-black/50 rounded-2xl p-1 border border-gym-gray-border shadow-inner">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-5 py-2 rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-gym-yellow text-gym-black font-bold shadow-lg"
                      : "text-gym-gray-text hover:text-white hover:bg-gym-gray"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm tracking-wide font-medium">{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Logout Section */}
          <div className="flex-1 flex justify-end">
            <button 
              onClick={handleLogout}
              className="group flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-transparent hover:border-red-500/50 hover:bg-red-500/10 transition-all duration-200"
            >
              <span className="text-gym-gray-text group-hover:text-red-500 text-sm font-bold transition-colors">
                Logout
              </span>
              <div className="w-10 h-10 rounded-full bg-gym-gray border border-gym-gray-border flex items-center justify-center text-gym-gray-text group-hover:text-red-500 group-hover:border-red-500/50 shadow-lg transition-all">
                 <LogOut className="w-5 h-5" />
              </div>
            </button>
          </div>
          
        </div>
      </nav>
      {/* --- PREMIUM NAVBAR END --- */}

      {/* Main Content Area */}
      <main className="flex-grow w-full max-w-7xl mx-auto p-6">
        <Routes>
          <Route path="/dashboard" element={role === "admin" ? <Dashboard /> : <Navigate to="/members" />} />
          <Route path="/members" element={<Members />} />
          <Route path="/membership-types" element={role === "admin" ? <Memberships/> : <Navigate to="/members" />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/log" element={role === "admin" ? <Log/> : <Navigate to="/members" />} />
          
          {/* Default Fallback */}
          <Route path="*" element={<Navigate to="/members" />} />
        </Routes>
      </main>
    </div>
  );
}