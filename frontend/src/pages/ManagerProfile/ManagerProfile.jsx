import React, { useEffect, useState } from "react";
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
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  TextField,
  Typography,
} from "@mui/material";

import AccessTimeIcon from "@mui/icons-material/AccessTime";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import AssessmentIcon from "@mui/icons-material/Assessment";
import PersonIcon from "@mui/icons-material/Person";
import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from "@mui/icons-material/Logout";

import api from "../../api/axios";
import { updateMyProfile } from "../../services/employeeService";

const drawerWidth = 300;

function ManagerProfile() {
  const navigate = useNavigate();

  const [manager, setManager] = useState(null);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
  });
  const [saveError, setSaveError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await api.get("/employees/me");
        setManager(response.data);
      } catch (error) {
        console.error(
          "Failed to load manager profile:",
          error
        );

        if (error.response?.status === 401) {
          localStorage.removeItem("access_token");
          navigate("/");
        }
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [navigate]);

  const handleStartEdit = () => {
    setForm({
      first_name: manager.first_name || "",
      last_name: manager.last_name || "",
      email: manager.email || "",
      phone: manager.phone || "",
    });
    setSaveError("");
    setSaved(false);
    setEditing(true);
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();

    const cleaned = {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
    };

    if (
      !cleaned.first_name ||
      !cleaned.last_name ||
      !cleaned.email ||
      !cleaned.phone
    ) {
      setSaveError("Please fill in every field.");
      return;
    }

    setSaving(true);
    setSaveError("");

    try {
      const updated = await updateMyProfile(cleaned);
      setManager(updated);
      setEditing(false);
      setSaved(true);
    } catch (error) {
      const detail = error.response?.data?.detail;

      // FastAPI sends a list of problems for badly formatted fields
      setSaveError(
        Array.isArray(detail)
          ? "Please check the email address and the other fields."
          : detail || "Could not save your profile. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    window.location.href = "/";
  };

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
    },
    {
      text: "My Profile",
      icon: <PersonIcon />,
      path: "/manager-profile",
    },
    {
      text: "Settings",
      icon: <SettingsIcon />,
      path: "/settings",
    },
  ];

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          backgroundColor: "#f5f7fa",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!manager) {
    return (
      <Box
        sx={{
          display: "flex",
          minHeight: "100vh",
          backgroundColor: "#f5f7fa",
        }}
      >
        <Box
          sx={{
            width: drawerWidth,
            backgroundColor: "#ffffff",
            borderRight: "1px solid #e0e0e0",
          }}
        />

        <Box sx={{ p: 4 }}>
          <Typography color="error">
            Unable to load manager profile.
          </Typography>
        </Box>
      </Box>
    );
  }

  const getInitials = () => {
    const first =
      manager.first_name?.charAt(0) || "";

    const last =
      manager.last_name?.charAt(0) || "";

    return `${first}${last}`.toUpperCase();
  };

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "#f5f7fa",
      }}
    >
      {/* =====================================================
          SIDEBAR
      ====================================================== */}

      <Box
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          backgroundColor: "#ffffff",
          borderRight: "1px solid #e0e0e0",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* LOGO */}

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

          <Box>
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
        </Box>

        <Divider />

        {/* NAVIGATION */}

        <List sx={{ px: 2, py: 2 }}>
          {menuItems.map((item) => (
            <ListItemButton
              key={item.text}
              onClick={() => navigate(item.path)}
              selected={item.path === "/manager-profile"}
              sx={{
                borderRadius: 2,
                mb: 0.5,

                "&.Mui-selected": {
                  bgcolor: "#e3f2fd",
                  color: "#1976d2",

                  "& .MuiListItemIcon-root": {
                    color: "#1976d2",
                  },
                },

                "&:hover": {
                  bgcolor: "#f0f7ff",
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 42,
                }}
              >
                {item.icon}
              </ListItemIcon>

              <ListItemText
                primary={item.text}
              />
            </ListItemButton>
          ))}
        </List>

        <Box sx={{ flexGrow: 1 }} />

        <Divider />

        {/* LOGOUT */}

        <Box sx={{ p: 2 }}>
          <ListItemButton
            onClick={handleLogout}
            sx={{
              borderRadius: 2,
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 42,
              }}
            >
              <LogoutIcon />
            </ListItemIcon>

            <ListItemText primary="Logout" />
          </ListItemButton>
        </Box>
      </Box>

      {/* =====================================================
          MAIN CONTENT
      ====================================================== */}

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: {
            xs: 2,
            md: 4,
          },
        }}
      >
        {/* PAGE HEADER */}

        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h4"
            fontWeight="bold"
          >
            My Profile
          </Typography>

          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ mt: 0.5 }}
          >
            View and update your manager account information.
          </Typography>
        </Box>

        {/* PROFILE CARD */}

        <Card
          elevation={0}
          sx={{
            maxWidth: 1000,
            border: "1px solid #e5e7eb",
            borderRadius: 3,
          }}
        >
          <CardContent sx={{ p: 4 }}>
            {/* PROFILE HEADER */}

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                mb: 3,
              }}
            >
              <Avatar
                sx={{
                  width: 64,
                  height: 64,
                  bgcolor: "primary.main",
                  fontSize: 22,
                }}
              >
                {getInitials()}
              </Avatar>

              <Box>
                <Typography
                  variant="h5"
                  fontWeight="bold"
                >
                  {manager.first_name}{" "}
                  {manager.last_name}
                </Typography>

                <Typography
                  color="text.secondary"
                >
                  {manager.role}
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ mb: 4 }} />

            {/* PERSONAL INFORMATION */}

            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 3,
              }}
            >
              <Typography
                variant="h6"
                fontWeight="bold"
              >
                Personal Information
              </Typography>

              {!editing && (
                <Button
                  variant="outlined"
                  onClick={handleStartEdit}
                >
                  Edit
                </Button>
              )}
            </Box>

            {saved && !editing && (
              <Alert
                severity="success"
                sx={{ mb: 3 }}
                onClose={() => setSaved(false)}
              >
                Your profile has been updated.
              </Alert>
            )}

            {editing && (
              <Box
                component="form"
                onSubmit={handleSaveProfile}
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    md: "1fr 1fr",
                  },
                  gap: 2,
                }}
              >
                {saveError && (
                  <Alert
                    severity="error"
                    sx={{ gridColumn: "1 / -1" }}
                  >
                    {saveError}
                  </Alert>
                )}

                <TextField
                  required
                  label="First Name"
                  name="first_name"
                  value={form.first_name}
                  onChange={handleFormChange}
                />

                <TextField
                  required
                  label="Last Name"
                  name="last_name"
                  value={form.last_name}
                  onChange={handleFormChange}
                />

                <TextField
                  required
                  type="email"
                  label="Email"
                  name="email"
                  value={form.email}
                  onChange={handleFormChange}
                  helperText="You log in with this email."
                />

                <TextField
                  required
                  label="Phone"
                  name="phone"
                  value={form.phone}
                  onChange={handleFormChange}
                />

                <Box
                  sx={{
                    gridColumn: "1 / -1",
                    display: "flex",
                    gap: 2,
                  }}
                >
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={saving}
                  >
                    {saving ? (
                      <CircularProgress size={22} color="inherit" />
                    ) : (
                      "Save changes"
                    )}
                  </Button>

                  <Button
                    onClick={() => setEditing(false)}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                </Box>
              </Box>
            )}

            {!editing && (
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
                  sx={{ mb: 0.5 }}
                >
                  First Name
                </Typography>

                <Typography fontWeight="500">
                  {manager.first_name}
                </Typography>
              </Box>

              <Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 0.5 }}
                >
                  Last Name
                </Typography>

                <Typography fontWeight="500">
                  {manager.last_name}
                </Typography>
              </Box>

              <Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 0.5 }}
                >
                  Email
                </Typography>

                <Typography fontWeight="500">
                  {manager.email}
                </Typography>
              </Box>

              <Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 0.5 }}
                >
                  Phone
                </Typography>

                <Typography fontWeight="500">
                  {manager.phone || "Not provided"}
                </Typography>
              </Box>
            </Box>
            )}

            <Divider sx={{ my: 4 }} />

            {/* WORK INFORMATION */}

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
                  sx={{ mb: 0.5 }}
                >
                  Manager ID
                </Typography>

                <Typography fontWeight="500">
                  {manager.employee_id}
                </Typography>
              </Box>

              <Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 0.5 }}
                >
                  Role
                </Typography>

                <Typography fontWeight="500">
                  {manager.role}
                </Typography>
              </Box>

              <Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 0.5 }}
                >
                  Restaurant
                </Typography>

                <Typography fontWeight="500">
                  {manager.restaurant_name ||
                    "Not assigned"}
                </Typography>
              </Box>

              <Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 0.5 }}
                >
                  Account Status
                </Typography>

                <Typography
                  fontWeight="500"
                  color={
                    manager.is_active
                      ? "success.main"
                      : "error.main"
                  }
                >
                  {manager.is_active
                    ? "Active"
                    : "Inactive"}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}

export default ManagerProfile;