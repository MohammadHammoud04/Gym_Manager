"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { Search, DollarSign, CreditCard, User, ArrowLeft, Receipt } from "lucide-react"

export default function Payments() {
  const [recentPayments, setRecentPayments] = useState([])
  const [selectedMember, setSelectedMember] = useState(null)
  const [memberPayments, setMemberPayments] = useState([])
  const [search, setSearch] = useState("")

  useEffect(() => {
    axios
      .get("http://localhost:5000/payments/recent")
      .then((res) => setRecentPayments(res.data || []))
      .catch(console.error)
  }, [])

  useEffect(() => {
    if (!selectedMember?._id) return
    axios
      .get(`http://localhost:5000/members/${selectedMember._id}/payments`)
      .then((res) => setMemberPayments(res.data || []))
      .catch(console.error)
  }, [selectedMember])

  const filteredRecent = recentPayments.filter((p) => {
    const memberPhone= p.member?.phone?.toLowerCase() || ""
    const memberName = p.member?.name?.toLowerCase() || ""
    const coachName = p.coachName?.toLowerCase() || "";
    const membershipName = p.membershipType?.name?.toLowerCase() || ""
    const invoice = p.invoiceNumber?.toLowerCase() || ""
    const q = search.toLowerCase()
    return memberName.includes(q) || membershipName.includes(q) || coachName.includes(q) || invoice.includes(q)  || memberPhone.includes(q)
  })

  return (
    <div className="min-h-screen bg-gym-black p-6 lg:p-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <DollarSign className="w-8 h-8 text-gym-yellow" />
          <h1 className="text-4xl font-bold text-white">Payments</h1>
        </div>
        <p className="text-gym-gray-text text-lg">Track and manage payment history</p>
      </div>

      <div className="mb-8 relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gym-gray-text" />
        <input
          className="w-full pl-12 pr-4 py-3 rounded-xl bg-gym-gray border-2 border-gym-gray-border text-white placeholder:text-gym-gray-text focus:outline-none focus:border-gym-yellow"
          placeholder="Search by name, membership, or number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {!selectedMember && (
        <>
          <h2 className="text-xl font-semibold text-white mb-4">
            Recent Payments <span className="text-gym-yellow">({filteredRecent.length})</span>
          </h2>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredRecent.map((p) => {
              if (!p.member) return null
              return (
                <div
                  key={p._id}
                  onClick={() => setSelectedMember({ _id: p.member._id, name: p.member.name })}
                  className="bg-gym-gray-dark border-2 border-gym-gray-border rounded-2xl p-6 hover:border-gym-yellow cursor-pointer transition"
                >
                  <div className="flex justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <User className="w-4 h-4 text-gym-yellow" />
                        <h3 className="text-lg font-bold text-white">{p.member.name}</h3>
                      </div>
                      <p className="text-sm text-gym-gray-text">
                        {p.category === "PT" ? `PT: ${p.coachName}` : (p.membershipType?.name || "—")}
                      </p>                    </div>
                    <div className="w-12 h-12 rounded-full bg-gym-yellow/10 border-2 border-gym-yellow flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-gym-yellow" />
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between">
                      <span className="text-gym-gray-text text-sm">Amount</span>
                      <span className="text-gym-yellow font-bold">${p.amount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gym-gray-text text-sm">Date</span>
                      <span className="text-white text-sm">
                        {new Date(p.date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gym-gray border border-gym-gray-border">
                    <Receipt className="w-4 h-4 text-gym-yellow" />
                    <span className="text-xs text-white font-mono">{p.invoiceNumber}</span>
                  </div>
                </div>
              )
            })}
          </div>

          {filteredRecent.length === 0 && (
            <div className="text-center py-16 text-gym-gray-text">
              No payments found
            </div>
          )}
        </>
      )}

      {selectedMember && (
        <div className="space-y-6">
          <button
            onClick={() => setSelectedMember(null)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gym-gray border-2 border-gym-gray-border text-white hover:border-gym-yellow"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <div className="bg-gym-gray-dark border-2 border-gym-yellow rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-white">{selectedMember.name}</h2>
            <p className="text-gym-gray-text">Complete payment history</p>
          </div>

          {memberPayments.length === 0 ? (
            <div className="bg-gym-gray-dark border-2 border-gym-gray-border rounded-2xl p-12 text-center text-gym-gray-text">
              No payments found for this member
            </div>
          ) : (
            <div className="space-y-4">
              {memberPayments.map((p) => (
                <div
                  key={p._id}
                  className="bg-gym-gray-dark border-2 border-gym-gray-border rounded-2xl p-6 hover:border-gym-yellow transition"
                >
                  <div className="flex justify-between gap-4 flex-wrap">
                    <div>
                    <p className="text-white font-semibold">
                      {p.category === "PT" ? `PT Session (${p.coachName})` : (p.membershipType?.name || "—")}
                    </p>
                    <p className="text-sm text-gym-gray-text font-mono">{p.invoiceNumber}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gym-yellow font-bold">${p.amount}</p>
                      <p className="text-white text-sm">
                        {new Date(p.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
