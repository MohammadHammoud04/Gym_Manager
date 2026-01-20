"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { ShoppingCart, Plus, Package, DollarSign, Trash2 } from "lucide-react"

export default function Expenses() {
  const [expenses, setExpenses] = useState([])
  const [formData, setFormData] = useState({ name: "", amount: "", price: "" })

  const fetchExpenses = async () => {
    try {
      const res = await axios.get("http://localhost:5000/expenses")
      setExpenses(res.data)
    } catch (err) {
      console.error("Error fetching expenses:", err)
    }
  }

  useEffect(() => {
    const fetchData = async () =>{

    try{
    await fetchExpenses()
    }
    catch(err){
        console.log(err);
    }
    }
    fetchData()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await axios.post("http://localhost:5000/expenses/add", formData)
      setFormData({ name: "", amount: "", price: "" }) // Reset form
      fetchExpenses() // Refresh list
    } catch (err) {
      alert("Error adding expense: " + err.message)
    }
  }

  return (
    <div className="min-h-screen bg-gym-black p-6 lg:p-8">
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
                  <div key={exp._id} className="flex items-center justify-between p-4 rounded-xl bg-gym-gray border-2 border-gym-gray-border hover:border-gym-yellow transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gym-yellow/10 border-2 border-gym-yellow flex items-center justify-center text-gym-yellow font-bold">
                        {exp.amount}x
                      </div>
                      <div>
                        <p className="text-white font-semibold">{exp.name}</p>
                        <p className="text-gym-gray-text text-xs">{new Date(exp.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-red-500 font-bold text-lg">-${exp.price}</p>
                      <p className="text-gym-gray-text text-xs">Expense</p>
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