import api from "../api/axios";

export const login = async (email, password) => {
  const response = await api.post("/auth/login", {
    email,
    password,
  });

  return response.data;
};

export const logout = () => {
  localStorage.removeItem("access_token");
};

export const getToken = () => {
  return localStorage.getItem("access_token");
};

export const isAuthenticated = () => {
  return !!localStorage.getItem("access_token");
};