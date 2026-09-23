import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import AssessmentIcon from "@mui/icons-material/Assessment";
import SettingsIcon from "@mui/icons-material/Settings";
import RefreshIcon from "@mui/icons-material/Refresh";
import LogoutIcon from "@mui/icons-material/Logout";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import ScheduleIcon from "@mui/icons-material/Schedule";
import WarningIcon from "@mui/icons-material/Warning";
import AccessAlarmIcon from "@mui/icons-material/AccessAlarm";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

import api from "../../api/axios";


function Reports() {
  const navigate = useNavigate();

  const [analytics, setAnalytics] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [workforceInsights, setWorkforceInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  // ============================================================
  // LOAD ANALYTICS
  // ============================================================

  const loadAnalytics = async () => {
    setLoading(true);
    setError("");

    try {
      const [
        analyticsResponse,
        trendResponse,
        workforceResponse,
      ] = await Promise.all([
        api.get("/analytics/attendance"),
        api.get("/analytics/attendance-trend"),
        api.get("/analytics/workforce-insights"),
      ]);

      setAnalytics(analyticsResponse.data);
      setTrendData(trendResponse.data);
      setWorkforceInsights(workforceResponse.data);

    } catch (err) {
      console.error(err);

      if (err.response?.status === 401) {
        localStorage.removeItem("access_token");
        navigate("/");
        return;
      }

      if (err.response?.status === 403) {
        setError(
          "You do not have permission to view reports."
        );
        return;
      }

      setError(
        err.response?.data?.detail ||
          "Failed to load analytics."
      );

    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadAnalytics();
  }, []);


  // ============================================================
  // LOGOUT
  // ============================================================

  const logout = () => {
    localStorage.removeItem("access_token");
    navigate("/");
  };


  // ============================================================
  // SIDEBAR
  // ============================================================

  const menuItems = [
    {
      text: "Dashboard",
      icon: <DashboardIcon />,
      path: "/dashboard",
    },
    {
      text: "Employees",
      icon: <PeopleIcon />,
      path: "/employees",
    },
    {
      text: "Attendance",
      icon: <AccessTimeIcon />,
      path: "/manager-attendance",
    },
    {
      text: "Restaurants",
      icon: <RestaurantIcon />,
      path: "/restaurants",
    },
    {
      text: "Reports",
      icon: <AssessmentIcon />,
      path: "/reports",
      active: true,
    },
    {
      text: "Settings",
      icon: <SettingsIcon />,
      path: "/settings",
    },
  ];


  // ============================================================
  // HELPER FUNCTIONS
  // ============================================================

  const formatSchedule = (employee) => {
    if (employee.schedule_type === "Fixed") {
      if (
        employee.shift_start &&
        employee.shift_end
      ) {
        return `${employee.shift_start} - ${employee.shift_end}`;
      }

      return "Fixed";
    }

    return "Flexible";
  };


  const getScheduleColor = (scheduleType) => {
    if (scheduleType === "Fixed") {
      return "primary";
    }

    return "info";
  };


  const formatTime = (time) => {
    if (!time) {
      return "—";
    }

    return time;
  };


  const getLateColor = (lateArrivals) => {
    if (!lateArrivals) {
      return "success";
    }

    return "warning";
  };

  const getWorkforceInsightSeverity = (severity) => {
  if (severity === "warning") {
    return "warning";
  }

  if (severity === "error") {
    return "error";
  }

  if (severity === "success") {
    return "success";
  }

  return "info";
};


  // ============================================================
  // ADAPTIVE INSIGHT GENERATION
  // ============================================================

  const getAdaptiveInsights = () => {
    if (
      !analytics ||
      !analytics.employees ||
      analytics.employees.length === 0
    ) {
      return [];
    }

    const insights = [];


    // ----------------------------------------------------------
    // Overall attendance
    // ----------------------------------------------------------

    if (
      analytics.average_attendance_rate >= 90
    ) {
      insights.push(
        `The current employee attendance rate is ${analytics.average_attendance_rate}%.`
      );
    } else {
      insights.push(
        `The current employee attendance rate is ${analytics.average_attendance_rate}%, based on the available attendance history.`
      );
    }


    // ----------------------------------------------------------
    // Fixed schedule employees
    // ----------------------------------------------------------

    const fixedEmployees =
      analytics.employees.filter(
        (employee) =>
          employee.schedule_type === "Fixed"
      );


    fixedEmployees.forEach((employee) => {
      if (employee.late_arrivals > 0) {
        insights.push(
          `${employee.first_name} ${employee.last_name} has ${employee.late_arrivals} late arrival${employee.late_arrivals > 1 ? "s" : ""} in the analysis period, with an average lateness of ${employee.average_late_minutes} minutes.`
        );
      } else {
        insights.push(
          `${employee.first_name} ${employee.last_name} has no recorded late arrivals in the current analysis period.`
        );
      }
    });


    // ----------------------------------------------------------
    // Flexible schedule employees
    // ----------------------------------------------------------

    const flexibleEmployees =
      analytics.employees.filter(
        (employee) =>
          employee.schedule_type === "Flexible"
      );


    flexibleEmployees.forEach((employee) => {
      if (employee.average_check_in) {
        insights.push(
          `${employee.first_name} ${employee.last_name} has an observed average check-in time of ${employee.average_check_in} based on recorded attendance.`
        );
      }

      if (employee.average_shift_hours > 0) {
        insights.push(
          `The average completed shift for ${employee.first_name} ${employee.last_name} is ${employee.average_shift_hours} hours.`
        );
      }
    });


    // ----------------------------------------------------------
    // Low attendance
    // ----------------------------------------------------------

    if (
      analytics.employees_with_low_attendance > 0
    ) {
      insights.push(
        `${analytics.employees_with_low_attendance} employee${analytics.employees_with_low_attendance > 1 ? "s have" : " has"} an attendance rate below the current analysis threshold.`
      );
    } else {
      insights.push(
        "No employees are currently below the configured low-attendance threshold."
      );
    }


    return insights;
  };


  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }


  // ============================================================
  // PAGE
  // ============================================================

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "#f5f7fa",
      }}
    >

      {/* ====================================================== */}
      {/* SIDEBAR */}
      {/* ====================================================== */}

      <Box
        sx={{
          width: 250,
          backgroundColor: "#ffffff",
          borderRight: "1px solid #e0e0e0",
          display: "flex",
          flexDirection: "column",
        }}
      >

        <Box
          sx={{
            padding: 3,
            borderBottom: "1px solid #e0e0e0",
          }}
        >
          <Typography
            variant="h5"
            fontWeight="bold"
            color="primary"
          >
            TimeTap
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
          >
            Manager Panel
          </Typography>
        </Box>


        <Box
          sx={{
            padding: 2,
            flexGrow: 1,
          }}
        >

          {menuItems.map((item) => (
            <Button
              key={item.text}
              fullWidth
              startIcon={item.icon}
              onClick={() => navigate(item.path)}
              sx={{
                justifyContent: "flex-start",
                padding: "12px 16px",
                marginBottom: 1,
                borderRadius: 2,

                color: item.active
                  ? "primary.main"
                  : "text.secondary",

                backgroundColor: item.active
                  ? "rgba(25, 118, 210, 0.08)"
                  : "transparent",

                fontWeight: item.active
                  ? "bold"
                  : "normal",

                "&:hover": {
                  backgroundColor:
                    "rgba(25, 118, 210, 0.08)",
                },
              }}
            >
              {item.text}
            </Button>
          ))}

        </Box>


        <Box sx={{ padding: 2 }}>

          <Button
            fullWidth
            startIcon={<LogoutIcon />}
            onClick={logout}
            sx={{
              justifyContent: "flex-start",
              padding: "12px 16px",
              color: "error.main",
            }}
          >
            Logout
          </Button>

        </Box>

      </Box>


      {/* ====================================================== */}
      {/* MAIN CONTENT */}
      {/* ====================================================== */}

      <Box
        sx={{
          flexGrow: 1,
          padding: 4,
          overflow: "auto",
        }}
      >

        {/* ==================================================== */}
        {/* HEADER */}
        {/* ==================================================== */}

        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={4}
        >

          <Box>

            <Typography
              variant="h4"
              fontWeight="bold"
            >
              Reports & Analytics
            </Typography>

            <Typography
              color="text.secondary"
              sx={{ mt: 1 }}
            >
              Adaptive attendance analysis for the
              last 30 days
            </Typography>

          </Box>


          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadAnalytics}
          >
            Refresh
          </Button>

        </Box>


        {/* ==================================================== */}
        {/* ERROR */}
        {/* ==================================================== */}

        {error && (
          <Alert
            severity="error"
            sx={{ mb: 3 }}
          >
            {error}
          </Alert>
        )}


        {analytics && (
          <>

            {/* ================================================= */}
            {/* SUMMARY CARDS */}
            {/* ================================================= */}

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 3,
                mb: 4,
              }}
            >

              {/* Active Employees */}

              <Card>
                <CardContent>

                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                  >

                    <Box>

                      <Typography
                        color="text.secondary"
                        variant="body2"
                      >
                        Active Employees
                      </Typography>

                      <Typography
                        variant="h4"
                        fontWeight="bold"
                        sx={{ mt: 1 }}
                      >
                        {analytics.total_employees}
                      </Typography>

                    </Box>

                    <PeopleIcon
                      color="primary"
                      sx={{ fontSize: 40 }}
                    />

                  </Box>

                </CardContent>
              </Card>


              {/* Attendance Records */}

              <Card>
                <CardContent>

                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                  >

                    <Box>

                      <Typography
                        color="text.secondary"
                        variant="body2"
                      >
                        Attendance Records
                      </Typography>

                      <Typography
                        variant="h4"
                        fontWeight="bold"
                        sx={{ mt: 1 }}
                      >
                        {analytics.total_attendance_records}
                      </Typography>

                    </Box>

                    <AccessTimeIcon
                      color="primary"
                      sx={{ fontSize: 40 }}
                    />

                  </Box>

                </CardContent>
              </Card>


              {/* Total Worked Hours */}

              <Card>
                <CardContent>

                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                  >

                    <Box>

                      <Typography
                        color="text.secondary"
                        variant="body2"
                      >
                        Total Worked Hours
                      </Typography>

                      <Typography
                        variant="h4"
                        fontWeight="bold"
                        sx={{ mt: 1 }}
                      >
                        {analytics.total_worked_hours}
                      </Typography>

                    </Box>

                    <ScheduleIcon
                      color="primary"
                      sx={{ fontSize: 40 }}
                    />

                  </Box>

                </CardContent>
              </Card>


              {/* Average Attendance */}

              <Card>
                <CardContent>

                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                  >

                    <Box>

                      <Typography
                        color="text.secondary"
                        variant="body2"
                      >
                        Average Attendance
                      </Typography>

                      <Typography
                        variant="h4"
                        fontWeight="bold"
                        sx={{ mt: 1 }}
                      >
                        {analytics.average_attendance_rate}%
                      </Typography>

                    </Box>

                    <TrendingUpIcon
                      color="primary"
                      sx={{ fontSize: 40 }}
                    />

                  </Box>

                </CardContent>
              </Card>

            </Box>


            {/* ================================================= */}
            {/* SECONDARY SUMMARY */}
            {/* ================================================= */}

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(250px, 1fr))",
                gap: 3,
                mb: 4,
              }}
            >

              {/* Employees With Attendance */}

              <Paper sx={{ p: 3 }}>

                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                >

                  <Box>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      Employees With Attendance
                    </Typography>

                    <Typography
                      variant="h5"
                      fontWeight="bold"
                      sx={{ mt: 1 }}
                    >
                      {analytics.employees_with_attendance}
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 1 }}
                    >
                      Employees who have at least
                      one attendance record.
                    </Typography>

                  </Box>

                  <EventAvailableIcon
                    color="primary"
                    sx={{ fontSize: 38 }}
                  />

                </Box>

              </Paper>


              {/* Average Shift */}

              <Paper sx={{ p: 3 }}>

                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                >

                  <Box>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      Average Shift
                    </Typography>

                    <Typography
                      variant="h5"
                      fontWeight="bold"
                      sx={{ mt: 1 }}
                    >
                      {analytics.average_shift_hours} hours
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 1 }}
                    >
                      Average completed shift duration.
                    </Typography>

                  </Box>

                  <ScheduleIcon
                    color="primary"
                    sx={{ fontSize: 38 }}
                  />

                </Box>

              </Paper>


              {/* Low Attendance */}

              <Paper sx={{ p: 3 }}>

                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                >

                  <Box>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      Low Attendance
                    </Typography>

                    <Typography
                      variant="h5"
                      fontWeight="bold"
                      sx={{ mt: 1 }}
                    >
                      {analytics.employees_with_low_attendance}
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 1 }}
                    >
                      Employees below the current
                      analysis threshold.
                    </Typography>

                  </Box>

                  <WarningIcon
                    color={
                      analytics.employees_with_low_attendance > 0
                        ? "warning"
                        : "success"
                    }
                    sx={{ fontSize: 38 }}
                  />

                </Box>

              </Paper>

            </Box>


            {/* ================================================= */}
            {/* ATTENDANCE TRENDS */}
            {/* ================================================= */}

            <Paper
              sx={{
                p: 3,
                mb: 4,
              }}
            >

              <Box
                display="flex"
                alignItems="center"
                gap={1}
                mb={1}
              >

                <TrendingUpIcon color="primary" />

                <Typography
                  variant="h6"
                  fontWeight="bold"
                >
                  Attendance Trends
                </Typography>

              </Box>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 3 }}
              >
                Daily attendance activity processed from
                the last 30 days of recorded data.
              </Typography>

              <Divider sx={{ mb: 3 }} />


              {/* --------------------------------------------- */}
              {/* DAILY ATTENDANCE AND LATE ARRIVALS */}
              {/* --------------------------------------------- */}

              <Typography
                variant="subtitle1"
                fontWeight="bold"
                sx={{ mb: 2 }}
              >
                Daily Attendance & Late Arrivals
              </Typography>

              {trendData.length > 0 ? (

                <Box
                  sx={{
                    width: "100%",
                    height: 350,
                  }}
                >

                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >

                    <LineChart
                      data={trendData}
                      margin={{
                        top: 10,
                        right: 30,
                        left: 10,
                        bottom: 10,
                      }}
                    >

                      <CartesianGrid
                        strokeDasharray="3 3"
                      />

                      <XAxis
                        dataKey="date"
                        tickFormatter={(value) =>
                          value.slice(5)
                        }
                      />

                      <YAxis
                        allowDecimals={false}
                      />

                      <Tooltip />

                      <Legend />

                      <Line
                        type="monotone"
                        dataKey="attendance_count"
                        name="Attendance"
                        stroke="#1976d2"
                        strokeWidth={3}
                        dot={{ r: 3 }}
                        activeDot={{ r: 6 }}
                      />

                      <Line
                        type="monotone"
                        dataKey="late_arrivals"
                        name="Late Arrivals"
                        stroke="#ed6c02"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />

                    </LineChart>

                  </ResponsiveContainer>

                </Box>

              ) : (

                <Alert severity="info">
                  No attendance trend data is available
                  for the current analysis period.
                </Alert>

              )}


              {/* --------------------------------------------- */}
              {/* DAILY WORKED HOURS */}
              {/* --------------------------------------------- */}

              <Typography
                variant="subtitle1"
                fontWeight="bold"
                sx={{
                  mt: 5,
                  mb: 2,
                }}
              >
                Daily Worked Hours
              </Typography>

              {trendData.length > 0 ? (

                <Box
                  sx={{
                    width: "100%",
                    height: 350,
                  }}
                >

                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >

                    <BarChart
                      data={trendData}
                      margin={{
                        top: 10,
                        right: 30,
                        left: 10,
                        bottom: 10,
                      }}
                    >

                      <CartesianGrid
                        strokeDasharray="3 3"
                      />

                      <XAxis
                        dataKey="date"
                        tickFormatter={(value) =>
                          value.slice(5)
                        }
                      />

                      <YAxis />

                      <Tooltip />

                      <Legend />

                      <Bar
                        dataKey="total_worked_hours"
                        name="Worked Hours"
                        fill="#1976d2"
                      />

                    </BarChart>

                  </ResponsiveContainer>

                </Box>

              ) : (

                <Alert severity="info">
                  No worked-hour data is available.
                </Alert>

              )}

            </Paper>


            {/* ================================================= */}
            {/* ADAPTIVE INSIGHTS */}
            {/* ================================================= */}

            <Paper
              sx={{
                p: 3,
                mb: 4,
              }}
            >

              <Box
                display="flex"
                alignItems="center"
                gap={1}
                mb={2}
              >

                <TrendingUpIcon color="primary" />

                <Typography
                  variant="h6"
                  fontWeight="bold"
                >
                  Adaptive Insights
                </Typography>

              </Box>

              <Divider sx={{ mb: 2 }} />


              {analytics.total_attendance_records === 0 ? (

                <Alert severity="info">
                  No attendance records are available
                  for the current analysis period.
                </Alert>

              ) : (

                <Box>

                  {getAdaptiveInsights().map(
                    (insight, index) => (
                      <Alert
                        key={index}
                        severity={
                          insight.includes(
                            "late arrival"
                          )
                            ? "warning"
                            : "info"
                        }
                        sx={{ mb: 1 }}
                      >
                        {insight}
                      </Alert>
                    )
                  )}

                </Box>

              )}

            </Paper>

