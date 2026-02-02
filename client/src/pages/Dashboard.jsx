"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { 
  TrendingUp, DollarSign, Calendar, BarChart3, Search, 
  CloudUpload, RefreshCw, Database, CheckCircle, AlertCircle,Users
} from "lucide-react"

export default function Dashboard() {
  const [syncStatus, setSyncStatus] = useState("idle");
  const [syncError, setSyncError] = useState("");
  const [dbMode, setDbMode] = useState("Checking...");
  const [isLoading, setIsLoading] = useState(true);
  const [profitByCoach, setProfitByCoach] = useState([]);
  const [totalProfit, setTotalProfit] = useState(0)
  const [profitByClass, setProfitByClass] = useState([])
  const [todayProfit, setTodayProfit] = useState(0)
  const [monthProfit, setMonthProfit] = useState(0)
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [totalExpenses, setTotalExpenses] = useState(0)

  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [rangeProfit, setRangeProfit] = useState(0)

  const fetchRangeProfit = async (start, end, setter) => {
    try {
      const res = await axios.get(`http://localhost:5000/profit/range?start=${start}&end=${end}`)
      setter(res.data.total)
    } catch (err) {
      console.error("Range fetch error:", err)
    }
  }

  const handleSync = async (type) => {
    setSyncStatus("syncing");
    setSyncError("");
    try {
      const res = await axios.post(`http://localhost:5000/sync/${type}`);
      if (res.data.success) {
        setSyncStatus("success");
        setTimeout(() => setSyncStatus("idle"), 3000);
      }
    } catch (err) {
      setSyncStatus("error");
      setSyncError(err.response?.data?.error || "Sync failed. Check console.");
      setTimeout(() => {
        setSyncStatus("idle");
        setSyncError("");
      }, 5000);
      console.error("Sync Error:", err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const statusRes = await axios.get("http://localhost:5000/api/db-status");
        setDbMode(statusRes.data.mode);
        try {
          const coachRes = await axios.get("http://localhost:5000/profit/by-coach");
          setProfitByCoach(coachRes.data);
        } catch (e) {
          console.error("Coach data failed, but continuing...", e);
        }
        const now = new Date();
        const offset = now.getTimezoneOffset() * 60000;
        const todayStr = new Date(now - offset).toISOString().split("T")[0];
        const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthStartStr = new Date(firstOfMonth - offset).toISOString().split("T")[0];
        
        setStartDate(todayStr);
        setEndDate(todayStr);

        const totalRes = await axios.get("http://localhost:5000/profit/total");
        setTotalProfit(totalRes.data.netProfit);
        setTotalExpenses(totalRes.data.expenses);
        setTotalRevenue(totalRes.data.revenue);

        const byClassRes = await axios.get("http://localhost:5000/profit/by-class");
        setProfitByClass(byClassRes.data);

        await fetchRangeProfit(todayStr, todayStr, setTodayProfit);
        await fetchRangeProfit(monthStartStr, todayStr, setMonthProfit);
        
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setDbMode("Offline");
      } finally {
        setIsLoading(false);
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
      </div>

      {syncError && (
        <div className="mb-6 bg-red-500/10 border border-red-500 text-red-400 p-3 rounded-xl text-sm">
          {syncError}
        </div>
      )}

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

      <div className="grid lg:grid-cols-2 gap-8">
        
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

      <div className="mt-8 bg-gym-gray-dark border-2 border-gym-gray-border rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gym-yellow/10 rounded-lg">
            <Users className="w-6 h-6 text-gym-yellow" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white uppercase tracking-tight">Coach Performance</h2>
            <p className="text-gym-gray-text text-xs font-bold uppercase tracking-widest">Personal Training Revenue</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {profitByCoach.length > 0 ? (
            profitByCoach.map((coach) => (
              <div key={coach._id} className="relative overflow-hidden bg-gym-black border border-gym-gray-border p-5 rounded-xl group hover:border-gym-yellow transition-all">
                {/* Decorative background accent */}
                <div className="absolute -right-4 -top-4 w-16 h-16 bg-gym-yellow/5 rounded-full blur-2xl group-hover:bg-gym-yellow/10 transition-all" />
                
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-[10px] font-black text-gym-gray-text uppercase tracking-[0.2em]">Lead Coach</span>
                    <h3 className="text-lg font-black text-white uppercase">{coach._id}</h3>
                  </div>
                  <div className="bg-gym-yellow text-gym-black px-2 py-1 rounded font-black text-[10px] uppercase">
                    Top Tier
                  </div>
                </div>

                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-gym-gray-text text-[10px] font-bold uppercase mb-1">Total Generated</p>
                    <p className="text-3xl font-black text-white">${coach.total}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gym-yellow font-bold text-sm">{coach.sessionsSold} Plans</p>
                    <p className="text-gym-gray-text text-[9px] uppercase font-black">Sold</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-12 text-center bg-gym-black/20 border border-dashed border-gym-gray-border rounded-xl">
              <p className="text-gym-gray-text font-bold uppercase tracking-widest text-sm">No Coach Data Available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
