import api from "../api/axios";

export const getRestaurants = async () => {
  const response = await api.get("/restaurants/");
  return response.data;
};
export const deleteRestaurant = async (restaurantId) => {
  const response = await api.delete(
    `/restaurants/${restaurantId}`
  );

  return response.data;
};
