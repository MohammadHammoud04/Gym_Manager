"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { Search, UserPlus, Phone, Users, Calendar, Trash2, CheckCircle2, ChevronDown, X, AlertCircle } from "lucide-react"

export default function Members() {
  const [members, setMembers] = useState([])
  const [membershipTypes, setMembershipTypes] = useState([])
  const [newMember, setNewMember] = useState({
    name: "",
    phone: "",
    memberships: [],
    paidAmount: 0,
  })
  const [ptForm, setPtForm] = useState({
    coachName: "",
    type: "Member",
    sessions: 0,
    price: 0
  });
  const [editDates, setEditDates] = useState({ start: "", end: "" });
  const [search, setSearch] = useState("")
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [membershipDetails, setMembershipDetails] = useState(null)
  const [showSuccess, setShowSuccess] = useState(null)
  const [infoModal, setInfoModal] = useState(null)
  const [infoForm, setInfoForm] = useState({
    bloodType: "",
    address: "",
    reference: "",
    injury: "",
    note: ""
  })
  const [isFreezing, setIsFreezing] = useState(false);
  const [memberFilter, setMemberFilter] = useState("all")
  const [sortCategory, setSortCategory] = useState("")
  const [confirmAction, setConfirmAction] = useState(null);
  const [paymentModal, setPaymentModal] = useState({ 
    isOpen: false, 
    member: null, 
    amount: "", 
    membershipTypeId: null,
    coachName: null
  });
  
  const membershipTotal = newMember.memberships.reduce((sum, m) => {
    const type = membershipTypes.find(mt => mt._id === m.membershipTypeId);
    if (!type) return sum;
    const qty = m.quantity || 1;
    const discount = Number(m.discount || 0);
    return sum + (type.price * qty - discount);
  }, 0);

  const ptTotal = Number(ptForm.sessions || 0) * Number(ptForm.price || 0);
  const grandTotal = membershipTotal + ptTotal;
  const balanceDue = grandTotal - Number(newMember.paidAmount || 0);

  const computeDaysLeft = (endDate) => {
    if (!endDate) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  };

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
            daysLeft: mem.endDate ? computeDaysLeft(mem.endDate) : 0,
            balance : Number(mem.balance || 0)
          }
        })
      }))
      setMembers(dataWithDaysLeft)
    } catch (err) {
      console.error("Error fetching members:", err)
    }
  }

  const handleDecrement = async (memberId, coachName) => {
    const currentUser = localStorage.getItem("gymUser"); 
    try {
      await axios.patch(`http://localhost:5000/members/${memberId}/decrement-pt`, { coachName,
        userName: currentUser
       });
      fetchMembers(); 
    } catch (err) {
      console.error("Error decrementing PT session:", err);
      alert("Failed to decrement session");
    }
  };

  const handleQuickAdd = (member) => {
    setNewMember({
      name: member.name,
      phone: member.phone,
      memberships: [],
      paidAmount: 0
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.getElementById('membership-select')?.focus();
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
    const currentUser = localStorage.getItem("gymUser"); 
    try {
      const mTotal = newMember.memberships.reduce((sum, m) => {
        const type = membershipTypes.find(mt => mt._id === m.membershipTypeId);
        if (!type) return sum; 
        const qty = m.quantity || 1;
        return sum + (Number(type.price) * qty - Number(m.discount || 0));
      }, 0);
  
      const ptTotal = Number(ptForm.sessions || 0) * Number(ptForm.price || 0);
  
      const finalGrandTotal = mTotal + ptTotal;
  
      const payload = {
        ...newMember,
        ptDetails: ptForm,
        totalAmount: finalGrandTotal,
        paidAmount: Number(newMember.paidAmount || 0),
        userName: currentUser
      };
  
      const res = await axios.post("http://localhost:5000/members", payload);
      
      setShowSuccess({
        name: res.data.member.name,
        count: res.data.payments.length 
      });
  
      setNewMember({ 
        name: "", 
        phone: "", 
        memberships: [], 
        paidAmount: 0
      });
      setPtForm({ coachName: "", type: "Member", sessions: 0, price: 0 });
      
      await fetchMembers();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Error adding member. Check your connection.");
    }
  };

  const handleDeleteMember = async (memberId) => {
    const currentUser = localStorage.getItem("gymUser"); 
    try {
      await axios.delete(`http://localhost:5000/members/${memberId}`,{
        data: {userName : currentUser}
      });
      
      setDeleteConfirm(null);
      
      await fetchMembers(); 
      
      console.log("Member deleted and list refreshed.");
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete member. Make sure the backend route exists.");
    }
  };

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

  const handleUpdateDates = async () => {
    const currentUser = localStorage.getItem("gymUser");
    try {
      await axios.patch(`http://localhost:5000/members/${membershipDetails.memberId}/memberships/${membershipDetails.membershipId}/dates`, {
        startDate: editDates.start,
        endDate: editDates.end,
        userName: currentUser
      });
      setMembershipDetails(null);
      fetchMembers();
    } catch (err) {
      alert("Failed to update dates");
    }
  };

  const executeFreezeToggle = async () => {
    if (!confirmAction) return;    
    const { memberId: mId, membershipId: msId } = confirmAction;
    const currentUser = localStorage.getItem("gymUser"); 
    setIsFreezing(true);
    try {
      await axios.patch(`http://localhost:5000/members/${mId}/memberships/${msId}/freeze`,
        {userName : currentUser}
      );
      setMembershipDetails(null);
      setConfirmAction(null);
      await fetchMembers();
    } catch (err) {
      console.error("Freeze Error:", err);
      alert(err.response?.data?.message || "Failed to toggle freeze status");
    } finally {
      setIsFreezing(false);
    }
  };

  const filteredMembers = members
  .filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.phone.includes(search)
  )
  .map((m) => {
    const membershipsWithDays = m.memberships?.map(mem => ({
      ...mem,
      balance : Number(mem.balance || 0),
      daysLeft: computeDaysLeft(mem.endDate)
    })) || [];

    if (memberFilter === "inactive") {
      const expired = membershipsWithDays.filter(mem => mem.daysLeft <= 0 && !mem.isFrozen);
      if (expired.length === 0) return null;
      return { ...m, memberships: expired };
    } 
    
    if (memberFilter === "expiring") {
      const soon = membershipsWithDays.filter(mem => mem.daysLeft > 0 && mem.daysLeft <= 7 && !mem.isFrozen);
      if (soon.length === 0) return null;
      return { ...m, memberships: soon };
    } 
    
    if (memberFilter === "pt") {
      const hasPT = m.personalTraining && m.personalTraining.some(pt => pt.sessionsLeft > 0);
      if (!hasPT) return null;
    }

    if (memberFilter === "frozen") {
      const frozenMems = membershipsWithDays.filter(mem => mem.isFrozen);
      if (frozenMems.length === 0) return null;
      return { ...m, memberships: frozenMems };
    }

    if (sortCategory) {
      if (sortCategory === "PT") {
        const hasPT = m.personalTraining && m.personalTraining.some(pt => pt.sessionsLeft > 0);
        if (!hasPT) return null;
      } else {
        const hasCategory = membershipsWithDays.some(mem => mem.membershipType?.category === sortCategory);
        if (!hasCategory) return null;
      }
    }
    return {
      ...m,
      memberships: membershipsWithDays
    };
  })
  .filter(Boolean) 
    .sort((a, b) => {
    if (!sortCategory || sortCategory === "PT") return 0;
    const aMem = a.memberships?.find(mem => mem.membershipType?.category === sortCategory);
    const bMem = b.memberships?.find(mem => mem.membershipType?.category === sortCategory);
    return (aMem?.daysLeft || 0) - (bMem?.daysLeft || 0);
  });

  const handleOpenPaymentModal = (member, membershipType = null, coachName = null) => {
    setPaymentModal({ 
      isOpen: true, 
      member, 
      amount: member.balance || 0,
      membershipTypeId: membershipType ? membershipType._id : null ,
      coachName: coachName
    });
  };
  
  const handleProcessPayment = async () => {
    const currentUser = localStorage.getItem("gymUser"); 
    try {
      const res = await axios.patch(`http://localhost:5000/members/${paymentModal.member._id}/pay-balance`, {
        amountPaid: paymentModal.amount,
        membershipTypeId: paymentModal.membershipTypeId || null,
        coachName: paymentModal.coachName || null,
        userName: currentUser
      });
      
      setPaymentModal({ isOpen: false, member: null, amount: "" });
      await fetchMembers(); 
      setMembershipDetails(null);
      } catch (err) {
      console.error(err);
      alert("Error processing payment.");
    }
  };

  return (
    <div className="min-h-screen bg-gym-black p-6 lg:p-8">
      {/* success modal */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gym-gray-dark border-2 border-gym-yellow rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl text-center">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Member Processed</h3>
            <p className="text-gym-gray-text mb-6">
              <span className="text-white font-bold">{showSuccess.name}</span> has been updated with{" "}
              {showSuccess.count} membership(s).
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

      {/* membership details modal */}
      {membershipDetails && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gym-gray-dark border-2 border-gym-yellow rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl text-center">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Membership Info</h3>
              <button onClick={() => setMembershipDetails(null)} className="text-gym-gray-text hover:text-white">
                <X />
              </button>
            </div>

            <div className="mb-4">
              {membershipDetails.isFrozen ? (
                <span className="px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500 text-blue-500 text-[10px] font-black uppercase">
                  Currently Frozen
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full bg-green-500/20 border border-green-500 text-green-500 text-[10px] font-black uppercase">
                  Active
                </span>
              )}
            </div>

            <p className="text-gym-gray-text mb-2">
              <span className="font-black text-white">Category:</span> {membershipDetails.category}
            </p>

            {!membershipDetails.isFrozen && (
              <>
                <div className="space-y-4 my-4 text-left">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-gym-gray-text mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      className="w-full px-4 py-2 rounded-xl bg-gym-gray border-2 border-gym-gray-border text-white outline-none focus:border-gym-yellow"
                      value={editDates.start}
                      onChange={(e) => setEditDates({ ...editDates, start: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-gym-gray-text mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      className="w-full px-4 py-2 rounded-xl bg-gym-gray border-2 border-gym-gray-border text-white outline-none focus:border-gym-yellow"
                      value={editDates.end}
                      onChange={(e) => setEditDates({ ...editDates, end: e.target.value })}
                    />
                  </div>
                </div>

                <p className="text-gym-gray-text mb-6">
                  <span className="font-black text-white">New Days Left:</span>{" "}
                  <span className="text-gym-yellow font-bold">{computeDaysLeft(editDates.end)} days</span>
                </p>

                <button
                  onClick={handleUpdateDates}
                  className="w-full px-4 py-3 mb-2 rounded-xl bg-gym-yellow text-gym-black font-black uppercase hover:bg-gym-yellow-bright transition-all"
                >
                  Save New Dates
                </button>
              </>
            )}

            <p className="text-gym-gray-text mb-6">
              <span className="font-black text-white">Days Left:</span>{" "}
              <span className={membershipDetails.isFrozen ? "text-blue-400 font-bold" : "text-white"}>
                {membershipDetails.isFrozen
                  ? membershipDetails.daysLeftAtFreeze
                  : computeDaysLeft(membershipDetails.endDate)}{" "}
                days
              </span>
            </p>

            <div className="flex flex-col gap-3">
              <button
                disabled={isFreezing}
                onClick={() =>
                  setConfirmAction({
                    type: membershipDetails.isFrozen ? "unfreeze" : "freeze",
                    memberId: membershipDetails.memberId,
                    membershipId: membershipDetails.membershipId,
                    title: membershipDetails.isFrozen ? "Resume Membership?" : "Freeze Membership?",
                    message: membershipDetails.isFrozen
                      ? "This will reactivate the membership starting from today."
                      : "This will pause the membership and save the remaining days.",
                  })
                }
                className={`w-full px-4 py-3 rounded-xl font-black uppercase transition-all ${
                  membershipDetails.isFrozen
                    ? "bg-green-600 hover:bg-green-500 text-white"
                    : "bg-blue-600 hover:bg-blue-500 text-white"
                }`}
              >
                {isFreezing ? "Processing..." : membershipDetails.isFrozen ? "Unfreeze Membership" : "Freeze Membership"}
              </button>

              {membershipDetails.specificBalance > 0 && (
                <div className="mt-4 mb-6 p-4 bg-gym-yellow/10 border border-gym-yellow/30 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase text-gym-yellow">Outstanding Debt</span>
                    <span className="text-white font-black">${membershipDetails.specificBalance}</span>
                  </div>
                  <button
                    onClick={() =>
                      handleOpenPaymentModal(
                        { _id: membershipDetails.memberId, name: membershipDetails.memberName },
                        { _id: membershipDetails.membershipId }
                      )
                    }
                    className="w-full py-2 bg-gym-yellow text-gym-black font-black uppercase text-[10px] rounded-lg hover:bg-white transition-all"
                  >
                    Pay ${membershipDetails.specificBalance}
                  </button>
                </div>
              )}

              <button
                onClick={() => setMembershipDetails(null)}
                className="w-full px-4 py-3 rounded-xl bg-gym-gray border-2 border-gym-gray-border text-white font-bold hover:bg-gym-gray-border transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* confirm modal */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60]">
          <div className="bg-gym-gray-dark border-2 border-gym-yellow rounded-2xl p-6 max-w-xs w-full mx-4 shadow-2xl text-center">
            <div className="mb-4 flex justify-center">
              <div className={`p-3 rounded-full ${confirmAction.type === "freeze" ? "bg-blue-500/20 text-blue-500" : "bg-green-500/20 text-green-500"}`}>
                <AlertCircle size={32} />
              </div>
            </div>

            <h3 className="text-xl font-black text-white uppercase mb-2">{confirmAction.title}</h3>
            <p className="text-gym-gray-text text-sm mb-6">{confirmAction.message}</p>

            <div className="flex flex-col gap-2">
              <button
                disabled={isFreezing}
                onClick={executeFreezeToggle}
                className={`w-full py-3 rounded-xl font-black uppercase transition-all ${
                  confirmAction.type === "freeze"
                    ? "bg-blue-600 hover:bg-blue-500 text-white"
                    : "bg-green-600 hover:bg-green-500 text-white"
                }`}
              >
                {isFreezing ? "Processing..." : "Confirm"}
              </button>

              <button
                onClick={() => setConfirmAction(null)}
                className="w-full py-3 rounded-xl bg-gym-gray text-white font-bold hover:bg-gym-gray-border"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* delete confirm modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gym-gray-dark border-2 border-gym-gray-border rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl text-center">
            <Trash2 className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Delete Member</h3>
            <p className="text-gym-gray-text mb-6">Are you sure you want to delete {deleteConfirm.name}?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-3 rounded-xl border-2 border-gym-gray-border text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteMember(deleteConfirm._id)}
                className="flex-1 px-4 py-3 rounded-xl bg-red-500 text-white font-bold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* info modal */}
      {infoModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gym-gray-dark border-2 border-gym-gray-border rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-black text-white uppercase">Member Info</h3>
              <button onClick={() => setInfoModal(null)} className="text-gym-gray-text hover:text-white">
                <X />
              </button>
            </div>
            <div className="space-y-4">
              {[
                ["bloodType", "Blood Type"],
                ["address", "Address"],
                ["reference", "Reference"],
                ["injury", "Injury"],
                ["note", "Note"],
              ].map(([key, label]) => (
                <div key={key}>
                  <label className="block text-[10px] font-black uppercase text-gym-gray-text mb-1">
                    {label}
                  </label>
                  <input
                    className="w-full px-4 py-3 rounded-xl bg-gym-gray border-2 border-gym-gray-border text-white placeholder:text-gym-gray-text/40 focus:border-gym-yellow outline-none"
                    placeholder={`Enter ${label.toLowerCase()}...`}
                    value={infoForm[key]}
                    onChange={(e) =>
                      setInfoForm({ ...infoForm, [key]: e.target.value })
                    }
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setInfoModal(null)}
                className="flex-1 px-4 py-3 rounded-xl border-2 border-gym-gray-border text-white font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateInfo}
                className="flex-1 px-4 py-3 rounded-xl bg-gym-yellow text-gym-black-dark font-black uppercase"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Users className="w-8 h-8 text-gym-yellow" />
          <h1 className="text-4xl font-bold text-white">Members</h1>
        </div>
        <p className="text-gym-gray-text text-lg">Manage gym members and memberships</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* form/left */}
        <div className="lg:col-span-1">
          <div className="bg-gym-gray-dark border-2 border-gym-gray-border rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center gap-2 mb-6">
              <UserPlus className="w-6 h-6 text-gym-yellow" />
              <h2 className="text-2xl font-bold text-white">Add Member</h2>
            </div>

            <form className="space-y-4">
              <div>
                <label className="block text-gym-gray-text text-sm mb-2">Member Name</label>
                <input
                  type="text"
                  placeholder="Ex: John Smith"
                  className="w-full px-4 py-3 rounded-xl bg-gym-gray border-2 border-gym-gray-border text-white focus:border-gym-yellow outline-none"
                  value={newMember.name}
                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-gym-gray-text text-sm mb-2">Phone Number</label>
                <input
                  type="tel"
                  placeholder="Ex: 03123456"
                  className="w-full px-4 py-3 rounded-xl bg-gym-gray border-2 border-gym-gray-border text-white focus:border-gym-yellow outline-none"
                  value={newMember.phone}
                  onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-gym-gray-text text-sm mb-2">Memberships</label>
                <div className="bg-gym-black/40 border-2 border-gym-gray-border rounded-xl p-2 max-h-[200px] overflow-y-auto">
                  {membershipTypes.map((m) => {
                    const selected = newMember.memberships.find((x) => x.membershipTypeId === m._id)
                    return (
                      <label key={m._id} className="flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-gym-gray/30">
                        <input
                          type="checkbox"
                          className="accent-gym-yellow"
                          checked={!!selected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewMember({
                                ...newMember,
                                memberships: [...newMember.memberships, { membershipTypeId: m._id, discount: 0 }],
                              })
                            } else {
                              setNewMember({
                                ...newMember,
                                memberships: newMember.memberships.filter((x) => x.membershipTypeId !== m._id),
                              })
                            }
                          }}
                        />
                        <div className="flex-1">
                          <p className="text-white text-sm font-semibold">{m.name}</p>
                          <p className="text-gym-yellow text-xs">${m.price}</p>
                        </div>
                      </label>
                    )
                  })}
                </div>
              </div>

              <div className="pt-6 border-t border-gym-gray-border">
                <h3 className="text-sm font-black text-white uppercase mb-4">Personal Training</h3>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <input
                    type="text"
                    placeholder="Coach Name"
                    className="px-3 py-2 rounded-lg bg-gym-gray border-2 border-gym-gray-border text-white text-sm focus:border-gym-yellow outline-none"
                    value={ptForm.coachName}
                    onChange={(e) => setPtForm({ ...ptForm, coachName: e.target.value })}
                  />
                  <select
                    className="px-3 py-2 rounded-lg bg-gym-gray border-2 border-gym-gray-border text-white text-sm focus:border-gym-yellow outline-none"
                    value={ptForm.type}
                    onChange={(e) => setPtForm({ ...ptForm, type: e.target.value })}
                  >
                    <option value="Member">Gym Member</option>
                    <option value="Daily Access">Daily Access</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    placeholder="Sessions"
                    className="px-3 py-2 rounded-lg bg-gym-gray border-2 border-gym-gray-border text-white text-sm focus:border-gym-yellow outline-none"
                    value={ptForm.sessions || ""}
                    onChange={(e) => setPtForm({ ...ptForm, sessions: Number(e.target.value) })}
                  />
                  <input
                    type="number"
                    placeholder="Price/Session"
                    className="px-3 py-2 rounded-lg bg-gym-gray border-2 border-gym-gray-border text-white text-sm focus:border-gym-yellow outline-none"
                    value={ptForm.price || ""}
                    onChange={(e) => setPtForm({ ...ptForm, price: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="bg-gym-yellow/5 border-2 border-gym-yellow/20 rounded-xl p-4">
                <div className="grid grid-cols-3 gap-2 text-center text-xs mb-4">
                  <div>
                    <p className="text-gym-gray-text">Grand Total</p>
                    <p className="text-lg font-black text-white">${grandTotal}</p>
                  </div>
                  <div>
                    <p className="text-gym-gray-text">Paid</p>
                    <input
                      type="number"
                      className="w-full bg-gym-gray border border-gym-yellow/50 rounded text-center text-white font-bold text-sm"
                      value={newMember.paidAmount || ""}
                      onChange={(e) =>
                        setNewMember({ ...newMember, paidAmount: Number(e.target.value) || 0 })
                      }
                    />
                  </div>
                  <div>
                    <p className="text-gym-gray-text">Due</p>
                    <p className={`text-lg font-black ${balanceDue > 0 ? "text-red-500" : "text-green-500"}`}>
                      ${balanceDue}
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddMember}
                className="w-full bg-gym-yellow text-gym-black-dark font-black py-3 rounded-xl hover:bg-gym-yellow-bright transition-all"
              >
                Create Member
              </button>
            </form>
          </div>
        </div>

        {/* list/right */}
        <div className="lg:col-span-2">
          <div className="bg-gym-gray-dark border-2 border-gym-gray-border rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Members</h2>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gym-gray-text" />
                <input
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-gym-gray border border-gym-gray-border text-white text-sm focus:border-gym-yellow outline-none"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* filters */}
            <div className="mb-6 flex flex-wrap gap-4">
              {["all", "pt", "inactive", "expiring", "frozen"].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setMemberFilter(filter)}
                  className={`text-sm font-black uppercase px-4 py-2 rounded-lg transition-all ${
                    memberFilter === filter
                      ? "bg-gym-yellow text-gym-black-dark"
                      : "bg-gym-gray border border-gym-gray-border text-gym-gray-text hover:text-white"
                  }`}
                >
                  {filter === "all" && "All"}
                  {filter === "pt" && "PT"}
                  {filter === "inactive" && "Inactive"}
                  {filter === "expiring" && "Expiring"}
                  {filter === "frozen" && "Frozen"}
                </button>
              ))}
            </div>

            {/* members grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
              {filteredMembers.length > 0 ? (
                filteredMembers.map((member) => (
                  <div key={member._id} className="bg-gym-gray border-2 border-gym-gray-border rounded-xl p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-black text-white">{member.name}</h3>
                        <div className="flex items-center gap-2 text-gym-gray-text text-sm mt-1">
                          <Phone className="w-3 h-3" />
                          {member.phone}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleQuickAdd(member)}
                          className="w-8 h-8 rounded-full border border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white transition-all flex items-center justify-center"
                        >
                          <UserPlus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setInfoModal(member)
                            setInfoForm(member.info || { bloodType: "", address: "", reference: "", injury: "", note: "" })
                          }}
                          className="w-8 h-8 rounded-full border border-gym-yellow text-gym-yellow hover:bg-gym-yellow hover:text-gym-black transition-all flex items-center justify-center"
                        >
                          <Users className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(member)}
                          className="w-8 h-8 rounded-full border border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {member.memberships && member.memberships.length > 0 && (
                      <div className="mb-3">
                        <p className="text-[10px] font-black uppercase text-gym-gray-text mb-2">Memberships</p>
                        <div className="flex flex-wrap gap-2">
                          {member.memberships.map((mem, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                setMembershipDetails({
                                  ...mem,
                                  memberId: member._id,
                                  memberName: member.name,
                                  specificBalance: Number(mem.balance || 0),
                                  membershipId: mem._id,
                                  membershipTypeId: mem.membershipType?._id,
                                  category: mem.membershipType?.category || "N/A",
                                })
                                setEditDates({
                                  start: mem.startDate ? new Date(mem.startDate).toISOString().split("T")[0] : "",
                                  end: mem.endDate ? new Date(mem.endDate).toISOString().split("T")[0] : "",
                                })
                              }}
                              className={`px-2 py-1 text-xs font-black rounded border-2 cursor-pointer ${
                                mem.isFrozen
                                  ? "border-blue-500 text-blue-500"
                                  : mem.daysLeft <= 0
                                    ? "border-gray-500 text-gray-500"
                                    : mem.daysLeft <= 7
                                      ? "border-red-500 text-red-500"
                                      : "border-gym-yellow text-gym-yellow"
                              }`}
                            >
                              {mem.membershipType?.category || "Unknown"} — {mem.isFrozen ? "FROZEN" : `${mem.daysLeft}d`}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {member.personalTraining && member.personalTraining.some(pt => pt.sessionsLeft > 0) && (
                      <div className="mt-3 pt-3 border-t border-gym-gray-border/50">
                        <p className="text-[10px] font-black uppercase text-gym-gray-text mb-2">Personal Training</p>
                        <div className="space-y-2">
                        {member.personalTraining
                          .filter(pt => pt.sessionsLeft > 0 || (pt.balance && pt.balance > 0))
                          .map((pt, idx) => (
                            <div key={idx} className="bg-gym-black/40 p-2 rounded-lg border border-gym-gray-border/50 space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex flex-col">
                                  <span className="text-xs font-black text-white uppercase">{pt.coachName}</span>
                                  
                                  {pt.balance > 0 && (
                                    <span className="text-red-500 text-[9px] font-bold uppercase">
                                      Debt: ${pt.balance}
                                    </span>
                                  )}
                                  
                                  <span className={`text-[9px] font-bold ${pt.sessionsLeft <= 2 ? 'text-red-500' : 'text-gym-yellow'}`}>
                                    {pt.sessionsLeft} Sessions Left
                                  </span>
                                </div>
                                
                                <button 
                                  onClick={() => handleDecrement(member._id, pt.coachName)}
                                  className="px-2 py-1 rounded text-[9px] border border-red-500/30 text-red-500 font-black uppercase hover:bg-red-500 hover:text-white transition-all"
                                >
                                  -1
                                </button>
                              </div>

                              {pt.balance > 0 && (
                                <button 
                                  onClick={() => {
                                    setPaymentModal({ 
                                      isOpen: true, 
                                      member: member, 
                                      amount: pt.balance, // Sets the modal amount to only the PT debt
                                      membershipTypeId: null, 
                                      coachName: pt.coachName 
                                    });
                                  }}
                                  className="w-full py-1 rounded text-[9px] bg-gym-yellow/10 border border-gym-yellow/30 text-gym-yellow font-black uppercase hover:bg-gym-yellow hover:text-gym-black transition-all"
                                >
                                  Pay ${pt.balance} to {pt.coachName}
                                </button>
                              )}
                            </div>
                        ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-gym-gray-border/50">
                      <span className="text-[10px] font-black uppercase text-gym-gray-text">Balance</span>
                      <span className={`font-black ${member.balance > 0 ? "text-red-500" : "text-green-500"}`}>
                        {member.balance > 0 ? `-$${member.balance}` : "Paid"}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gym-gray-text py-8">No members found.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* payment modal */}
      {paymentModal.isOpen && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4">
          <div className="bg-gym-gray-dark border-2 border-gym-gray-border p-6 rounded-xl max-w-sm w-full">
            <h3 className="text-xl font-black text-white uppercase mb-4">Pay Balance</h3>
            <p className="text-gym-gray-text text-sm mb-4">
              Member: <span className="text-white">{paymentModal.member?.name}</span>
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-gym-gray-text block mb-1">Amount to Pay</label>
                <input
                  type="number"
                  value={paymentModal.amount}
                  onChange={(e) => setPaymentModal({ ...paymentModal, amount: e.target.value })}
                  className="w-full bg-gym-gray border border-gym-gray-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-gym-yellow"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleProcessPayment}
                  className="flex-1 bg-gym-yellow text-gym-black font-black py-2 rounded-lg uppercase hover:bg-white transition-all"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setPaymentModal({ isOpen: false, member: null, amount: "", membershipTypeId: null, coachName: null })}
                  className="flex-1 bg-gym-gray-border text-white font-black py-2 rounded-lg uppercase hover:bg-red-500 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
