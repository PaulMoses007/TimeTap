import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "../pages/Login/Login";
import Dashboard from "../pages/Dashboard/Dashboard";
import EmployeeList from "../pages/Employees/EmployeeList";
import Register from "../pages/Register/Register";
import EmployeeDashboard from "../pages/EmployeeDashboard/EmployeeDashboard";
import EmployeeAttendance from "../pages/EmployeeAttendance/EmployeeAttendance";
import RestaurantManagement from "../pages/Restaurants/RestaurantManagement";
import ManagerAttendance from "../pages/ManagerAttendance/ManagerAttendance";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>

        {/* =========================
            LOGIN
        ========================== */}
        <Route
          path="/"
          element={<Login />}
        />

        {/* =========================
            MANAGER
        ========================== */}

        <Route
          path="/dashboard"
          element={<Dashboard />}
        />

        <Route
          path="/employees"
          element={<EmployeeList />}
        />

        <Route
          path="/manager-attendance"
          element={<ManagerAttendance />}
        />

        <Route
          path="/restaurants"
          element={<RestaurantManagement />}
        />

        <Route
          path="/reports"
          element={
            <div style={{ padding: "40px" }}>
              <h2>Reports</h2>
              <p>
                Reports page will be added next.
              </p>
            </div>
          }
        />

        <Route
          path="/settings"
          element={
            <div style={{ padding: "40px" }}>
              <h2>Settings</h2>
              <p>
                Settings page will be added later.
              </p>
            </div>
          }
        />

        {/* =========================
            EMPLOYEE REGISTRATION
        ========================== */}

        <Route
          path="/register"
          element={<Register />}
        />

        {/* =========================
            EMPLOYEE
        ========================== */}

        <Route
          path="/employee-dashboard"
          element={<EmployeeDashboard />}
        />

        <Route
          path="/employee-attendance"
          element={<EmployeeAttendance />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;