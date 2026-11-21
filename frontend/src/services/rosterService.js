import api from "../api/axios";

// Manager: one planned week (Monday-Sunday)
export const getRosterWeek = async (weekStart) => {
  const response = await api.get("/roster/", {
    params: weekStart ? { week_start: weekStart } : {},
  });
  return response.data;
};

export const setShift = async (shift) => {
  const response = await api.put("/roster/shift", shift);
  return response.data;
};

export const deleteShift = async (shiftId) => {
  const response = await api.delete(`/roster/shift/${shiftId}`);
  return response.data;
};

export const copyWeek = async (fromWeekStart, toWeekStart) => {
  const response = await api.post("/roster/copy-week", {
    from_week_start: fromWeekStart,
    to_week_start: toWeekStart,
  });
  return response.data;
};

// Employee: my upcoming shifts
export const getMyShifts = async (days = 14) => {
  const response = await api.get("/roster/my", { params: { days } });
  return response.data;
};
