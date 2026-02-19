"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { ShoppingCart, Plus, Package, DollarSign, Trash2 } from "lucide-react"

export default function Expenses() {
  const [expenses, setExpenses] = useState([])
  const [formData, setFormData] = useState({ name: "", amount: "", price: "", addToInventory: false, salePrice: "" })
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [inventory, setInventory] = useState([])


  const fetchExpenses = async () => {
    try {
      const res = await axios.get("http://localhost:5000/expenses")
      setExpenses(res.data)
    } catch (err) {
      console.error("Error fetching expenses:", err)
    }
  }

  useEffect(() => {
    fetchExpenses()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const currentUser = localStorage.getItem("gymUser")
    try {
      await axios.post("http://localhost:5000/expenses/add", {...formData,
        userName: currentUser
      })
      setFormData({ name: "", amount: "", price: "", addToInventory: false, salePrice: "" })
      fetchExpenses()
    } catch (err) {
      alert("Error adding expense: " + err.message)
    }
  }

  const fetchInventory = async () => {
    const res = await axios.get("http://localhost:5000/inventory")
    setInventory(res.data)
  }

  const handleDelete = async (id) => {
    const currentUser = localStorage.getItem("gymUser")
      try {
        await axios.delete(`http://localhost:5000/expenses/remove/${id}`,
          {data: {userName:currentUser}}
        );
        // Refresh both lists immediately
        await fetchExpenses();
        await fetchInventory();
        setDeleteConfirm(null);
      } catch (err) {
        console.error("Delete failed:", err);
        alert("Failed to delete expense.");
      }
    }
;

  return (
    <div className="min-h-screen bg-gym-black p-6 lg:p-8">
      {/* Delete Confirmation Modal (Exactly like Members page) */}
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
              Are you sure you want to delete <span className="text-white font-semibold">{deleteConfirm.name}</span> recorded on {new Date(deleteConfirm.date).toLocaleDateString()}? This action cannot be undone.
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

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <ShoppingCart className="w-8 h-8 text-gym-yellow" />
          <h1 className="text-4xl font-bold text-white">Expenses</h1>
        </div>
        <p className="text-gym-gray-text text-lg">Manage gym supplies and item costs</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Form Section */}
        <div className="lg:col-span-1">
          <div className="bg-gym-gray-dark border-2 border-gym-gray-border rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center gap-2 mb-6">
              <Plus className="w-6 h-6 text-gym-yellow" />
              <h2 className="text-2xl font-bold text-white">Add Item</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gym-gray-text text-sm mb-2">Item Name</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Protein Bars"
                  className="w-full px-4 py-3 rounded-xl bg-gym-gray border-2 border-gym-gray-border text-white focus:border-gym-yellow outline-none transition-all"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gym-gray-text text-sm mb-2">Quantity</label>
                  <input
                    required
                    type="number"
                    placeholder="10"
                    className="w-full px-4 py-3 rounded-xl bg-gym-gray border-2 border-gym-gray-border text-white focus:border-gym-yellow outline-none transition-all"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-gym-gray-text text-sm mb-2">Total Price</label>
                  <input
                    required
                    type="number"
                    placeholder="50"
                    className="w-full px-4 py-3 rounded-xl bg-gym-gray border-2 border-gym-gray-border text-white focus:border-gym-yellow outline-none transition-all"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 py-2">
                <input 
                  type="checkbox" 
                  id="addToInventory"
                  checked={formData.addToInventory}
                  onChange={(e) => setFormData({...formData, addToInventory: e.target.checked})}
                  className="w-4 h-4 accent-gym-yellow"
                />
                <label htmlFor="addToInventory" className="text-white text-sm">Add to Sales Inventory?</label>
              </div>

              {formData.addToInventory && (
                <div>
                  <label className="block text-gym-gray-text text-sm mb-2">Selling Price (per unit)</label>
                  <input
                    type="number"
                    placeholder="Price for customers"
                    className="w-full px-4 py-3 rounded-xl bg-gym-gray border-2 border-gym-yellow/50 text-white outline-none"
                    value={formData.salePrice}
                    onChange={(e) => setFormData({...formData, salePrice: e.target.value})}
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-gym-yellow text-gym-black-dark font-bold py-3 px-6 rounded-xl hover:bg-gym-yellow-bright transition-all shadow-lg mt-2"
              >
                Save Expense
              </button>
            </form>
          </div>
        </div>

        {/* List Section */}
        <div className="lg:col-span-2">
          <div className="bg-gym-gray-dark border-2 border-gym-gray-border rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center gap-2 mb-6">
              <Package className="w-6 h-6 text-gym-yellow" />
              <h2 className="text-2xl font-bold text-white">Recent Purchases</h2>
            </div>

            <div className="space-y-4">
              {expenses.length > 0 ? (
                expenses.map((exp) => (
                  <div key={exp._id} className="flex items-center justify-between p-4 rounded-xl bg-gym-gray border-2 border-gym-gray-border hover:border-gym-yellow transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gym-yellow/10 border-2 border-gym-yellow flex items-center justify-center text-gym-yellow font-bold">
                        {exp.amount}x
                      </div>
                      <div>
                        <p className="text-white font-semibold">{exp.name}</p>
                        <p className="text-gym-gray-text text-xs">
                          {new Date(exp.date).toLocaleString([], { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-red-500 font-bold text-lg">-${exp.price}</p>
                        <p className="text-gym-gray-text text-xs">Expense</p>
                      </div>
                      
                      {/* Trash Icon Button */}
                      <button
                        onClick={() => setDeleteConfirm(exp)}
                        className="w-10 h-10 rounded-full bg-red-500/10 border-2 border-red-500/50 flex items-center justify-center hover:bg-red-500/20 hover:border-red-500 transition-all "
                        title="Delete expense"
                      >
                        <Trash2 className="w-5 h-5 text-red-500" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gym-gray-text py-8">No expenses recorded yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}