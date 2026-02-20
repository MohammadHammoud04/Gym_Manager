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
  const [monthRevenue, setMonthRevenue] = useState(0);
  const [monthExpenses, setMonthExpenses] = useState(0);
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [todayExpenses, setTodayExpenses] = useState(0);
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [rangeProfit, setRangeProfit] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncConfirm, setSyncConfirm] = useState(null); 
  const [pendingFile, setPendingFile] = useState(null);
  const [classStartDate, setClassStartDate] = useState("");
  const [classEndDate, setClassEndDate] = useState("");

  const fetchRangeProfit = async (start, end, setter) => {
    try {
      const res = await axios.get(`http://localhost:5000/profit/range?start=${start}&end=${end}`)
      setter(res.data.total)
    } catch (err) {
      console.error("Range fetch error:", err)
    }
  }

  const fetchClassProfit = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/profit/by-class?start=${classStartDate}&end=${classEndDate}`);
      setProfitByClass(res.data);
    } catch (err) {
      console.error("Class profit fetch error:", err);
    }
  };

  // const handleSync = async (type) => {
  //   setSyncStatus("syncing");
  //   setSyncError("");
  //   try {
  //     const res = await axios.post(`http://localhost:5000/sync/${type}`);
  //     if (res.data.success) {
  //       setSyncStatus("success");
  //       setTimeout(() => setSyncStatus("idle"), 3000);
  //     }
  //   } catch (err) {
  //     setSyncStatus("error");
  //     setSyncError(err.response?.data?.error || "Sync failed. Check console.");
  //     setTimeout(() => {
  //       setSyncStatus("idle");
  //       setSyncError("");
  //     }, 5000);
  //     console.error("Sync Error:", err);
  //   }
  // };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const statusRes = await axios.get("http://localhost:5000/api/db-status");
        setDbMode(statusRes.data.mode);
  
        try {
          const coachRes = await axios.get("http://localhost:5000/profit/by-coach");
          setProfitByCoach(coachRes.data);
        } catch (e) { console.error("Coach data failed", e); }
  
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
        setClassStartDate(firstDay);
        setClassEndDate(lastDay);
  
        const totalRes = await axios.get("http://localhost:5000/profit/total");

    console.log("BACKEND DATA RECEIVED:", totalRes.data);

    setTotalRevenue(totalRes.data.yearly.revenue);
    setTotalExpenses(totalRes.data.yearly.expenses);
    setTotalProfit(totalRes.data.yearly.netProfit);

    setMonthRevenue(totalRes.data.monthly.revenue);
    setMonthExpenses(totalRes.data.monthly.expenses);
    setMonthProfit(totalRes.data.monthly.netProfit);

    if (totalRes.data?.daily) {
      setTodayRevenue(totalRes.data.daily.revenue);
      setTodayExpenses(totalRes.data.daily.expenses);
      setTodayProfit(totalRes.data.daily.netProfit);
    }
        const byClassRes = await axios.get("http://localhost:5000/profit/by-class");
        setProfitByClass(byClassRes.data);
  
  
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

  const handleExport = async () => {
      try {
          const res = await axios.get("http://localhost:5000/sync/export");
          const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(res.data));
          const downloadAnchorNode = document.createElement('a');
          downloadAnchorNode.setAttribute("href", dataStr);
          downloadAnchorNode.setAttribute("download", `GYM_DATA_${new Date().toISOString().split('T')[0]}.json`);
          document.body.appendChild(downloadAnchorNode);
          downloadAnchorNode.click();
          downloadAnchorNode.remove();
      } catch (err) {
          alert("Export failed. Check server connection.");
      }
  };

  const handleFileSelection = (event) => {
    const file = event.target.files[0];
    if (!file) return;
  
    setPendingFile(file);
    setSyncConfirm({
      title: "Database Overwrite",
      message: "This will permanently delete all local members, payments, and sales and replace them with the data from this file.",
      type: "danger" 
    });
    
    event.target.value = ''; 
  };
  
  const executeImport = async () => {
    if (!pendingFile) return;
  
    setIsSyncing(true);
    const reader = new FileReader();
  
    reader.onload = async (e) => {
      try {
        const content = JSON.parse(e.target.result);
        await axios.post("http://localhost:5000/sync/import", content);
        
        setSyncConfirm({
          title: "Success!",
          message: "The database has been updated. The page will now reload.",
          type: "success"
        });
        
        setTimeout(() => {
          window.location.reload();
        }, 2000);
  
      } catch (err) {
        alert("Import failed! Ensure the file is a valid backup.");
        setSyncConfirm(null);
      } finally {
        setIsSyncing(false);
      }
    };
    reader.readAsText(pendingFile);
  };

  return (
    <div className="min-h-screen bg-gym-black p-6 lg:p-8">

      {syncConfirm && (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[70] animate-in fade-in zoom-in duration-200">
        <div className="bg-gym-gray-dark border-2 border-gym-yellow rounded-2xl p-6 max-w-xs w-full mx-4 shadow-2xl text-center">
          <div className="mb-4 flex justify-center">
            <div className={`p-3 rounded-full ${syncConfirm.type === 'success' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
              <AlertCircle size={32} />
            </div>
          </div>
          
          <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">
            {syncConfirm.title}
          </h3>
          <p className="text-gym-gray-text text-sm mb-6">
            {syncConfirm.message}
          </p>
    
          <div className="flex flex-col gap-2">
            {syncConfirm.type !== 'success' && (
              <>
                <button
                  disabled={isSyncing}
                  onClick={executeImport}
                  className="w-full py-3 rounded-xl font-black uppercase tracking-widest transition-all bg-red-600 hover:bg-red-500 text-white disabled:opacity-50"
                >
                  {isSyncing ? "Injecting Data..." : "Confirm Overwrite"}
                </button>
                
                <button
                  disabled={isSyncing}
                  onClick={() => { setSyncConfirm(null); setPendingFile(null); }}
                  className="w-full py-3 rounded-xl bg-gym-gray text-white font-bold hover:bg-gym-gray-border"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    )}

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

        <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-3 mb-8">
          {/* yearly card */}
          <div className="bg-gym-gray-dark border-2 border-gym-yellow rounded-2xl p-6 shadow-xl">
            <p className="text-gym-gray-text text-xs font-bold mb-1 uppercase tracking-wider">Yearly Overview (2026)</p>
            <h3 className="text-3xl font-black text-white">${totalProfit} <span className="text-sm font-normal text-gym-gray-text">Net</span></h3>
            <div className="flex gap-4 mt-3 pt-3 border-t border-gym-gray-border">
              <div className="text-green-500 font-bold text-xs uppercase">Revenue: ${totalRevenue}</div>
              <div className="text-red-500 font-bold text-xs uppercase">Expenses: ${totalExpenses}</div>
            </div>
          </div>

          {/* monthly card */}
          <div className="bg-gym-gray-dark border-2 border-gym-gray-border rounded-2xl p-6 shadow-xl">
            <p className="text-gym-gray-text text-xs font-bold mb-1 uppercase tracking-wider">Current Month Pulse</p>
            <h3 className="text-3xl font-black text-white">${monthProfit} <span className="text-sm font-normal text-gym-gray-text">Net</span></h3>
            <div className="flex gap-4 mt-3 pt-3 border-t border-gym-gray-border">
              <div className="text-green-500 font-bold text-xs uppercase">Revenue: ${monthRevenue}</div>
              <div className="text-red-500 font-bold text-xs uppercase">Expenses: ${monthExpenses}</div>
            </div>
          </div>
        

          <div className="bg-gym-gray-dark border-2 border-gym-gray-border rounded-2xl p-6 shadow-xl hover:border-gym-yellow transition-all">
            <p className="text-gym-gray-text text-xs font-bold mb-1 uppercase tracking-wider">Today's Activity</p>
            <h3 className="text-3xl font-black text-white">${todayProfit} <span className="text-sm font-normal text-gym-gray-text">Net</span></h3>
            <div className="flex gap-4 mt-3 pt-3 border-t border-gym-gray-border">
              <div className="text-green-500 font-bold text-xs uppercase">Rev: ${todayRevenue}</div>
              <div className="text-red-500 font-bold text-xs uppercase">Exp: ${todayExpenses}</div>
            </div>
          </div>

      </div>

        
      <div className="grid lg:grid-cols-2 gap-8">
        
      <div className="bg-gym-gray-dark border-2 border-gym-gray-border rounded-2xl p-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-gym-yellow" />
            <h2 className="text-2xl font-bold text-white uppercase tracking-tight">Class Profit</h2>
          </div>
          
          <div className="flex items-center gap-2">
            <input 
              type="date" 
              className="bg-gym-black border border-gym-gray-border text-white text-xs p-2 rounded-lg outline-none focus:border-gym-yellow" 
              value={classStartDate} 
              onChange={(e) => setClassStartDate(e.target.value)} 
            />
            <span className="text-gym-gray-text text-xs">to</span>
            <input 
              type="date" 
              className="bg-gym-black border border-gym-gray-border text-white text-xs p-2 rounded-lg outline-none focus:border-gym-yellow" 
              value={classEndDate} 
              onChange={(e) => setClassEndDate(e.target.value)} 
            />
            <button 
              onClick={fetchClassProfit}
              className="p-2 bg-gym-yellow text-gym-black rounded-lg hover:bg-gym-yellow-bright transition-colors"
            >
              <Search size={16} />
            </button>
          </div>
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
            <p className="text-gym-gray-text text-center py-10">No class data for this range</p>
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
      <div className="mt-12 p-8 bg-gym-gray-dark border-2 border-dashed border-gym-gray-border rounded-3xl">
      <div className="flex items-center gap-4 mb-6">
          <Database className="w-8 h-8 text-gym-yellow" />
          <div>
              <h2 className="text-2xl font-bold text-white uppercase tracking-tighter">Cross-Device Sync</h2>
              <p className="text-gym-gray-text text-sm font-medium">Transfer your local database to another laptop.</p>
          </div>
      </div>

      <div className="flex flex-wrap gap-4">
          <button 
              onClick={handleExport}
              className="flex items-center gap-2 bg-white text-black hover:bg-gym-yellow transition-colors px-6 py-3 rounded-xl font-black uppercase text-sm"
          >
              <CloudUpload size={18} /> 1. Export Data to File
          </button>

          <label className="flex items-center gap-2 bg-gym-gray border border-gym-gray-border hover:border-gym-yellow text-white cursor-pointer px-6 py-3 rounded-xl font-black uppercase text-sm transition-all">
            <RefreshCw size={18} /> 
            Import & Overwrite
            <input 
              type="file" 
              className="hidden" 
              onChange={handleFileSelection} 
              accept=".json" 
            />
        </label>
      </div>
      
      <p className="mt-4 text-[10px] text-gym-gray-text uppercase font-bold tracking-widest opacity-50">
          Note: Local user accounts are not affected by this sync.
      </p>
  </div>
  {syncConfirm && (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] animate-in fade-in zoom-in duration-200">
        <div className="bg-gym-gray-dark border-2 border-gym-yellow rounded-2xl p-6 max-w-xs w-full mx-4 shadow-2xl text-center">
          <div className="mb-4 flex justify-center">
            <div className={`p-3 rounded-full ${syncConfirm.type === 'success' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
              {syncConfirm.type === 'success' ? <CheckCircle size={32} /> : <AlertCircle size={32} />}
            </div>
          </div>
          
          <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">
            {syncConfirm.title}
          </h3>
          <p className="text-gym-gray-text text-sm mb-6">
            {syncConfirm.message}
          </p>

          <div className="flex flex-col gap-2">
            {syncConfirm.type !== 'success' && (
              <>
                <button
                  disabled={isSyncing}
                  onClick={executeImport}
                  className="w-full py-3 rounded-xl font-black uppercase tracking-widest transition-all bg-red-600 hover:bg-red-500 text-white disabled:opacity-50"
                >
                  {isSyncing ? "Injecting Data..." : "Confirm Overwrite"}
                </button>
                
                <button
                  disabled={isSyncing}
                  onClick={() => { setSyncConfirm(null); setPendingFile(null); }}
                  className="w-full py-3 rounded-xl bg-gym-gray text-white font-bold hover:bg-gym-gray-border"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    )}
</div>
  )
}
