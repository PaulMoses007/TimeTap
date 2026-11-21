import api from "../api/axios";

export const getDashboard = async () => {
  const response = await api.get("/dashboard/");
  return response.data;
};

export const getAlerts = async () => {
  const response = await api.get("/dashboard/alerts");
  return response.data;
};
