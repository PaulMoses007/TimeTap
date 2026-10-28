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
  TextField,
  Typography,
} from "@mui/material";

import AccessTimeIcon from "@mui/icons-material/AccessTime";
import DashboardIcon from "@mui/icons-material/Dashboard";
import HistoryIcon from "@mui/icons-material/History";
import PersonIcon from "@mui/icons-material/Person";
import LogoutIcon from "@mui/icons-material/Logout";

import { getEmployee } from "../../services/employeeService";
import api from "../../api/axios";

const drawerWidth = 300;

function decodeToken(token) {
  try {
    const payload = token.split(".")[1];

    const decodedPayload = atob(
      payload.replace(/-/g, "+").replace(/_/g, "/")
    );

    return JSON.parse(decodedPayload);
  } catch (error) {
    console.error("Failed to decode token:", error);
    return null;
  }
}

function EmployeeProfile() {
  const navigate = useNavigate();

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    const loadEmployee = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("access_token");

        if (!token) {
          navigate("/");
          return;
        }

        const user = decodeToken(token);

        if (!user || !user.id) {
          localStorage.removeItem("access_token");
          navigate("/");
          return;
        }

        const data = await getEmployee(user.id);
        setEmployee(data);
      } catch (err) {
        console.error(err);

        setError(
          err.response?.data?.detail ||
            "Failed to load employee profile."
        );
      } finally {
        setLoading(false);
      }
    };

    loadEmployee();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  const handleChangePassword = async () => {
    setPasswordError("");
    setPasswordSuccess("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("Please fill in all password fields.");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError(
        "New password must be at least 8 characters."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(
        "New password and confirmation password do not match."
      );
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError(
        "New password must be different from the current password."
      );
      return;
    }

    try {
      setChangingPassword(true);

      await api.put("/employees/me/password", {
        current_password: currentPassword,
        new_password: newPassword,
      });

      setPasswordSuccess(
        "Password changed successfully. Please log in again with your new password."
      );

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        window.location.href = "/";
      }, 2000);
    } catch (err) {
      console.error("Failed to change password:", err);

      setPasswordError(
        err.response?.data?.detail ||
          "Unable to change password."
      );
    } finally {
      setChangingPassword(false);
    }
  };

  const passwordFormComplete =
    currentPassword &&
    newPassword &&
    confirmPassword &&
    !changingPassword;

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

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "#f7f9fc",
      }}
    >
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            borderRight: "1px solid #e0e0e0",
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

        <Box sx={{ px: 2, py: 3 }}>
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
            onClick={() => navigate("/employee-dashboard")}
            sx={{
              borderRadius: 2,
              mb: 0.5,
            }}
          >
            <ListItemIcon>
              <DashboardIcon />
            </ListItemIcon>

            <ListItemText primary="Dashboard" />
          </ListItemButton>

          <ListItemButton
            onClick={() => navigate("/employee-attendance")}
            sx={{
              borderRadius: 2,
              mb: 0.5,
            }}
          >
            <ListItemIcon>
              <HistoryIcon />
            </ListItemIcon>

            <ListItemText primary="Attendance History" />
          </ListItemButton>

          <ListItemButton
            selected
            onClick={() => navigate("/employee-profile")}
            sx={{
              borderRadius: 2,
              mb: 0.5,
            }}
          >
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>

            <ListItemText primary="My Profile" />
          </ListItemButton>
        </List>

        <Box
          sx={{
            marginTop: "auto",
            borderTop: "1px solid #e0e0e0",
            p: 1,
          }}
        >
          <ListItemButton
            onClick={handleLogout}
            sx={{
              borderRadius: 2,
            }}
          >
            <ListItemIcon>
              <LogoutIcon />
            </ListItemIcon>

            <ListItemText primary="Logout" />
          </ListItemButton>
        </Box>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: {
            xs: 3,
            md: 6,
          },
        }}
      >
        <Typography
          variant="h3"
          fontWeight="bold"
        >
          My Profile
        </Typography>

        <Typography
          color="text.secondary"
          sx={{
            mt: 0.5,
            mb: 4,
          }}
        >
          View and manage your employee information.
        </Typography>

        {error && (
          <Alert
            severity="error"
            sx={{ mb: 3 }}
          >
            {error}
          </Alert>
        )}

        {employee && (
          <>
            <Card
              elevation={0}
              sx={{
                border: "1px solid #e4e7eb",
                borderRadius: 3,
                mb: 3,
              }}
            >
              <CardContent
                sx={{
                  p: 4,
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                }}
              >
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    fontSize: 32,
                    bgcolor: "primary.main",
                  }}
                >
                  {employee.first_name
                    ?.charAt(0)
                    .toUpperCase()}
                  {employee.last_name
                    ?.charAt(0)
                    .toUpperCase()}
                </Avatar>

                <Box>
                  <Typography
                    variant="h5"
                    fontWeight="bold"
                  >
                    {employee.first_name}{" "}
                    {employee.last_name}
                  </Typography>

                  <Typography
                    color="text.secondary"
                    sx={{ mt: 0.5 }}
                  >
                    {employee.role}
                  </Typography>

                  <Typography
                    color="primary"
                    fontWeight="bold"
                    sx={{ mt: 0.5 }}
                  >
                    {employee.employee_id}
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            <Card
              elevation={0}
              sx={{
                border: "1px solid #e4e7eb",
                borderRadius: 3,
                mb: 3,
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <Typography
                  variant="h6"
                  fontWeight="bold"
                  sx={{ mb: 3 }}
                >
                  Personal Information
                </Typography>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      md: "1fr 1fr",
                    },
                    gap: 3,
                  }}
                >
                  <Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      First Name
                    </Typography>

                    <Typography
                      fontWeight="bold"
                      sx={{ mt: 0.5 }}
                    >
                      {employee.first_name || "-"}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      Last Name
                    </Typography>

                    <Typography
                      fontWeight="bold"
                      sx={{ mt: 0.5 }}
                    >
                      {employee.last_name || "-"}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      Email
                    </Typography>

                    <Typography
                      fontWeight="bold"
                      sx={{ mt: 0.5 }}
                    >
                      {employee.email || "-"}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      Phone
                    </Typography>

                    <Typography
                      fontWeight="bold"
                      sx={{ mt: 0.5 }}
                    >
                      {employee.phone || "-"}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            <Card
              elevation={0}
              sx={{
                border: "1px solid #e4e7eb",
                borderRadius: 3,
                mb: 3,
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <Typography
                  variant="h6"
                  fontWeight="bold"
                  sx={{ mb: 3 }}
                >
                  Work Information
                </Typography>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      md: "1fr 1fr",
                    },
                    gap: 3,
                  }}
                >
                  <Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      Employee ID
                    </Typography>

                    <Typography
                      fontWeight="bold"
                      sx={{ mt: 0.5 }}
                    >
                      {employee.employee_id || "-"}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      Role
                    </Typography>

                    <Typography
                      fontWeight="bold"
                      sx={{ mt: 0.5 }}
                    >
                      {employee.role || "-"}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      Restaurant
                    </Typography>

                    <Typography
                      fontWeight="bold"
                      sx={{ mt: 0.5 }}
                    >
                      {employee.restaurant_name ||
                        "Not assigned"}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      Schedule Type
                    </Typography>

                    <Typography
                      fontWeight="bold"
                      sx={{ mt: 0.5 }}
                    >
                      {employee.schedule_type || "Flexible"}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      Shift Start
                    </Typography>

                    <Typography
                      fontWeight="bold"
                      sx={{ mt: 0.5 }}
                    >
                      {employee.shift_start || "-"}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      Shift End
                    </Typography>

                    <Typography
                      fontWeight="bold"
                      sx={{ mt: 0.5 }}
                    >
                      {employee.shift_end || "-"}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            <Card
              elevation={0}
              sx={{
                border: "1px solid #e4e7eb",
                borderRadius: 3,
                mb: 3,
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <Typography
                  variant="h6"
                  fontWeight="bold"
                  sx={{ mb: 3 }}
                >
                  Account Status
                </Typography>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      md: "1fr 1fr",
                    },
                    gap: 3,
                  }}
                >
                  <Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      Approval Status
                    </Typography>

                    <Typography
                      fontWeight="bold"
                      color={
                        employee.approval_status === "Approved"
                          ? "success.main"
                          : "warning.main"
                      }
                      sx={{ mt: 0.5 }}
                    >
                      {employee.approval_status || "Pending"}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      Account Status
                    </Typography>

                    <Typography
                      fontWeight="bold"
                      color={
                        employee.is_active
                          ? "success.main"
                          : "error.main"
                      }
                      sx={{ mt: 0.5 }}
                    >
                      {employee.is_active
                        ? "Active"
                        : "Inactive"}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            <Card
              elevation={0}
              sx={{
                border: "1px solid #e4e7eb",
                borderRadius: 3,
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <Typography
                  variant="h6"
                  fontWeight="bold"
                >
                  Security
                </Typography>

                <Typography
                  color="text.secondary"
                  sx={{
                    mt: 0.5,
                    mb: 3,
                  }}
                >
                  Change your employee account password.
                </Typography>

                <Divider sx={{ mb: 3 }} />

                {passwordError && (
                  <Alert
                    severity="error"
                    sx={{
                      mb: 2,
                      maxWidth: 600,
                    }}
                  >
                    {passwordError}
                  </Alert>
                )}

                {passwordSuccess && (
                  <Alert
                    severity="success"
                    sx={{
                      mb: 2,
                      maxWidth: 600,
                    }}
                  >
                    {passwordSuccess}
                  </Alert>
                )}

                <Box
                  sx={{
                    maxWidth: 600,
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                  }}
                >
                  <TextField
                    label="Current Password"
                    type="password"
                    value={currentPassword}
                    onChange={(event) => {
                      setCurrentPassword(event.target.value);
                      setPasswordError("");
                      setPasswordSuccess("");
                    }}
                    fullWidth
                  />

                  <TextField
                    label="New Password"
                    type="password"
                    value={newPassword}
                    onChange={(event) => {
                      setNewPassword(event.target.value);
                      setPasswordError("");
                      setPasswordSuccess("");
                    }}
                    helperText="Minimum 8 characters"
                    fullWidth
                  />

                  <TextField
                    label="Confirm New Password"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => {
                      setConfirmPassword(event.target.value);
                      setPasswordError("");
                      setPasswordSuccess("");
                    }}
                    error={
                      confirmPassword.length > 0 &&
                      newPassword !== confirmPassword
                    }
                    helperText={
                      confirmPassword.length > 0 &&
                      newPassword !== confirmPassword
                        ? "Passwords do not match"
                        : ""
                    }
                    fullWidth
                  />
                </Box>

                <Button
                  variant="contained"
                  sx={{ mt: 3 }}
                  disabled={!passwordFormComplete}
                  onClick={handleChangePassword}
                >
                  {changingPassword
                    ? "Changing Password..."
                    : "Change Password"}
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </Box>
    </Box>
  );
}

export default EmployeeProfile;