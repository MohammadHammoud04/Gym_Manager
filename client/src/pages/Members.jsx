"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { Search, UserPlus, Phone, Users, Calendar, Trash2, CheckCircle2, ChevronDown, X } from "lucide-react"

export default function Members() {
  const [members, setMembers] = useState([])
  const [membershipTypes, setMembershipTypes] = useState([])
  const [newMember, setNewMember] = useState({
    name: "",
    phone: "",
    memberships: [],
  })
  const [search, setSearch] = useState("")
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [membershipDetails, setMembershipDetails] = useState(null)
  const [showSuccess, setShowSuccess] = useState(null)
  const [infoModal, setInfoModal] = useState(null)
  const [infoForm, setInfoForm] = useState({
    bloodType: "",
    address: "",
    reference: "",
    injury: ""
  })
  const [memberFilter, setMemberFilter] = useState("all")
  const [sortCategory, setSortCategory] = useState("")

  // Helper: compute days left
  const computeDaysLeft = (endDate) => {
    const today = new Date()
    const end = new Date(endDate)
    const diff = Math.ceil((end - today) / (1000 * 60 * 60 * 24)) // days
    return diff
  }

  const fetchMembershipTypes = async () => {
    try {
      const res = await axios.get("http://localhost:5000/membership-types")
      setMembershipTypes(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  const fetchMembers = async () => {
    try {
      const res = await axios.get("http://localhost:5000/members")
      const dataWithDaysLeft = res.data.map(member => ({
        ...member,
        memberships: member.memberships?.map(mem => {
          const membershipType = mem.membershipType || membershipTypes.find(mt => mt._id === mem.membershipTypeId)
          return {
            ...mem,
            membershipType,
            daysLeft: mem.endDate ? computeDaysLeft(mem.endDate) : 0
          }
        })
      }))
      setMembers(dataWithDaysLeft)
    } catch (err) {
      console.error("Error fetching members:", err)
    }
  }

  useEffect(() => {
    fetchMembershipTypes()
  }, [])

  useEffect(() => {
    if (membershipTypes.length > 0) {
      fetchMembers()
    }
  }, [membershipTypes])

  const handleAddMember = async () => {
    try {
      const res = await axios.post("http://localhost:5000/members", newMember)
      setShowSuccess({
        name: res.data.member.name,
        count: res.data.payments.length
      })
      setNewMember({ name: "", phone: "", memberships: [] })
      await fetchMembers()
    } catch (err) {
      console.error(err)
      alert("Error adding member. Make sure fields are correct.")
    }
  }

  const handleDeleteMember = async (memberId) => {
    try {
      await axios.delete(`http://localhost:5000/members/${memberId}`)
      setDeleteConfirm(null)
      fetchMembers()
    } catch (err) {
      console.error(err)
      alert("Failed to delete member")
    }
  }

  const handleUpdateInfo = async () => {
    try {
      await axios.put(`http://localhost:5000/members/${infoModal._id}`, { info: infoForm })
      setInfoModal(null)
      fetchMembers()
    } catch (err) {
      console.error(err)
      alert("Failed to update info")
    }
  }

  const filteredMembers = members
  .filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.phone.includes(search)
  )
  .map((m) => {
    // Compute daysLeft for all memberships
    const membershipsWithDays = m.memberships?.map(mem => ({
      ...mem,
      daysLeft: computeDaysLeft(mem.endDate)
    })) || []

    let filteredMemberships = membershipsWithDays

    if (memberFilter === "inactive") {
      // Only keep expired memberships
      filteredMemberships = membershipsWithDays.filter(mem => mem.daysLeft <= 0)
      if (filteredMemberships.length === 0) return null // exclude member if no expired memberships
    } else if (memberFilter === "expiring") {
      // Only keep memberships expiring soon (1-4 days)
      filteredMemberships = membershipsWithDays.filter(mem => mem.daysLeft > 0 && mem.daysLeft <= 4)
      if (filteredMemberships.length === 0) return null // exclude member if no expiring memberships
    }

    return {
      ...m,
      memberships: filteredMemberships
    }
  })
  .filter(Boolean) // remove nulls
  .filter((m) => {
    if (!sortCategory) return true
    return m.memberships?.some(mem => (mem.membershipType?.category || mem.category) === sortCategory)
  })
  .sort((a, b) => {
    if (!sortCategory) return 0
    const aMem = a.memberships?.find(mem => (mem.membershipType?.category || mem.category) === sortCategory)
    const bMem = b.memberships?.find(mem => (mem.membershipType?.category || mem.category) === sortCategory)
    const aDays = aMem ? aMem.daysLeft : 0
    const bDays = bMem ? bMem.daysLeft : 0
    return aDays - bDays
  })

  return (
    <div className="min-h-screen bg-gym-black p-6 lg:p-8 font-sans selection:bg-gym-yellow selection:text-gym-black">

      {/* SUCCESS POPUP */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-in fade-in duration-300">
          <div className="bg-gym-gray-dark border-2 border-gym-yellow rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl text-center">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Member Processed</h3>
            <p className="text-gym-gray-text mb-6">
              <span className="text-white font-bold">{showSuccess.name}</span> has been updated with {showSuccess.count} membership(s).
            </p>
            <button
              onClick={() => setShowSuccess(null)}
              className="w-full px-4 py-3 rounded-xl bg-gym-yellow text-gym-black-dark font-bold hover:bg-gym-yellow-bright transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* MEMBERSHIP DETAILS MODAL */}
      {membershipDetails && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-in fade-in duration-300">
          <div className="bg-gym-gray-dark border-2 border-gym-yellow rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl text-center">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white tracking-tight">Membership Info</h3>
              <button onClick={() => setMembershipDetails(null)} className="text-gym-gray-text hover:text-white">
                <X />
              </button>
            </div>
            <p className="text-gym-gray-text mb-2">
              <span className="font-black text-white">Category:</span> {membershipDetails.category}
            </p>
            <p className="text-gym-gray-text mb-2">
              <span className="font-black text-white">Start Date:</span> {new Date(membershipDetails.startDate).toLocaleDateString()}
            </p>
            <p className="text-gym-gray-text mb-2">
              <span className="font-black text-white">End Date:</span> {new Date(membershipDetails.endDate).toLocaleDateString()}
            </p>
            <p className="text-gym-gray-text mb-4">
              <span className="font-black text-white">Days Left:</span> {computeDaysLeft(membershipDetails.endDate)} days
            </p>
            <button
              onClick={() => setMembershipDetails(null)}
              className="w-full px-4 py-3 rounded-xl bg-gym-yellow text-gym-black-dark font-bold hover:bg-gym-yellow-bright transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-in fade-in duration-300">
          <div className="bg-gym-gray-dark border-2 border-gym-gray-border rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl text-center">
            <Trash2 className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Delete Member</h3>
            <p className="text-gym-gray-text mb-6">Are you sure you want to delete {deleteConfirm.name}?</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-3 rounded-xl border-2 border-gym-gray-border text-white">Cancel</button>
              <button onClick={() => handleDeleteMember(deleteConfirm._id)} className="flex-1 px-4 py-3 rounded-xl bg-red-500 text-white font-bold">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* INFO MODAL */}
      {infoModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-in fade-in duration-300">
          <div className="bg-gym-gray-dark border-2 border-gym-gray-border rounded-2xl p-6 lg:p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-black text-white uppercase tracking-tight">Member Info</h3>
              <button onClick={() => setInfoModal(null)} className="text-gym-gray-text hover:text-white"><X /></button>
            </div>
            <div className="space-y-4">
              {[["bloodType", "Blood Type"], ["address", "Address"], ["reference", "Reference"], ["injury", "Injury"]].map(([key, label]) => (
                <div key={key}>
                  <label className="block text-[10px] font-black uppercase text-gym-gray-text mb-1.5 ml-1 tracking-widest">{label}</label>
                  <input
                    className="w-full px-4 py-3 rounded-xl bg-gym-gray border-2 border-gym-gray-border text-white placeholder:text-gym-gray-text/40 focus:border-gym-yellow outline-none transition-all"
                    placeholder={`Enter ${label.toLowerCase()}...`}
                    value={infoForm[key]}
                    onChange={(e) => setInfoForm({ ...infoForm, [key]: e.target.value })}
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setInfoModal(null)} className="flex-1 px-4 py-3 rounded-xl border-2 border-gym-gray-border text-white font-bold">Cancel</button>
              <button
                onClick={handleUpdateInfo}
                className="flex-1 px-4 py-3 rounded-xl bg-gym-yellow text-gym-black-dark font-black uppercase tracking-widest"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Users className="w-8 h-8 text-gym-yellow" />
          <h1 className="text-4xl font-bold text-white tracking-tight uppercase">Members</h1>
        </div>
        <p className="text-gym-gray-text text-lg">Manage gym members and their status</p>
      </div>

      {/* Search Bar */}
      <div className="mb-8 relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gym-gray-text group-focus-within:text-gym-yellow transition-colors" />
        <input
          className="w-full pl-12 pr-4 py-4 rounded-xl bg-gym-gray border-2 border-gym-gray-border text-white focus:border-gym-yellow outline-none transition-all placeholder:text-gym-gray-text/50 shadow-inner"
          placeholder="Search by name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {/* ADD MEMBER FORM */}
      <div className="bg-gym-gray-dark border-2 border-gym-gray-border rounded-2xl p-6 lg:p-8 mb-12 shadow-2xl relative overflow-hidden">
        <div className="flex items-center gap-2 mb-8">
          <div className="p-2 bg-gym-yellow/10 rounded-lg">
            <UserPlus className="w-6 h-6 text-gym-yellow" />
          </div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Add New Member</h2>
        </div>

        <div className="grid gap-10 lg:grid-cols-2">
          {/* Left Side: Inputs */}
          <div className="flex flex-col gap-6">
            <div>
              <label className="block text-[10px] font-black uppercase text-gym-gray-text mb-2 ml-1 tracking-widest">Full Name</label>
              <input
                className="w-full px-4 py-3.5 rounded-xl bg-gym-gray border-2 border-gym-gray-border text-white focus:border-gym-yellow transition-all outline-none"
                placeholder="Ex: John Smith"
                value={newMember.name}
                onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-gym-gray-text mb-2 ml-1 tracking-widest">Phone Number</label>
              <input
                className="w-full px-4 py-3.5 rounded-xl bg-gym-gray border-2 border-gym-gray-border text-white focus:border-gym-yellow transition-all outline-none"
                placeholder="Ex: 03123456"
                value={newMember.phone}
                onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
              />
            </div>
            <div className="mt-auto">
               <p className="text-gym-gray-text text-[11px] italic opacity-60">* Double check phone format before saving.</p>
            </div>
          </div>

          {/* Right Side: Membership Scroll List */}
          <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-2 px-1">
              <label className="text-[10px] font-black uppercase text-gym-gray-text tracking-widest">Membership Selection</label>
              <span className="text-[10px] font-black bg-gym-yellow/20 text-gym-yellow px-2.5 py-1 rounded border border-gym-yellow/30 uppercase">
                {newMember.memberships.length} Selected
              </span>
            </div>
            
            <div className="bg-gym-black/40 border-2 border-gym-gray-border rounded-xl overflow-hidden flex-1 min-h-[180px]">
              <div className="max-h-[180px] overflow-y-auto p-2 space-y-2 custom-scrollbar">
                {membershipTypes.map((m) => {
                  const selected = newMember.memberships.find(x => x.membershipTypeId === m._id);
                  return (
                    <div
                      key={m._id}
                      className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                        selected ? 'border-gym-yellow bg-gym-yellow/10 shadow-[0_0_15px_rgba(234,179,8,0.05)]' : 'border-gym-gray-border bg-gym-black/20 opacity-70'
                      }`}
                    >
                      <label className="flex items-center gap-3 cursor-pointer flex-1 text-white text-sm font-bold">
                        <input
                          type="checkbox"
                          className="accent-gym-yellow w-4 h-4 cursor-pointer"
                          checked={!!selected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewMember({
                                ...newMember,
                                memberships: [...newMember.memberships, { membershipTypeId: m._id, discount: 0 }]
                              })
                            } else {
                              setNewMember({
                                ...newMember,
                                memberships: newMember.memberships.filter(x => x.membershipTypeId !== m._id)
                              })
                            }
                          }}
                        />
                        <div className="flex flex-col">
                          <span className="leading-tight uppercase tracking-tight">{m.name}</span>
                          <span className="text-gym-yellow text-[10px] font-black">${m.price}</span>
                        </div>
                      </label>

                      {selected && (
                        <div className="flex items-center gap-2 ml-4">
                          <span className="text-[9px] uppercase text-gym-gray-text font-black">Discount</span>
                          <input
                            type="number"
                            className="w-16 px-2 py-1 text-xs font-bold rounded-md bg-gym-black border border-gym-gray-border text-white focus:border-gym-yellow outline-none"
                            value={selected.discount}
                            onChange={(e) => {
                              setNewMember({
                                ...newMember,
                                memberships: newMember.memberships.map(x =>
                                  x.membershipTypeId === m._id ? { ...x, discount: Number(e.target.value) } : x
                                )
                              })
                            }}
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        <button
          className="w-full mt-10 bg-gym-yellow text-gym-black-dark font-black py-4 px-6 rounded-xl hover:bg-gym-yellow-bright transition-all transform hover:scale-[1.01] active:scale-[0.99] shadow-lg flex items-center justify-center gap-3 uppercase tracking-widest"
          onClick={handleAddMember}
        >
          <UserPlus className="w-5 h-5" />
          Create Member Record
        </button>
      </div>

      {/* FILTER & SORT SECTION */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-8 mt-12">
        <div className="flex flex-wrap items-center gap-x-10 gap-y-4">
          {[
            { id: "all", label: "All Members" },
            { id: "inactive", label: "Inactive" },
            { id: "expiring", label: "Expiring Soon" }
          ].map((filter) => (
            <h2
              key={filter.id}
              onClick={() => setMemberFilter(filter.id)}
              className={`text-2xl font-black cursor-pointer relative pb-2 uppercase tracking-tighter ${
                memberFilter === filter.id 
                  ? "text-white" 
                  : "text-gym-gray-text hover:text-white/70"
              }`}
            >
              {filter.label}
              {memberFilter === filter.id && (
                <span className="absolute bottom-0 left-0 w-full h-1 bg-gym-yellow rounded-full shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
              )}
            </h2>
          ))}
        </div>

        <div className="relative min-w-[220px] group">
          <label className="block text-[10px] font-black uppercase text-gym-gray-text mb-2 ml-1 tracking-widest">
            Sort by Category
          </label>
          <div className="relative">
            <select
              value={sortCategory}
              onChange={(e) => setSortCategory(e.target.value)}
              className="w-full appearance-none px-4 py-3 rounded-xl bg-gym-gray-dark text-white border-2 border-gym-gray-border focus:border-gym-yellow outline-none font-bold text-sm cursor-pointer transition-all hover:bg-gym-gray-border/30"
            >
              <option value="">No Sorting</option>
              {[...new Set(membershipTypes.map(m => m.category))].map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gym-gray-text pointer-events-none group-hover:text-gym-yellow transition-colors" />
          </div>
        </div>
      </div>

      {/* Members Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredMembers.map((member) => (
          <div key={member._id} className="bg-gym-gray-dark border-2 border-gym-gray-border rounded-2xl p-6 shadow-xl hover:border-gym-yellow/50 transition-all hover:-translate-y-1 group/card">
            <div className="flex items-start justify-between mb-5">
              <div className="flex-1">
                <h3 className="text-xl font-black text-white mb-1 tracking-tight group-hover/card:text-gym-yellow transition-colors">{member.name}</h3>
                <div className="flex items-center gap-2 text-gym-gray-text">
                  <Phone className="w-3.5 h-3.5" />
                  <p className="text-sm font-bold tracking-tight">{member.phone}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setDeleteConfirm(member)} 
                  className="w-9 h-9 rounded-full bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center hover:bg-red-500 text-red-500 hover:text-white transition-all shadow-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => { setInfoModal(member); setInfoForm(member.info || { bloodType: "", address: "", reference: "", injury: "" }) }} 
                  className="w-10 h-10 rounded-full bg-gym-yellow/10 border-2 border-gym-yellow flex items-center justify-center text-gym-yellow hover:bg-gym-yellow hover:text-gym-black-dark transition-all shadow-lg"
                >
                  <Users className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-gym-gray-text border-b border-gym-gray-border/50 pb-2">
                <Calendar className="w-3.5 h-3.5 text-gym-yellow" />
                <p className="text-[10px] font-black uppercase tracking-widest">Active Memberships</p>
              </div>
              <div className="flex flex-wrap gap-2">
              {member.memberships?.filter(m => m.membershipType).map((mem, idx) => {
                const daysLeft = computeDaysLeft(mem.endDate)
                return (
                  <div
                    key={mem._id || idx}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black border-2 cursor-pointer transition-all ${
                      daysLeft <= 0
                        ? "border-gray-500/30 bg-gray-500/5 text-gray-500" // expired
                        : daysLeft <= 4
                        ? "border-red-500 bg-red-500/10 text-red-500" // expiring soon
                        : "border-gym-yellow bg-gym-yellow/5 text-gym-yellow hover:bg-gym-yellow hover:text-gym-black-dark" // active
                    }`}
                    onClick={() => daysLeft > 0 && setMembershipDetails({
                      category: mem.membershipType?.category || "N/A",
                      startDate: mem.startDate,
                      endDate: mem.endDate
                    })}
                  >
                    {mem.membershipType?.category || "Unknown"} — {daysLeft}d
                  </div>
                )
              })}

              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}