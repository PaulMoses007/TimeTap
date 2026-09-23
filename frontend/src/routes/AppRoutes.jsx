import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import Login from "../pages/Login/Login";
import Dashboard from "../pages/Dashboard/Dashboard";
import EmployeeList from "../pages/Employees/EmployeeList";
import Register from "../pages/Register/Register";
import EmployeeDashboard from "../pages/EmployeeDashboard/EmployeeDashboard";
import EmployeeAttendance from "../pages/EmployeeAttendance/EmployeeAttendance";
import RestaurantManagement from "../pages/Restaurants/RestaurantManagement";
import ManagerAttendance from "../pages/ManagerAttendance/ManagerAttendance";
import Reports from "../pages/Reports/Reports";


function AppRoutes() {
  return (
    <BrowserRouter>

      <Routes>

        {/* Login */}

        <Route
          path="/"
          element={<Login />}
        />


        {/* Manager Dashboard */}

        <Route
          path="/dashboard"
          element={<Dashboard />}
        />


        {/* Employees */}

        <Route
          path="/employees"
          element={<EmployeeList />}
        />


        {/* Manager Attendance */}

        <Route
          path="/manager-attendance"
          element={<ManagerAttendance />}
        />


        {/* Restaurants */}

        <Route
          path="/restaurants"
          element={<RestaurantManagement />}
        />


        {/* Reports */}

        <Route
          path="/reports"
          element={<Reports />}
        />


        {/* Settings */}

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


        {/* Employee Registration */}

        <Route
          path="/register"
          element={<Register />}
        />


        {/* Employee Dashboard */}

        <Route
          path="/employee-dashboard"
          element={<EmployeeDashboard />}
        />


        {/* Employee Attendance */}

        <Route
          path="/employee-attendance"
          element={<EmployeeAttendance />}
        />

      </Routes>

    </BrowserRouter>
  );
}


export default AppRoutes;