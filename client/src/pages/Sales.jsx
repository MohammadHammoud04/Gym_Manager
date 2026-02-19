"use client"
import { useEffect, useState } from "react"
import axios from "axios"
import { Coffee, Plus, Receipt, Trash2, Package, Zap, DollarSign } from "lucide-react"

export default function Sales() {
  const [sales, setSales] = useState([])
  const [inventory, setInventory] = useState([])
  const [formData, setFormData] = useState({ itemName: "", quantity: 1, pricePerUnit: "", buyerName:"" })
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [dailyTotal, setDailyTotal] = useState(0);
  const [todayProfit, setTodayProfit] = useState(0);

  const fetchSales = async () => {
    const res = await axios.get("http://localhost:5000/sales");
    const salesData = res.data;
    setSales(salesData);

    const today = new Date();
    const offset = today.getTimezoneOffset() * 60000;
    const localToday = new Date(today - offset).toISOString().split("T")[0];
  
    const sum = salesData
      .filter(sale => {
        const saleDate = new Date(sale.date).toISOString().split("T")[0];
        return saleDate === localToday;
      })
      .reduce((acc, curr) => acc + curr.totalPrice, 0);
    
    setDailyTotal(sum);
  };

  const fetchInventory = async () => {
    const res = await axios.get("http://localhost:5000/inventory")
    setInventory(res.data)
  }

  const handleDelete = async (id) => {
    const currentUser = localStorage.getItem("gymUser")
    try {
      await axios.delete(`http://localhost:5000/sales/${id}`, {data: { userName: currentUser}});
      await fetchSales();
      await fetchInventory();
      setDeleteConfirm(null); // close modal
      const profitUpdate = await axios.get("http://localhost:5000/profit/total");
      setTodayProfit(profitUpdate.data.daily.netProfit);
      refreshPageData();
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete sale.");
    }
  };
  
  const handleQuickSell = async (item) => {
    const currentUser = localStorage.getItem("gymUser");    
    if (item.currentStock <= 0) return alert("Out of stock!");
      try {
      const saleData = {
        itemName: item.name,
        quantity: 1,
        pricePerUnit: item.salePrice,
        totalPrice: item.salePrice,
        userName: currentUser
      };

      await axios.post("http://localhost:5000/sales/add", saleData);
      
      const [inv, sales, profit] = await Promise.all([
        axios.get("http://localhost:5000/inventory"),
        axios.get("http://localhost:5000/sales"),
        axios.get("http://localhost:5000/profit/total")
      ]);

      setInventory(inv.data);
      setSales(sales.data);
      setTodayProfit(profit.data.daily.netProfit);
      refreshPageData();
    } catch (err) {
      console.error("Quick sell failed", err);
    }
  }

  const refreshPageData = async () => {
    try {
      const [salesRes, profitRes, inventoryRes] = await Promise.all([
        axios.get("http://localhost:5000/sales"),
        axios.get("http://localhost:5000/profit/total"),
        axios.get("http://localhost:5000/inventory")
      ]);

      setSales(salesRes.data);
      setInventory(inventoryRes.data);

      if (profitRes.data?.daily) {
        setTodayProfit(profitRes.data.daily.netProfit);
      }
    } catch (err) {
      console.error("Refresh error:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const currentUser = localStorage.getItem("gymUser")
    try {
      const totalPrice = formData.quantity * formData.pricePerUnit;
      await axios.post("http://localhost:5000/sales/add", { ...formData, totalPrice, userName:currentUser });
      
      setFormData({ itemName: "", quantity: 1, pricePerUnit: "", buyerName: "" });

      const [sales, inv, profit] = await Promise.all([
        axios.get("http://localhost:5000/sales"),
        axios.get("http://localhost:5000/inventory"),
        axios.get("http://localhost:5000/profit/total")
      ]);

      setSales(sales.data);
      setInventory(inv.data);
      setTodayProfit(profit.data.daily.netProfit);   
      refreshPageData();   
    } catch (err) {
      console.error("Manual sale failed", err);
    }
  }

  useEffect(() => {
    refreshPageData();
    const fetchData = async () => {
      try {
        const [salesRes, profitRes, inventoryRes] = await Promise.all([
          axios.get("http://localhost:5000/sales"),
          axios.get("http://localhost:5000/profit/total"),
          axios.get("http://localhost:5000/inventory")
        ]);
  
        setSales(salesRes.data);
        setInventory(inventoryRes.data);
  
        if (profitRes.data?.daily) {
         setTodayProfit(profitRes.data.daily.netProfit);
        }
      } catch (err) {
        console.error("Data fetch error:", err);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gym-black p-6 lg:p-8">
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gym-gray-dark border-2 border-gym-gray-border rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-500/10 border-2 border-red-500 flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-white">Delete Expense</h3>
            </div>
            <p className="text-gym-gray-text mb-6">
              Are you sure you want to delete <span className="text-white font-semibold">{deleteConfirm.itemName}</span> recorded on {new Date(deleteConfirm.date).toLocaleDateString()}? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-3 rounded-xl border-2 border-gym-gray-border text-white font-semibold hover:bg-gym-gray transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm._id)}
                className="flex-1 px-4 py-3 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

        <div className="flex flex-col lg:flex-row justify-between items-start gap-6 mb-8">
          {/* Left: Title */}
          <div className="flex items-center gap-3">
            <Coffee className="w-10 h-10 text-gym-yellow" />
            <h1 className="text-4xl font-bold text-white tracking-tight">Shop & Inventory</h1>
          </div>

          {/* Right: Stats Cards (Matching Dashboard Style) */}
          <div className="flex flex-wrap gap-4 w-full lg:w-auto">
            
            {/* Today's Transactions (Calculated locally from sales list) */}
            <div className="flex-1 lg:flex-none bg-gym-gray-dark border-2 border-gym-gray-border rounded-2xl p-4 min-w-[160px] flex items-center justify-between shadow-xl">
              <div>
                <p className="text-gym-gray-text text-[10px] font-bold uppercase tracking-widest">Transactions</p>
                <h3 className="text-2xl font-black text-white">
                  {sales.filter(s => new Date(s.date).toDateString() === new Date().toDateString()).length}
                </h3>
              </div>
              <Receipt className="w-6 h-6 text-gym-gray-text opacity-30" />
            </div>

            {/* Today's Total Revenue (From /profit/total route) */}
            <div className="flex-1 lg:flex-none bg-gym-gray-dark border-2 border-gym-yellow rounded-2xl p-4 min-w-[200px] flex items-center justify-between shadow-xl">
              <div>
                <p className="text-gym-yellow text-[10px] font-bold uppercase tracking-widest">Today's Revenue</p>
                <h3 className="text-3xl font-black text-white">${todayProfit}</h3>
              </div>
              <div className="bg-gym-yellow/10 p-2 rounded-lg">
                <DollarSign className="w-7 h-7 text-gym-yellow" />
              </div>
            </div>
          </div>
        </div>

      {/* Quick Sell Inventory Section */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-4 text-white">
          <Zap className="w-5 h-5 text-gym-yellow" />
          <h2 className="text-xl font-bold">Quick Sell (In Stock)</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {inventory.map((item) => (
            <div key={item._id} className="bg-gym-gray-dark border-2 border-gym-gray-border p-4 rounded-2xl flex flex-col justify-between hover:border-gym-yellow transition-all shadow-lg">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-white font-bold capitalize">{item.name}</h3>
                  <p className={`text-xs ${item.currentStock > 0 ? 'text-gym-yellow' : 'text-red-500'}`}>
                    Stock: {item.currentStock}
                  </p>
                </div>
                <Package className="w-4 h-4 text-gym-gray-text" />
              </div>
              <button
                disabled={item.currentStock <= 0}
                onClick={() => handleQuickSell(item)}
                className={`w-full py-2 rounded-xl font-bold transition-all ${
                  item.currentStock > 0 
                  ? "bg-gym-yellow text-gym-black hover:bg-gym-yellow-bright" 
                  : "bg-gym-gray text-gym-gray-text cursor-not-allowed"
                }`}
              >
                {item.currentStock > 0 ? `Sell $${item.salePrice}` : "Out of Stock"}
              </button>
            </div>
          ))}
        </div>
      </div>

      <hr className="border-gym-gray-border mb-10" />

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Manual Sale Form */}
        <div className="bg-gym-gray-dark border-2 border-gym-gray-border rounded-2xl p-6 shadow-2xl h-fit">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Plus className="text-gym-yellow" /> Manual Entry
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              placeholder="Item Name"
              className="w-full px-4 py-3 rounded-xl bg-gym-gray border-2 border-gym-gray-border text-white focus:border-gym-yellow outline-none"
              value={formData.itemName}
              onChange={(e) => setFormData({...formData, itemName: e.target.value})}
            />
            <div className="grid grid-cols-2 gap-4">
              <input
                type="number"
                placeholder="Qty"
                className="w-full px-4 py-3 rounded-xl bg-gym-gray border-2 border-gym-gray-border text-white outline-none"
                value={formData.quantity}
                onChange={(e) => setFormData({...formData, quantity: Number(e.target.value)})}
              />
              <input
                type="number"
                placeholder="Price each"
                className="w-full px-4 py-3 rounded-xl bg-gym-gray border-2 border-gym-gray-border text-white outline-none"
                value={formData.pricePerUnit}
                onChange={(e) => setFormData({...formData, pricePerUnit: Number(e.target.value)})}
              />
            </div>
            <input
                placeholder="Buyer Name (Optional)"
                className="w-full px-4 py-3 rounded-xl bg-gym-gray border-2 border-gym-gray-border text-white focus:border-gym-yellow outline-none"
                value={formData.buyerName}
                onChange={(e) => setFormData({...formData, buyerName: e.target.value})}
              />
            <button className="w-full bg-gym-yellow text-gym-black font-bold py-3 rounded-xl hover:bg-gym-yellow-bright transition-all">
              Log Sale (+${formData.quantity * formData.pricePerUnit || 0})
            </button>
          </form>
        </div>

        {/* History Section */}
        <div className="lg:col-span-2 bg-gym-gray-dark border-2 border-gym-gray-border rounded-2xl p-6 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Receipt className="text-gym-yellow" /> Recent Sales
          </h2>
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {sales.map(sale => (
              <div key={sale._id} className="flex justify-between items-center p-4 bg-gym-gray rounded-xl border-2 border-gym-gray-border hover:border-gym-yellow/50 transition-all">
                <div>
                  <p className="text-white font-bold">{sale.itemName} <span className="text-gym-yellow ml-2 text-sm">x{sale.quantity}</span></p>
                  {sale.buyerName && (
                    <p className="text-gym-yellow/70 text-[10px] uppercase font-bold">
                      Buyer: {sale.buyerName}
                    </p>
                  )}
                  <p className="text-gym-gray-text text-xs">
                    {new Date(sale.date).toLocaleString([], { 
                      year: 'numeric', 
                      month: 'numeric', 
                      day: 'numeric', 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>                
                  </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-green-500 font-bold text-lg">+${sale.totalPrice}</p>
                    <p className="text-gym-gray-text text-[10px]">REVENUE</p>
                  </div>
                  {/* --- CONNECTED DELETE BUTTON --- */}
                  <button 
                    onClick={() => setDeleteConfirm(sale)} 
                    className="p-2 text-gym-gray-text hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                  >
                    <Trash2 size={18}/>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}