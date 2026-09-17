import api from "../api/axios";

export const registerEmployee = async (employeeData) => {
  const response = await api.post("/register/", employeeData);
  return response.data;
};