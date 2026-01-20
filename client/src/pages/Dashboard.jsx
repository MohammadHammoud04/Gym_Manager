"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { 
  TrendingUp, DollarSign, Calendar, BarChart3, Search, 
  CloudUpload, RefreshCw, Database, CheckCircle, AlertCircle 
} from "lucide-react"

export default function Dashboard() {
  // --- SYNC & STATUS STATE ---
  const [syncStatus, setSyncStatus] = useState("idle"); // idle, syncing, success, error
  const [dbMode, setDbMode] = useState("Checking...");

  // --- PROFIT & ANALYTICS STATE ---
  const [totalProfit, setTotalProfit] = useState(0)
  const [profitByClass, setProfitByClass] = useState([])
  const [todayProfit, setTodayProfit] = useState(0)
  const [monthProfit, setMonthProfit] = useState(0)
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [totalExpenses, setTotalExpenses] = useState(0)

  // --- DATE RANGE STATE ---
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [rangeProfit, setRangeProfit] = useState(0)

  // Helper: Fetch Range Profit
  const fetchRangeProfit = async (start, end, setter) => {
    try {
      const res = await axios.get(`http://localhost:5000/profit/range?start=${start}&end=${end}`)
      setter(res.data.total)
    } catch (err) {
      console.error("Range fetch error:", err)
    }
  }

  // Handle Sync (Backup or Pull)
  const handleSync = async (type) => {
    setSyncStatus("syncing");
    try {
      // type is either 'full-sync' (Backup) or 'pull-from-cloud' (Restore)
      const res = await axios.post(`http://localhost:5000/sync/${type}`);
      if (res.data.success) {
        setSyncStatus("success");
        setTimeout(() => setSyncStatus("idle"), 3000);
      }
    } catch (err) {
      setSyncStatus("error");
      setTimeout(() => setSyncStatus("idle"), 4000);
      console.error("Sync Error:", err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check DB Connection Mode (Local vs Cloud)
        const statusRes = await axios.get("http://localhost:5000/api/db-status");
        setDbMode(statusRes.data.mode);

        // Date logic for Today and Month Start
        const now = new Date();
        const offset = now.getTimezoneOffset() * 60000;
        const todayStr = new Date(now - offset).toISOString().split("T")[0];
        const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthStartStr = new Date(firstOfMonth - offset).toISOString().split("T")[0];
        
        setStartDate(todayStr);
        setEndDate(todayStr);

        // Fetch Main Totals
        const totalRes = await axios.get("http://localhost:5000/profit/total");
        setTotalProfit(totalRes.data.netProfit);
        setTotalExpenses(totalRes.data.expenses);
        setTotalRevenue(totalRes.data.revenue);

        // Fetch Class Breakdown
        const byClassRes = await axios.get("http://localhost:5000/profit/by-class");
        setProfitByClass(byClassRes.data);

        // Fetch Quick Stats
        await fetchRangeProfit(todayStr, todayStr, setTodayProfit);
        await fetchRangeProfit(monthStartStr, todayStr, setMonthProfit);
        
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setDbMode("Offline");
      }
    };
  
    fetchData();
  }, []);

  const handleRangeSearch = async () => {
    if (!startDate || !endDate) return
    await fetchRangeProfit(startDate, endDate, setRangeProfit)
  }

  return (
    <div className="min-h-screen bg-gym-black p-6 lg:p-8">
      
      {/* --- HEADER & SYNC CENTER --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6 bg-gym-gray-dark p-6 rounded-2xl border-2 border-gym-gray-border shadow-2xl">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="w-10 h-10 text-gym-yellow" />
            <h1 className="text-4xl font-bold text-white">Dashboard</h1>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-gym-black rounded-full w-fit border border-gym-gray-border">
            <div className={`w-2.5 h-2.5 rounded-full ${dbMode.includes("Local") ? "bg-green-500 shadow-[0_0_8px_#22c55e]" : "bg-blue-500 animate-pulse shadow-[0_0_8px_#3b82f6]"}`} />
            <p className="text-gym-gray-text text-xs font-bold uppercase tracking-wider">{dbMode}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {/* Restore Button */}
          <button 
            onClick={() => handleSync('pull-from-cloud')}
            disabled={syncStatus === 'syncing'}
            className="flex items-center gap-2 px-4 py-2.5 bg-gym-gray border-2 border-gym-gray-border text-white rounded-xl hover:border-blue-500 hover:text-blue-400 transition-all text-sm font-bold disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
            Restore from Cloud
          </button>

          {/* Backup Button */}
          <button 
            onClick={() => handleSync('full-sync')}
            disabled={syncStatus === 'syncing'}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all shadow-lg font-bold text-sm ${
              syncStatus === 'success' ? 'bg-green-600 text-white' :
              syncStatus === 'error' ? 'bg-red-600 text-white' :
              'bg-gym-yellow text-gym-black hover:bg-gym-yellow-bright'
            }`}
          >
            {syncStatus === 'syncing' ? <RefreshCw className="w-4 h-4 animate-spin" /> : 
             syncStatus === 'success' ? <CheckCircle className="w-4 h-4" /> :
             syncStatus === 'error' ? <AlertCircle className="w-4 h-4" /> :
             <CloudUpload className="w-4 h-4" />}
            
            {syncStatus === 'syncing' ? "Backing up..." : 
             syncStatus === 'success' ? "Backup Ready" :
             syncStatus === 'error' ? "Sync Failed" : 
             "Backup to Cloud"}
          </button>
        </div>
      </div>

      {/* --- QUICK STATS CARDS --- */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5 mb-8">
        <div className="bg-gym-gray-dark border-2 border-gym-gray-border rounded-2xl p-6 shadow-xl">
          <p className="text-gym-gray-text text-xs font-semibold mb-1">TOTAL REVENUE</p>
          <h3 className="text-2xl font-bold text-green-500">${totalRevenue}</h3>
          <p className="text-gym-gray-text text-[10px]">Gross Sales</p>
        </div>

        <div className="bg-gym-gray-dark border-2 border-gym-gray-border rounded-2xl p-6 shadow-xl border-red-500/20">
          <p className="text-gym-gray-text text-xs font-semibold mb-1">TOTAL EXPENSES</p>
          <h3 className="text-2xl font-bold text-red-500">${totalExpenses}</h3>
          <p className="text-gym-gray-text text-[10px]">Shop Costs</p>
        </div>

        <div className="bg-gym-gray-dark border-2 border-gym-yellow rounded-2xl p-6 shadow-xl lg:col-span-1">
          <p className="text-gym-gray-text text-xs font-semibold mb-1">NET PROFIT</p>
          <h3 className="text-2xl font-bold text-white">${totalProfit}</h3>
          <p className="text-gym-gray-text text-[10px]">Total Surplus</p>
        </div>

        <div className="bg-gym-gray-dark border-2 border-gym-gray-border rounded-2xl p-6 shadow-xl hover:border-gym-yellow transition-all">
          <p className="text-gym-gray-text text-xs font-semibold mb-1">TODAY</p>
          <h3 className="text-2xl font-bold text-white">${todayProfit}</h3>
          <p className="text-gym-gray-text text-[10px]">Daily Earnings</p>
        </div>

        <div className="bg-gym-gray-dark border-2 border-gym-gray-border rounded-2xl p-6 shadow-xl hover:border-gym-yellow transition-all">
          <p className="text-gym-gray-text text-xs font-semibold mb-1">THIS MONTH</p>
          <h3 className="text-2xl font-bold text-white">${monthProfit}</h3>
          <p className="text-gym-gray-text text-[10px]">Monthly Total</p>
        </div>
      </div>

      {/* --- MAIN CONTENT GRID --- */}
      <div className="grid lg:grid-cols-2 gap-8">
        
        {/* Profit by Class */}
        <div className="bg-gym-gray-dark border-2 border-gym-gray-border rounded-2xl p-6 shadow-2xl">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-6 h-6 text-gym-yellow" />
            <h2 className="text-2xl font-bold text-white">Profit by Class</h2>
          </div>
          <div className="space-y-3">
            {profitByClass.length > 0 ? (
              profitByClass.map((item) => (
                <div key={item._id} className="flex items-center justify-between p-4 rounded-xl bg-gym-gray border border-gym-gray-border">
                  <span className="text-white font-semibold">{item._id || "Other"}</span>
                  <p className="text-gym-yellow font-bold text-lg">${item.total}</p>
                </div>
              ))
            ) : (
              <p className="text-gym-gray-text text-center py-10">No class data found</p>
            )}
          </div>
        </div>

        {/* Date Range Search */}
        <div className="bg-gym-gray-dark border-2 border-gym-gray-border rounded-2xl p-6 shadow-2xl">
          <div className="flex items-center gap-2 mb-6">
            <Search className="w-6 h-6 text-gym-yellow" />
            <h2 className="text-2xl font-bold text-white">Range Calculator</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <input type="date" className="bg-gym-gray border border-gym-gray-border text-white p-3 rounded-xl outline-none focus:border-gym-yellow" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <input type="date" className="bg-gym-gray border border-gym-gray-border text-white p-3 rounded-xl outline-none focus:border-gym-yellow" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <button onClick={handleRangeSearch} className="w-full bg-gym-yellow text-gym-black font-bold py-3 rounded-xl mb-6 hover:bg-gym-yellow-bright">Calculate Range Profit</button>
          
          <div className="p-6 rounded-xl bg-gym-black border-2 border-gym-yellow flex justify-between items-center">
            <div>
              <p className="text-gym-gray-text text-xs uppercase font-bold">Range Total</p>
              <h3 className="text-3xl font-bold text-white">${rangeProfit}</h3>
            </div>
            <DollarSign className="w-10 h-10 text-gym-yellow" />
          </div>
        </div>

      </div>
    </div>
  )
}