"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { Search, Plus, Edit2, Trash2, CreditCard, Users, Calendar, DollarSign } from "lucide-react"

export default function Memberships() {
  const [memberships, setMemberships] = useState([])
  const [newMembership, setNewMembership] = useState({
    name: "",
    category: "",
    audience: "",
    price: "",
    durationInDays: "",
  })
  const [editingId, setEditingId] = useState(null)
  const [search, setSearch] = useState("")

  const fetchMemberships = async () => {
    const res = await axios.get("http://localhost:5000/membership-types")
    setMemberships(res.data)
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        await fetchMemberships()
      } catch (err) {
        console.error(err)
      }
    }

    fetchData()
  }, [])

  // Add new membership
  const handleAdd = async () => {
    await axios.post("http://localhost:5000/membership-types", newMembership)
    setNewMembership({ name: "", category: "", audience: "", price: "", durationInDays: "" })
    fetchMemberships()
  }

  // Update existing membership
  const handleUpdate = async () => {
    await axios.put(`http://localhost:5000/membership-types/${editingId}`, newMembership)
    setNewMembership({ name: "", category: "", audience: "", price: "", durationInDays: "" })
    setEditingId(null)
    fetchMemberships()
  }

  // Delete membership
  const handleDelete = async (id) => {
    await axios.delete(`http://localhost:5000/membership-types/${id}`)
    fetchMemberships()
  }

  // Edit membership
  const handleEdit = (m) => {
    setEditingId(m._id)
    setNewMembership({
      name: m.name,
      category: m.category,
      audience: m.audience,
      price: m.price,
      durationInDays: m.durationInDays,
    })
  }

  // Cancel edit
  const handleCancel = () => {
    setEditingId(null)
    setNewMembership({ name: "", category: "", audience: "", price: "", durationInDays: "" })
  }

  // filter memberships by search
  const filtered = memberships.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) || m.category.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="min-h-screen bg-gym-black p-6 lg:p-8">
      {/* header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <CreditCard className="w-8 h-8 text-gym-yellow" />
          <h1 className="text-4xl font-bold text-white">Membership Types</h1>
        </div>
        <p className="text-gym-gray-text text-lg">Create and manage membership plans</p>
      </div>

      {/* search */}
      <div className="mb-8 relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gym-gray-text" />
        <input
          className="w-full pl-12 pr-4 py-3 rounded-xl bg-gym-gray border-2 border-gym-gray-border text-white placeholder:text-gym-gray-text focus:outline-none focus:border-gym-yellow transition-colors"
          placeholder="Search membership types..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* form */}
      <div className="bg-gym-gray-dark border-2 border-gym-gray-border rounded-2xl p-6 lg:p-8 mb-8 shadow-2xl">
        <div className="flex items-center gap-2 mb-6">
          {editingId ? (
            <>
              <Edit2 className="w-6 h-6 text-gym-yellow" />
              <h2 className="text-2xl font-bold text-white">Edit Membership Type</h2>
            </>
          ) : (
            <>
              <Plus className="w-6 h-6 text-gym-yellow" />
              <h2 className="text-2xl font-bold text-white">Add New Membership Type</h2>
            </>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-4">
          <div>
            <label className="block text-gym-gray-text text-sm mb-2">Name</label>
            <input
              className="w-full px-4 py-3 rounded-xl bg-gym-gray border-2 border-gym-gray-border text-white placeholder:text-gym-gray-text focus:outline-none focus:border-gym-yellow transition-colors"
              placeholder="Name"
              value={newMembership.name}
              onChange={(e) => setNewMembership({ ...newMembership, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-gym-gray-text text-sm mb-2">Category</label>
            <input
              className="w-full px-4 py-3 rounded-xl bg-gym-gray border-2 border-gym-gray-border text-white placeholder:text-gym-gray-text focus:outline-none focus:border-gym-yellow transition-colors"
              placeholder="Category"
              value={newMembership.category}
              onChange={(e) => setNewMembership({ ...newMembership, category: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-gym-gray-text text-sm mb-2">Audience</label>
            <input
              className="w-full px-4 py-3 rounded-xl bg-gym-gray border-2 border-gym-gray-border text-white placeholder:text-gym-gray-text focus:outline-none focus:border-gym-yellow transition-colors"
              placeholder="Audience"
              value={newMembership.audience}
              onChange={(e) => setNewMembership({ ...newMembership, audience: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-gym-gray-text text-sm mb-2">Price</label>
            <input
              className="w-full px-4 py-3 rounded-xl bg-gym-gray border-2 border-gym-gray-border text-white placeholder:text-gym-gray-text focus:outline-none focus:border-gym-yellow transition-colors"
              type="number"
              placeholder="Price"
              value={newMembership.price}
              onChange={(e) => setNewMembership({ ...newMembership, price: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-gym-gray-text text-sm mb-2">Duration (days)</label>
            <input
              className="w-full px-4 py-3 rounded-xl bg-gym-gray border-2 border-gym-gray-border text-white placeholder:text-gym-gray-text focus:outline-none focus:border-gym-yellow transition-colors"
              type="number"
              placeholder="Duration"
              value={newMembership.durationInDays}
              onChange={(e) => setNewMembership({ ...newMembership, durationInDays: e.target.value })}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            className="flex-1 bg-gym-yellow text-gym-black-dark font-bold py-3 px-6 rounded-xl hover:bg-gym-yellow-bright transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
            onClick={editingId ? handleUpdate : handleAdd}
          >
            {editingId ? "Update Membership" : "Add Membership"}
          </button>

          {editingId && (
            <button
              className="px-6 py-3 rounded-xl bg-gym-gray border-2 border-gym-gray-border text-white font-bold hover:border-gym-yellow transition-all"
              onClick={handleCancel}
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* membership count */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">
          All Membership Types <span className="text-gym-yellow">({filtered.length})</span>
        </h2>
      </div>

      {/* memberships grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((m) => (
          <div
            key={m._id}
            className="bg-gym-gray-dark border-2 border-gym-gray-border rounded-2xl p-6 shadow-xl hover:border-gym-yellow transition-all hover:shadow-gym-yellow/10"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-1">{m.name}</h3>
                <p className="text-gym-yellow font-semibold text-lg">{m.category}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-gym-yellow/10 border-2 border-gym-yellow flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-gym-yellow" />
              </div>
            </div>

            {/* membership details */}
            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-2 text-gym-gray-text">
                <Users className="w-4 h-4" />
                <p className="text-sm">
                  <span className="font-semibold">Audience:</span> {m.audience}
                </p>
              </div>

              <div className="flex items-center gap-2 text-gym-gray-text">
                <DollarSign className="w-4 h-4" />
                <p className="text-sm">
                  <span className="font-semibold">Price:</span> ${m.price}
                </p>
              </div>

              <div className="flex items-center gap-2 text-gym-gray-text">
                <Calendar className="w-4 h-4" />
                <p className="text-sm">
                  <span className="font-semibold">Duration:</span> {m.durationInDays} days
                </p>
              </div>
            </div>

            {/* buttons */}
            <div className="flex gap-2">
              <button
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gym-yellow/10 border-2 border-gym-yellow text-gym-yellow font-semibold hover:bg-gym-yellow hover:text-gym-black-dark transition-all transform hover:scale-105"
                onClick={() => handleEdit(m)}
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>

              <button
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-red-500/10 border-2 border-red-500 text-red-500 font-semibold hover:bg-red-500 hover:text-white transition-all transform hover:scale-105"
                onClick={() => handleDelete(m._id)}
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* empty state */}
      {filtered.length === 0 && (
        <div className="text-center py-16">
          <CreditCard className="w-16 h-16 text-gym-gray-border mx-auto mb-4" />
          <p className="text-gym-gray-text text-lg">
            {search
              ? "No membership types found matching your search"
              : "No membership types yet. Create your first membership plan!"}
          </p>
        </div>
      )}
    </div>
  )
}
