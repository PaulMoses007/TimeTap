import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "../pages/Login/Login";
import Dashboard from "../pages/Dashboard/Dashboard";
import EmployeeList from "../pages/Employees/EmployeeList";
import Register from "../pages/Register/Register";
import EmployeeDashboard from "../pages/EmployeeDashboard/EmployeeDashboard";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route
          path="/dashboard"
          element={<Dashboard />}
        />

        <Route
          path="/employees"
          element={<EmployeeList />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/employee-dashboard"
          element={<EmployeeDashboard />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;