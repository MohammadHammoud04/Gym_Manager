import axios from "axios";

const API = axios.create({
    baseURL : "http://localhost:5000",
});

export const getMembers = () => API.get("/members");
export const getMemberPayments = (id) =>API.get(`/members/${id}/payments`);
export const adMember = (data) => API.post("/members",data);
export const renewMembership = (id,data) => API.post(`/members/${id}/renew`, data);

export const getMembershipTypes = () => API.get("/membership-types");
export const addMembershipType = (data) =>API.post("/membership-types",data);
export const updateMembershipType = (id,data) => API.put(`/membership-types/${id}`, data);
export const deleteMembershipType = (id) => API.delete(`/membership-types/${id}`)