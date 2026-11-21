import api from "../api/axios";

// Employee
export const requestLeave = async (data) => {
  const response = await api.post("/leave/", data);
  return response.data;
};

export const getMyLeave = async () => {
  const response = await api.get("/leave/my");
  return response.data;
};

export const withdrawLeave = async (leaveId) => {
  const response = await api.delete(`/leave/${leaveId}`);
  return response.data;
};

// Manager (status = Pending | Approved | Rejected | undefined for all)
export const getLeaveRequests = async (status) => {
  const response = await api.get("/leave/", {
    params: status ? { status } : {},
  });
  return response.data;
};

export const approveLeave = async (leaveId, note) => {
  const response = await api.put(`/leave/${leaveId}/approve`, {
    note: note || null,
  });
  return response.data;
};

export const rejectLeave = async (leaveId, note) => {
  const response = await api.put(`/leave/${leaveId}/reject`, {
    note: note || null,
  });
  return response.data;
};
