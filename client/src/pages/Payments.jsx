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
    const fetchRecent = async () => {
      try {
        const res = await axios.get("http://localhost:5000/payments/recent")
        setRecentPayments(res.data)
      } catch (err) {
        console.error(err)
      }
    }
    fetchRecent()
  }, [])

  useEffect(() => {
    if (!selectedMember) return
    const fetchAllPayments = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/members/${selectedMember._id}/payments`)
        setMemberPayments(res.data)
      } catch (err) {
        console.error(err)
      }
    }
    fetchAllPayments()
  }, [selectedMember])

  // Filter payments by search term
  const filteredRecent = recentPayments.filter(
    (p) =>
      p.member.name.toLowerCase().includes(search.toLowerCase()) ||
      p.membershipType?.name.toLowerCase().includes(search.toLowerCase()) ||
      p.invoiceNumber.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="min-h-screen bg-gym-black p-6 lg:p-8">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <DollarSign className="w-8 h-8 text-gym-yellow" />
          <h1 className="text-4xl font-bold text-white">Payments</h1>
        </div>
        <p className="text-gym-gray-text text-lg">Track and manage payment history</p>
      </div>

      {/* Search Section */}
      <div className="mb-8 relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gym-gray-text" />
        <input
          className="w-full pl-12 pr-4 py-3 rounded-xl bg-gym-gray border-2 border-gym-gray-border text-white placeholder:text-gym-gray-text focus:outline-none focus:border-gym-yellow transition-colors"
          placeholder="Search payments by name, membership type, or invoice number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Recent Payments View */}
      {!selectedMember && (
        <>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">
              Recent Payments <span className="text-gym-yellow">({filteredRecent.length})</span>
            </h2>
          </div>

          {/* Payments Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredRecent.map((p) => (
              <div
                key={p._id}
                className="bg-gym-gray-dark border-2 border-gym-gray-border rounded-2xl p-6 shadow-xl hover:border-gym-yellow transition-all hover:shadow-gym-yellow/10 cursor-pointer transform hover:scale-[1.02]"
                onClick={() => setSelectedMember({ _id: p.member._id, name: p.member.name })}
              >
                {/* Payment Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-gym-yellow" />
                      <h3 className="text-lg font-bold text-white">{p.member.name}</h3>
                    </div>
                    <p className="text-sm text-gym-gray-text">{p.membershipType?.name}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-gym-yellow/10 border-2 border-gym-yellow flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-gym-yellow" />
                  </div>
                </div>

                {/* Payment Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gym-gray-text text-sm">Amount:</span>
                    <span className="text-gym-yellow font-bold text-lg">${p.amount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gym-gray-text text-sm">Date:</span>
                    <span className="text-white text-sm">{new Date(p.date).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Invoice Badge */}
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gym-gray border border-gym-gray-border">
                  <Receipt className="w-4 h-4 text-gym-yellow" />
                  <span className="text-xs text-gym-gray-text">Invoice: </span>
                  <span className="text-xs text-white font-mono">{p.invoiceNumber}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredRecent.length === 0 && (
            <div className="text-center py-16">
              <DollarSign className="w-16 h-16 text-gym-gray-border mx-auto mb-4" />
              <p className="text-gym-gray-text text-lg">
                {search ? "No payments found matching your search" : "No recent payments to display"}
              </p>
            </div>
          )}
        </>
      )}

      {/* Member Payment History View */}
      {selectedMember && (
        <div className="space-y-6">
          {/* Back Button */}
          <button
            onClick={() => setSelectedMember(null)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gym-gray border-2 border-gym-gray-border text-white hover:border-gym-yellow transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Recent Payments</span>
          </button>

          {/* Member Header */}
          <div className="bg-gym-gray-dark border-2 border-gym-yellow rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-gym-yellow/10 border-2 border-gym-yellow flex items-center justify-center">
                <User className="w-7 h-7 text-gym-yellow" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{selectedMember.name}</h2>
                <p className="text-gym-gray-text">Complete Payment History</p>
              </div>
            </div>
          </div>

          {/* Member Payments List */}
          {memberPayments.length === 0 ? (
            <div className="bg-gym-gray-dark border-2 border-gym-gray-border rounded-2xl p-12 text-center">
              <DollarSign className="w-16 h-16 text-gym-gray-border mx-auto mb-4" />
              <p className="text-gym-gray-text text-lg">No payments found for this member.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {memberPayments.map((p) => (
                <div
                  key={p._id}
                  className="bg-gym-gray-dark border-2 border-gym-gray-border rounded-2xl p-6 shadow-xl hover:border-gym-yellow transition-all"
                >
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex-1 min-w-[200px]">
                      <p className="text-white font-semibold text-lg mb-1">{p.membershipType?.name}</p>
                      <div className="flex items-center gap-2">
                        <Receipt className="w-4 h-4 text-gym-gray-text" />
                        <span className="text-sm text-gym-gray-text font-mono">{p.invoiceNumber}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-gym-gray-text text-sm mb-1">Amount</p>
                        <p className="text-gym-yellow font-bold text-xl">${p.amount}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-gym-gray-text text-sm mb-1">Date</p>
                        <p className="text-white font-semibold">{new Date(p.date).toLocaleDateString()}</p>
                      </div>
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
