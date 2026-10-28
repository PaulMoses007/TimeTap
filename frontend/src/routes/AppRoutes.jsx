import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "../pages/Login/Login";
import Dashboard from "../pages/Dashboard/Dashboard";
import EmployeeList from "../pages/Employees/EmployeeList";
import Register from "../pages/Register/Register";
import RegisterManager from "../pages/RegisterManager/RegisterManager";
import EmployeeDashboard from "../pages/EmployeeDashboard/EmployeeDashboard";
import EmployeeAttendance from "../pages/EmployeeAttendance/EmployeeAttendance";
import EmployeeProfile from "../pages/EmployeeProfile/EmployeeProfile";
import RestaurantManagement from "../pages/Restaurants/RestaurantManagement";
import ManagerAttendance from "../pages/ManagerAttendance/ManagerAttendance";
import ManagerProfile from "../pages/ManagerProfile/ManagerProfile";
import Reports from "../pages/Reports/Reports";
import Settings from "../pages/Settings/Settings";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Login */}
        <Route path="/" element={<Login />} />

        {/* Manager Registration */}
        <Route path="/register-manager" element={<RegisterManager />} />

        {/* Manager Dashboard */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Manager Employees */}
        <Route path="/employees" element={<EmployeeList />} />

        {/* Manager Attendance */}
        <Route path="/manager-attendance" element={<ManagerAttendance />} />

        {/* Manager Profile */}
        <Route path="/manager-profile" element={<ManagerProfile />} />

        {/* Restaurants */}
        <Route path="/restaurants" element={<RestaurantManagement />} />

        {/* Reports */}
        <Route path="/reports" element={<Reports />} />

        {/* Settings */}
        <Route path="/settings" element={<Settings />} />

        {/* Employee Registration */}
        <Route path="/register" element={<Register />} />

        {/* Employee Dashboard */}
        <Route path="/employee-dashboard" element={<EmployeeDashboard />} />

        {/* Employee Attendance */}
        <Route path="/employee-attendance" element={<EmployeeAttendance />} />

        {/* Employee Profile */}
        <Route path="/employee-profile" element={<EmployeeProfile />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;