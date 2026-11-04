import api from "../api/axios";

// Manager: list requests (status = Pending | Approved | Rejected | undefined for all)
export const getManualRequests = async (status) => {
  const response = await api.get("/attendance/manual-requests/", {
    params: status ? { status } : {},
  });

  return response.data;
};

export const approveManualRequest = async (requestId, note) => {
  const response = await api.put(
    `/attendance/manual-requests/${requestId}/approve`,
    { note: note || null }
  );

  return response.data;
};

export const rejectManualRequest = async (requestId, note) => {
  const response = await api.put(
    `/attendance/manual-requests/${requestId}/reject`,
    { note: note || null }
  );

  return response.data;
};
