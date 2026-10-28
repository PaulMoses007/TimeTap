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