{/* ================================================= */}
{/* WORKFORCE ADAPTIVE INSIGHTS */}
{/* ================================================= */}

<Paper
  sx={{
    p: 3,
    mb: 4,
  }}
>
  <Box
    display="flex"
    alignItems="center"
    gap={1}
    mb={2}
  >
    <TrendingUpIcon color="primary" />

    <Box>
      <Typography
        variant="h6"
        fontWeight="bold"
      >
        Workforce Adaptive Insights
      </Typography>

      <Typography
        variant="body2"
        color="text.secondary"
      >
        Backend analysis of recent workforce activity
        and historical data.
      </Typography>
    </Box>
  </Box>

  <Divider sx={{ mb: 2 }} />

  {workforceInsights.length === 0 ? (
    <Alert severity="info">
      No workforce adaptive insights are available
      for the current analysis period.
    </Alert>
  ) : (
    <Box>
      {workforceInsights.map((insight, index) => (
<Alert
  key={`${insight.insight_type}-${index}`}
  severity={getWorkforceInsightSeverity(
    insight.severity
  )}
  sx={{ mb: 1 }}
>
  <Box
    display="flex"
    alignItems="center"
    justifyContent="space-between"
    width="100%"
    gap={2}
  >
    <Box>
      <Typography
        component="div"
        fontWeight="bold"
      >
        {insight.title}
      </Typography>

      <Typography
        component="div"
        variant="body2"
      >
        {insight.message}
      </Typography>
    </Box>

    <Typography
      variant="h6"
      fontWeight="bold"
      sx={{ whiteSpace: "nowrap" }}
    >
      {insight.metric}
    </Typography>
  </Box>
</Alert>
      ))}
    </Box>
  )}
