import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

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
import Reports from "../pages/Reports/Reports";
import Settings from "../pages/Settings/Settings";


function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ==========================================
            LOGIN
        ========================================== */}

        <Route
          path="/"
          element={<Login />}
        />


        {/* ==========================================
            MANAGER REGISTRATION
        ========================================== */}

        <Route
          path="/register-manager"
          element={<RegisterManager />}
        />


        {/* ==========================================
            MANAGER DASHBOARD
        ========================================== */}

        <Route
          path="/dashboard"
          element={<Dashboard />}
        />


        {/* ==========================================
            EMPLOYEES
        ========================================== */}

        <Route
          path="/employees"
          element={<EmployeeList />}
        />


        {/* ==========================================
            MANAGER ATTENDANCE
        ========================================== */}

        <Route
          path="/manager-attendance"
          element={<ManagerAttendance />}
        />


        {/* ==========================================
            RESTAURANTS
        ========================================== */}

        <Route
          path="/restaurants"
          element={<RestaurantManagement />}
        />


        {/* ==========================================
            REPORTS
        ========================================== */}

        <Route
          path="/reports"
          element={<Reports />}
        />


        {/* ==========================================
            SETTINGS
        ========================================== */}

        <Route
          path="/settings"
          element={<Settings />}
        />


        {/* ==========================================
            EMPLOYEE REGISTRATION
        ========================================== */}

        <Route
          path="/register"
          element={<Register />}
        />


        {/* ==========================================
            EMPLOYEE DASHBOARD
        ========================================== */}

        <Route
          path="/employee-dashboard"
          element={<EmployeeDashboard />}
        />


        {/* ==========================================
            EMPLOYEE ATTENDANCE
        ========================================== */}

        <Route
          path="/employee-attendance"
          element={<EmployeeAttendance />}
        />


        {/* ==========================================
            EMPLOYEE PROFILE
        ========================================== */}

        <Route
          path="/employee-profile"
          element={<EmployeeProfile />}
        />

      </Routes>
    </BrowserRouter>
  );
}


export default AppRoutes;