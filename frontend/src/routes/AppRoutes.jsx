import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "../pages/Login/Login";
import Dashboard from "../pages/Dashboard/Dashboard";
import EmployeeList from "../pages/Employees/EmployeeList";
import Register from "../pages/Register/Register";
import EmployeeDashboard from "../pages/EmployeeDashboard/EmployeeDashboard";
import EmployeeAttendance from "../pages/EmployeeAttendance/EmployeeAttendance";
import RestaurantManagement from "../pages/Restaurants/RestaurantManagement";

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

        {/* Manager Dashboard */}
        <Route
          path="/dashboard"
          element={<Dashboard />}
        />

        {/* Manager - Employees */}
        <Route
          path="/employees"
          element={<EmployeeList />}
        />

        {/* Manager - Restaurants */}
        <Route
          path="/restaurants"
          element={<RestaurantManagement />}
        />

        {/* Manager - Attendance */}
        <Route
          path="/manager-attendance"
          element={
            <div style={{ padding: "40px" }}>
              <h2>Manager Attendance</h2>
              <p>
                Manager attendance page will be
                added next.
              </p>
            </div>
          }
        />

        {/* Manager - Reports */}
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

        {/* Manager - Settings */}
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

        {/* Employee Dashboard */}
        <Route
          path="/employee-dashboard"
          element={<EmployeeDashboard />}
        />

        {/* Employee Attendance History */}
        <Route
          path="/employee-attendance"
          element={<EmployeeAttendance />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;