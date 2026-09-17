import api from "../api/axios";

export const getEmployees = async () => {
  const response = await api.get("/employees/");
  return response.data;
};

export const createEmployee = async (employeeData) => {
  const response = await api.post("/employees/", employeeData);
  return response.data;
};

export const approveEmployee = async (employeeId) => {
  const response = await api.put(
    `/employees/${employeeId}/approve`
  );

  return response.data;
};

export const rejectEmployee = async (employeeId) => {
  const response = await api.put(
    `/employees/${employeeId}/reject`
  );

  return response.data;
};