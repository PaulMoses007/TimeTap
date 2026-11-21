import api from "../api/axios";

export const checkIn = async (restaurantId) => {
  const response = await api.post(
    "/attendance/check-in",
    {
      restaurant_id: restaurantId,
    }
  );

  return response.data;
};

export const checkOut = async (restaurantId) => {
  const response = await api.post(
    "/attendance/check-out",
    {
      restaurant_id: restaurantId,
    }
  );

  return response.data;
};

export const getMyAttendance = async () => {
  const response = await api.get(
    "/attendance/my"
  );

  return response.data;
};

// Manager: correct a record or add a missing one. Times are Riga time.
export const editAttendance = async (attendanceId, data) => {
  const response = await api.put(
    `/attendance/${attendanceId}`,
    data
  );

  return response.data;
};

export const addAttendance = async (employeeId, data) => {
  const response = await api.post(
    `/attendance/for-employee/${employeeId}`,
    data
  );

  return response.data;
};

// Employee: hours this week / this month
export const getMySummary = async () => {
  const response = await api.get("/attendance/my-summary");

  return response.data;
};
