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
import ErrorIcon from "@mui/icons-material/Error";
import InfoIcon from "@mui/icons-material/Info";

import api from "../../api/axios";


function Reports() {
  const navigate = useNavigate();

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  // ============================================================
  // LOAD ANALYTICS
  // ============================================================

  const loadAnalytics = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get(
        "/analytics/attendance"
      );

      setAnalytics(response.data);

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


  const getAlertSeverity = (severity) => {
    if (severity === "error") {
      return "error";
    }

    if (severity === "warning") {
      return "warning";
    }

    if (severity === "success") {
      return "success";
    }

    return "info";
  };


  const getAlertIcon = (severity) => {
    if (severity === "error") {
      return <ErrorIcon />;
    }

    if (severity === "warning") {
      return <WarningIcon />;
    }

    return <InfoIcon />;
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

      {/* ======================================================
          SIDEBAR
      ====================================================== */}

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


      {/* ======================================================
          MAIN CONTENT
      ====================================================== */}

      <Box
        sx={{
          flexGrow: 1,
          padding: 4,
          overflow: "auto",
        }}
      >

        {/* ====================================================
            HEADER
        ==================================================== */}

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


        {/* ====================================================
            ERROR
        ==================================================== */}

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

            {/* =================================================
                SUMMARY CARDS
            ================================================= */}

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


              {/* Adaptive Alerts */}

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
                        Adaptive Alerts
                      </Typography>

                      <Typography
                        variant="h4"
                        fontWeight="bold"
                        sx={{ mt: 1 }}
                      >
                        {analytics.alerts?.length || 0}
                      </Typography>

                    </Box>

                    <WarningIcon
                      color={
                        analytics.alerts?.length > 0
                          ? "warning"
                          : "success"
                      }
                      sx={{ fontSize: 40 }}
                    />

                  </Box>

                </CardContent>
              </Card>

            </Box>


            {/* =================================================
                SECONDARY SUMMARY
            ================================================= */}

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


            {/* =================================================
                ADAPTIVE ALERTS
            ================================================= */}

            <Paper
              sx={{
                p: 3,
                mb: 4,
              }}
            >

              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                mb={2}
              >

                <Box
                  display="flex"
                  alignItems="center"
                  gap={1}
                >

                  <TrendingUpIcon color="primary" />

                  <Typography
                    variant="h6"
                    fontWeight="bold"
                  >
                    Adaptive Insights & Alerts
                  </Typography>

                </Box>


                <Chip
                  label={`${analytics.alerts?.length || 0} alert${
                    analytics.alerts?.length === 1
                      ? ""
                      : "s"
                  }`}
                  color={
                    analytics.alerts?.length > 0
                      ? "warning"
                      : "success"
                  }
                  variant="outlined"
                />

              </Box>


              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 2 }}
              >
                Alerts are generated automatically by the
                TimeTap attendance analytics engine using
                processed employee attendance history.
              </Typography>


              <Divider sx={{ mb: 2 }} />


              {analytics.alerts &&
              analytics.alerts.length > 0 ? (

                <Box>

                  {analytics.alerts.map(
                    (alert, index) => (

                      <Alert
                        key={`${alert.employee_id}-${alert.alert_type}-${index}`}
                        severity={getAlertSeverity(
                          alert.severity
                        )}
                        icon={getAlertIcon(
                          alert.severity
                        )}
                        sx={{ mb: 1.5 }}
                      >

                        <Typography
                          fontWeight="bold"
                          component="span"
                        >
                          {alert.alert_type}
                        </Typography>

                        <Typography
                          component="span"
                          sx={{ ml: 1 }}
                        >
                          {alert.message}
                        </Typography>

                      </Alert>

                    )
                  )}

                </Box>

              ) : (

                <Alert
                  severity="success"
                  icon={<EventAvailableIcon />}
                >
                  No adaptive alerts were generated
                  from the current attendance data.
                </Alert>

              )}

            </Paper>


            {/* =================================================
                EMPLOYEE ANALYTICS
            ================================================= */}

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


                            {/* Schedule */}

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


                            {/* Average Late */}

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


            {/* =================================================
                DATA PROCESSING INFORMATION
            ================================================= */}

            <Alert
              severity="info"
              icon={<TrendingUpIcon />}
              sx={{ mt: 3 }}
            >

              <Typography
                fontWeight="bold"
                sx={{ mb: 0.5 }}
              >
                Adaptive Data Processing
              </Typography>

              TimeTap processes historical attendance
              records to calculate working time,
              attendance rates, employee schedules,
              average check-in and check-out patterns,
              fixed-schedule lateness, and adaptive
              employee alerts.

            </Alert>

          </>
        )}

      </Box>

    </Box>
  );
}


export default Reports;