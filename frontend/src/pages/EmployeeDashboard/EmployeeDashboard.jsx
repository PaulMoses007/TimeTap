import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Snackbar,
  Typography,
} from "@mui/material";

import AccessTimeIcon from "@mui/icons-material/AccessTime";
import DashboardIcon from "@mui/icons-material/Dashboard";
import HistoryIcon from "@mui/icons-material/History";
import PersonIcon from "@mui/icons-material/Person";
import LogoutIcon from "@mui/icons-material/Logout";
import LoginIcon from "@mui/icons-material/Login";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";

import {
  checkIn,
  checkOut,
  getMyAttendance,
} from "../../services/attendanceService";

const drawerWidth = 300;

function decodeToken(token) {
  try {
    const payload = token.split(".")[1];

    const decodedPayload = atob(
      payload
        .replace(/-/g, "+")
        .replace(/_/g, "/")
    );

    return JSON.parse(decodedPayload);
  } catch (error) {
    console.error(
      "Failed to decode token:",
      error
    );

    return null;
  }
}

function EmployeeDashboard() {
  const navigate = useNavigate();

  const [attendance, setAttendance] = useState(null);
  const [restaurantId, setRestaurantId] =
    useState(null);

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] =
    useState(false);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] =
    useState("");

  const loadAttendance = async () => {
    try {
      setError("");

      const records = await getMyAttendance();

      if (!Array.isArray(records)) {
        setAttendance(null);
        return;
      }

      const today = new Date()
        .toISOString()
        .split("T")[0];

      const todayRecord = records.find(
        (record) =>
          record.work_date === today
      );

      setAttendance(
        todayRecord || null
      );
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Failed to load attendance."
      );
    }
  };

  useEffect(() => {
    const initialize = async () => {
      try {
        const token =
          localStorage.getItem(
            "access_token"
          );

        if (!token) {
          navigate("/");
          return;
        }

        const user = decodeToken(token);

        if (!user || !user.id) {
          localStorage.removeItem(
            "access_token"
          );

          navigate("/");
          return;
        }

        /*
         * Get the logged-in employee's
         * restaurant from the employee record.
         */
        const response = await fetch(
          `/api/employees/${user.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(
            "Failed to load employee information."
          );
        }

        const employee =
          await response.json();

        if (!employee.restaurant_id) {
          throw new Error(
            "You are not assigned to a restaurant."
          );
        }

        setRestaurantId(
          employee.restaurant_id
        );

        await loadAttendance();
      } catch (err) {
        console.error(err);

        setError(
          err.message ||
            "Failed to load dashboard."
        );
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, [navigate]);

  const handleCheckIn = async () => {
    if (!restaurantId) {
      setError(
        "Restaurant information is not available."
      );
      return;
    }

    setProcessing(true);
    setError("");

    try {
      const data = await checkIn(
        restaurantId
      );

      setAttendance(data);

      setSuccessMessage(
        "You have successfully checked in."
      );
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Check-in failed."
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleCheckOut = async () => {
    if (!restaurantId) {
      setError(
        "Restaurant information is not available."
      );
      return;
    }

    setProcessing(true);
    setError("");

    try {
      const data = await checkOut(
        restaurantId
      );

      setAttendance(data);

      setSuccessMessage(
        "You have successfully checked out."
      );
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Check-out failed."
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(
      "access_token"
    );

    window.location.href = "/";
  };

  const formatTime = (value) => {
    if (!value) {
      return "-";
    }

    return new Date(value).toLocaleTimeString(
      [],
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  const isWorking =
    attendance &&
    !attendance.check_out;

  const isCheckedOut =
    attendance &&
    attendance.check_out;

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
      }}
    >
      {/* SIDEBAR */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,

          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            borderRight:
              "1px solid #e0e0e0",
          },
        }}
      >
        <Box
          sx={{
            height: 80,
            display: "flex",
            alignItems: "center",
            px: 3,
          }}
        >
          <Avatar
            sx={{
              mr: 1.5,
              bgcolor: "primary.main",
            }}
          >
            <AccessTimeIcon />
          </Avatar>

          <Typography
            variant="h5"
            fontWeight="bold"
            color="primary"
          >
            TimeTap
          </Typography>
        </Box>

        <Divider />

        <Box
          sx={{
            px: 2,
            py: 3,
          }}
        >
          <Typography
            variant="body2"
            color="text.secondary"
          >
            Logged in as
          </Typography>

          <Typography
            variant="subtitle1"
            fontWeight="bold"
          >
            Employee
          </Typography>
        </Box>

        <List sx={{ px: 1 }}>
          <ListItemButton
            selected
            sx={{
              borderRadius: 2,
              mb: 0.5,
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 42,
                color: "primary.main",
              }}
            >
              <DashboardIcon />
            </ListItemIcon>

            <ListItemText
              primary="Dashboard"
            />
          </ListItemButton>

          <ListItemButton
            onClick={() =>
              navigate(
                "/employee-attendance"
              )
            }
            sx={{
              borderRadius: 2,
              mb: 0.5,
            }}
          >
            <ListItemIcon
              sx={{ minWidth: 42 }}
            >
              <HistoryIcon />
            </ListItemIcon>

            <ListItemText
              primary="Attendance History"
            />
          </ListItemButton>

          <ListItemButton
            sx={{
              borderRadius: 2,
              mb: 0.5,
            }}
          >
            <ListItemIcon
              sx={{ minWidth: 42 }}
            >
              <PersonIcon />
            </ListItemIcon>

            <ListItemText
              primary="My Profile"
            />
          </ListItemButton>
        </List>

        <Box
          sx={{
            mt: "auto",
            p: 1,
          }}
        >
          <Divider sx={{ mb: 1 }} />

          <ListItemButton
            onClick={handleLogout}
            sx={{
              borderRadius: 2,
            }}
          >
            <ListItemIcon
              sx={{ minWidth: 42 }}
            >
              <LogoutIcon />
            </ListItemIcon>

            <ListItemText
              primary="Logout"
            />
          </ListItemButton>
        </Box>
      </Drawer>

      {/* MAIN */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: "#f7f8fa",
          minHeight: "100vh",
        }}
      >
        <Box
          sx={{
            maxWidth: 1200,
            mx: "auto",
            py: 5,
            px: {
              xs: 2,
              md: 4,
            },
          }}
        >
          {/* HEADER */}
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="h4"
              fontWeight="bold"
            >
              Employee Dashboard
            </Typography>

            <Typography
              color="text.secondary"
              sx={{ mt: 0.5 }}
            >
              Manage your attendance and
              work time.
            </Typography>
          </Box>

          {error && (
            <Alert
              severity="error"
              sx={{ mb: 3 }}
              onClose={() =>
                setError("")
              }
            >
              {error}
            </Alert>
          )}

          {/* ATTENDANCE CARD */}
          <Card
            elevation={0}
            sx={{
              border:
                "1px solid #e4e7eb",
              borderRadius: 3,
              mb: 3,
            }}
          >
            <CardContent
              sx={{ p: 4 }}
            >
              <Typography
                variant="h6"
                fontWeight="bold"
                sx={{ mb: 1 }}
              >
                Today's Attendance
              </Typography>

              <Typography
                color="text.secondary"
                sx={{ mb: 3 }}
              >
                {isWorking
                  ? "You are currently working."
                  : isCheckedOut
                  ? "Your shift has been completed."
                  : "You are currently not checked in."}
              </Typography>

              {/* CHECK IN */}
              {!attendance && (
                <Button
                  variant="contained"
                  size="large"
                  startIcon={
                    processing ? (
                      <CircularProgress
                        size={20}
                        color="inherit"
                      />
                    ) : (
                      <LoginIcon />
                    )
                  }
                  onClick={
                    handleCheckIn
                  }
                  disabled={processing}
                >
                  {processing
                    ? "Checking In..."
                    : "Check In"}
                </Button>
              )}

              {/* CHECK OUT */}
              {isWorking && (
                <Button
                  variant="contained"
                  color="error"
                  size="large"
                  startIcon={
                    processing ? (
                      <CircularProgress
                        size={20}
                        color="inherit"
                      />
                    ) : (
                      <LogoutOutlinedIcon />
                    )
                  }
                  onClick={
                    handleCheckOut
                  }
                  disabled={processing}
                >
                  {processing
                    ? "Checking Out..."
                    : "Check Out"}
                </Button>
              )}

              {/* COMPLETED */}
              {isCheckedOut && (
                <Alert
                  severity="success"
                  sx={{ mt: 2 }}
                >
                  Today's shift is
                  completed.
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* TODAY DETAILS */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "1fr 1fr",
                md: "1fr 1fr 1fr",
              },
              gap: 3,
            }}
          >
            <Card
              elevation={0}
              sx={{
                border:
                  "1px solid #e4e7eb",
                borderRadius: 3,
              }}
            >
              <CardContent
                sx={{ p: 3 }}
              >
                <Typography
                  color="text.secondary"
                >
                  Check In
                </Typography>

                <Typography
                  variant="h5"
                  fontWeight="bold"
                  sx={{ mt: 1 }}
                >
                  {formatTime(
                    attendance?.check_in
                  )}
                </Typography>
              </CardContent>
            </Card>

            <Card
              elevation={0}
              sx={{
                border:
                  "1px solid #e4e7eb",
                borderRadius: 3,
              }}
            >
              <CardContent
                sx={{ p: 3 }}
              >
                <Typography
                  color="text.secondary"
                >
                  Check Out
                </Typography>

                <Typography
                  variant="h5"
                  fontWeight="bold"
                  sx={{ mt: 1 }}
                >
                  {formatTime(
                    attendance?.check_out
                  )}
                </Typography>
              </CardContent>
            </Card>

            <Card
              elevation={0}
              sx={{
                border:
                  "1px solid #e4e7eb",
                borderRadius: 3,
              }}
            >
              <CardContent
                sx={{ p: 3 }}
              >
                <Typography
                  color="text.secondary"
                >
                  Worked Hours
                </Typography>

                <Typography
                  variant="h5"
                  fontWeight="bold"
                  sx={{ mt: 1 }}
                >
                  {attendance?.worked_hours ??
                    0}{" "}
                  hrs
                </Typography>
              </CardContent>
            </Card>
          </Box>

          {/* HISTORY BUTTON */}
          <Card
            elevation={0}
            sx={{
              border:
                "1px solid #e4e7eb",
              borderRadius: 3,
              mt: 3,
            }}
          >
            <CardContent
              sx={{
                p: 3,
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
              }}
            >
              <Box>
                <Typography
                  variant="h6"
                  fontWeight="bold"
                >
                  Attendance History
                </Typography>

                <Typography
                  color="text.secondary"
                >
                  View your previous
                  attendance records.
                </Typography>
              </Box>

              <Button
                variant="outlined"
                onClick={() =>
                  navigate(
                    "/employee-attendance"
                  )
                }
              >
                View History
              </Button>
            </CardContent>
          </Card>
        </Box>
      </Box>

      <Snackbar
        open={Boolean(
          successMessage
        )}
        autoHideDuration={4000}
        onClose={() =>
          setSuccessMessage("")
        }
        message={successMessage}
      />
    </Box>
  );
}

export default EmployeeDashboard;