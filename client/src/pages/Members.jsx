"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { Search, UserPlus, Phone, Users, Calendar } from "lucide-react"

export default function Members() {
  const [members, setMembers] = useState([])
  const [membershipTypes, setMembershipTypes] = useState([])
  const [newMember, setNewMember] = useState({ name: "", phone: "", memberships: [] })
  const [search, setSearch] = useState("")

  const fetchMembers = async () => {
    const res = await axios.get("http://localhost:5000/members")
    const membersWithExpiry = res.data.map((member) => {
      const memberships = member.memberships.map((mem) => {
        const endDate = new Date(mem.endDate)
        const today = new Date()
        const daysLeft = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24))
        return { ...mem, isExpiringSoon: daysLeft <= 7 && daysLeft >= 0, daysLeft }
      })
      return { ...member, memberships }
    })
    setMembers(membersWithExpiry)
  }

  const fetchMembershipTypes = async () => {
    const res = await axios.get("http://localhost:5000/membership-types")
    setMembershipTypes(res.data)
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        await fetchMembershipTypes();
        await fetchMembers();
      } catch (err) {
        console.error(err)
      }
    }

    fetchData()
  }, [])

  const showDialog = async (options) => {
    if (window.electronAPI?.showMessageBox) {
      await window.electronAPI.showMessageBox(options)
    } else {
      alert(options.message)
    }
  }

  const handleAddMember = async () => {
    try {
      await axios.post("http://localhost:5000/members", {
        ...newMember,
        memberships: newMember.memberships.map((id) => ({ membershipTypeId: id })),
      })

      setNewMember({ name: "", phone: "", memberships: [] })
      fetchMembers()

      await showDialog({
        type: "info",
        title: "Success",
        message: "Member added successfully!",
        buttons: ["OK"],
      })
    } catch (err) {
      await showDialog({
        type: "error",
        title: "Error",
        message: err.response?.data?.error || err.message,
        buttons: ["OK"],
      })
    }
  }

  const filteredMembers = members.filter(
    (m) => m.name.toLowerCase().includes(search.toLowerCase()) || m.phone.includes(search)
  )

  return (
    <div className="min-h-screen bg-gym-black p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Users className="w-8 h-8 text-gym-yellow" />
          <h1 className="text-4xl font-bold text-white">Members</h1>
        </div>
        <p className="text-gym-gray-text text-lg">Manage your gym members and memberships</p>
      </div>

      {/* Search */}
      <div className="mb-8 relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gym-gray-text" />
        <input
          className="w-full pl-12 pr-4 py-3 rounded-xl bg-gym-gray border-2 border-gym-gray-border text-white placeholder:text-gym-gray-text focus:outline-none focus:border-gym-yellow transition-colors"
          placeholder="Search by name or phone number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Add Member */}
      <div className="bg-gym-gray-dark border-2 border-gym-gray-border rounded-2xl p-6 lg:p-8 mb-8 shadow-2xl">
        <div className="flex items-center gap-2 mb-6">
          <UserPlus className="w-6 h-6 text-gym-yellow" />
          <h2 className="text-2xl font-bold text-white">Add New Member</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
          <input
            className="px-4 py-3 rounded-xl bg-gym-gray border-2 border-gym-gray-border text-white placeholder:text-gym-gray-text focus:outline-none focus:border-gym-yellow transition-colors"
            placeholder="Full name"
            value={newMember.name}
            onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
          />
          <input
            className="px-4 py-3 rounded-xl bg-gym-gray border-2 border-gym-gray-border text-white placeholder:text-gym-gray-text focus:outline-none focus:border-gym-yellow transition-colors"
            placeholder="Phone number"
            value={newMember.phone}
            onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
          />

          <div className="md:col-span-2">
            <label className="block text-gym-gray-text text-sm mb-2">
              Select Memberships (hold Ctrl/Cmd for multiple)
            </label>
            <select
              multiple
              className="w-full h-32 px-4 py-2 rounded-xl bg-gym-gray border-2 border-gym-gray-border text-white focus:outline-none focus:border-gym-yellow transition-colors"
              value={newMember.memberships}
              onChange={(e) =>
                setNewMember({
                  ...newMember,
                  memberships: Array.from(e.target.selectedOptions, (opt) => opt.value),
                })
              }
            >
              {membershipTypes.map((m) => (
                <option key={m._id} value={m._id} className="py-2">
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          className="w-full bg-gym-yellow text-gym-black-dark font-bold py-3 px-6 rounded-xl hover:bg-gym-yellow-bright transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
          onClick={handleAddMember}
        >
          Add Member
        </button>
      </div>

      {/* Members Count */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">
          All Members <span className="text-gym-yellow">({filteredMembers.length})</span>
        </h2>
      </div>

      {/* Members Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredMembers.map((member) => (
          <div
            key={member._id}
            className="bg-gym-gray-dark border-2 border-gym-gray-border rounded-2xl p-6 shadow-xl hover:border-gym-yellow transition-all hover:shadow-gym-yellow/10"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2">{member.name}</h3>
                <div className="flex items-center gap-2 text-gym-gray-text">
                  <Phone className="w-4 h-4" />
                  <p className="text-sm">{member.phone}</p>
                </div>
              </div>
              <div className="w-12 h-12 rounded-full bg-gym-yellow/10 border-2 border-gym-yellow flex items-center justify-center">
                <Users className="w-6 h-6 text-gym-yellow" />
              </div>
            </div>

            {/* Memberships */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-gym-gray-text" />
                <p className="text-sm text-gym-gray-text font-semibold">Active Memberships</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {member.memberships
                  ?.filter((mem) => mem.membershipType)
                  .map((mem) => (
                    <div
                      key={mem._id}
                      className={`px-3 py-1.5 rounded-lg text-sm font-semibold border-2 ${
                        mem.isExpiringSoon
                          ? "border-red-500 bg-red-500/10 text-red-500"
                          : "border-gym-yellow bg-gym-yellow/5 text-gym-yellow"
                      } cursor-pointer hover:scale-105 transition-all`}
                      onClick={() => {
                        const message = `${mem.membershipType.category}\nStart: ${new Date(
                          mem.startDate
                        ).toLocaleDateString()} → End: ${new Date(mem.endDate).toLocaleDateString()}${
                          mem.isExpiringSoon ? `\n⚠️ Expiring in ${mem.daysLeft} days!` : ""
                        }`

                        showDialog({
                          type: mem.isExpiringSoon ? "warning" : "info",
                          title: mem.membershipType.category,
                          message,
                          buttons: ["OK"],
                        })
                      }}
                    >
                      {mem.membershipType.category}
                      {mem.isExpiringSoon && " ⚠️"}
                    </div>
                  ))}

                {(!member.memberships || member.memberships.filter((mem) => mem.membershipType).length === 0) && (
                  <p className="text-gym-gray-text text-sm italic">No active memberships</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredMembers.length === 0 && (
        <div className="text-center py-16">
          <Users className="w-16 h-16 text-gym-gray-border mx-auto mb-4" />
          <p className="text-gym-gray-text text-lg">
            {search ? "No members found matching your search" : "No members yet. Add your first member to get started!"}
          </p>
        </div>
      )}
    </div>
  )
}