</Paper>
            {/* ================================================= */}
            {/* EMPLOYEE ANALYTICS */}
            {/* ================================================= */}

            <Paper
              sx={{
                p: 3,
                mb: 4,
              }}
            >

              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={3}
              >

                <Box>

                  <Typography
                    variant="h6"
                    fontWeight="bold"
                  >
                    Employee Analytics
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 0.5 }}
                  >
                    Individual attendance patterns
                    and schedule analysis
                  </Typography>

                </Box>

                <Chip
                  icon={<TrendingUpIcon />}
                  label="Adaptive Analysis"
                  color="primary"
                  variant="outlined"
                />

              </Box>


              <TableContainer
                sx={{
                  overflowX: "auto",
                }}
              >

                <Table
                  size="small"
                  sx={{
                    minWidth: 1250,
                  }}
                >

                  <TableHead>

                    <TableRow>

                      <TableCell>
                        <strong>Employee</strong>
                      </TableCell>

                      <TableCell>
                        <strong>ID</strong>
                      </TableCell>

                      <TableCell>
                        <strong>Restaurant</strong>
                      </TableCell>

                      <TableCell>
                        <strong>Role</strong>
                      </TableCell>

                      <TableCell>
                        <strong>Schedule</strong>
                      </TableCell>

                      <TableCell>
                        <strong>Scheduled Time</strong>
                      </TableCell>

                      <TableCell>
                        <strong>Avg Check-in</strong>
                      </TableCell>

                      <TableCell>
                        <strong>Avg Check-out</strong>
                      </TableCell>

                      <TableCell align="center">
                        <strong>Late Arrivals</strong>
                      </TableCell>

                      <TableCell align="center">
                        <strong>Avg Late</strong>
                      </TableCell>

                      <TableCell align="center">
                        <strong>Days Present</strong>
                      </TableCell>

                      <TableCell align="center">
                        <strong>Worked Hours</strong>
                      </TableCell>

                      <TableCell align="center">
                        <strong>Attendance</strong>
                      </TableCell>

                    </TableRow>

                  </TableHead>


                  <TableBody>

                    {analytics.employees &&
                      analytics.employees.map(
                        (employee) => (

                          <TableRow
                            key={employee.employee_id}
                            hover
                          >

                            {/* Employee */}

                            <TableCell>

                              <Typography
                                fontWeight="bold"
                              >
                                {employee.first_name}{" "}
                                {employee.last_name}
                              </Typography>

                            </TableCell>


                            {/* ID */}

                            <TableCell>
                              {employee.employee_id}
                            </TableCell>


                            {/* Restaurant */}

                            <TableCell>
                              {employee.restaurant}
                            </TableCell>


                            {/* Role */}

                            <TableCell>
                              {employee.role}
                            </TableCell>


                            {/* Schedule Type */}

                            <TableCell>

                              <Chip
                                label={
                                  employee.schedule_type ||
                                  "Flexible"
                                }
                                color={getScheduleColor(
                                  employee.schedule_type
                                )}
                                size="small"
                              />

                            </TableCell>


                            {/* Scheduled Time */}

                            <TableCell>

                              {employee.schedule_type ===
                              "Fixed"
                                ? formatSchedule(employee)
                                : "—"}

                            </TableCell>


                            {/* Average Check In */}

                            <TableCell>

                              <Box
                                display="flex"
                                alignItems="center"
                                gap={0.5}
                              >

                                <AccessAlarmIcon
                                  sx={{
                                    fontSize: 18,
                                  }}
                                  color="action"
                                />

                                {formatTime(
                                  employee.average_check_in
                                )}

                              </Box>

                            </TableCell>


                            {/* Average Check Out */}

                            <TableCell>

                              {formatTime(
                                employee.average_check_out
                              )}

                            </TableCell>


                            {/* Late Arrivals */}

                            <TableCell align="center">

                              {employee.schedule_type ===
                              "Fixed" ? (

                                <Chip
                                  label={
                                    employee.late_arrivals || 0
                                  }
                                  color={getLateColor(
                                    employee.late_arrivals
                                  )}
                                  size="small"
                                />

                              ) : (
                                "—"
                              )}

                            </TableCell>


                            {/* Average Late Minutes */}

                            <TableCell align="center">

                              {employee.schedule_type ===
                              "Fixed" ? (

                                employee.average_late_minutes >
                                0 ? (

                                  <Typography
                                    fontWeight="bold"
                                    color="warning.main"
                                  >
                                    {
                                      employee.average_late_minutes
                                    }{" "}
                                    min
                                  </Typography>

                                ) : (

                                  <Typography
                                    color="success.main"
                                  >
                                    0 min
                                  </Typography>

                                )

                              ) : (
                                "—"
                              )}

                            </TableCell>


                            {/* Days Present */}

                            <TableCell align="center">

                              {employee.days_present}

                            </TableCell>


                            {/* Worked Hours */}

                            <TableCell align="center">

                              {employee.total_worked_hours}

                            </TableCell>


                            {/* Attendance Rate */}

                            <TableCell align="center">

                              <Chip
                                label={`${employee.attendance_rate}%`}
                                color={
                                  employee.attendance_rate >= 75
                                    ? "success"
                                    : employee.attendance_rate >= 50
                                    ? "warning"
                                    : "error"
                                }
                                size="small"
                              />

                            </TableCell>

                          </TableRow>

                        )
                      )}

                  </TableBody>

                </Table>

              </TableContainer>

            </Paper>


            {/* ================================================= */}
            {/* DATA PROCESSING INFORMATION */}
            {/* ================================================= */}

            <Alert
              severity="info"
              icon={<WarningIcon />}
              sx={{ mt: 3 }}
            >

              TimeTap processes recorded attendance
              history to calculate working time,
              attendance rates, employee schedules,
              check-in patterns and fixed-schedule
              lateness indicators.

            </Alert>

          </>
        )}

      </Box>

    </Box>
  );
}


export default Reports;