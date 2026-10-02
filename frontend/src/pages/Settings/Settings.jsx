import React from "react";
import {
  Box,
  Typography,
  Paper,
  Divider,
  TextField,
  Button,
  Avatar,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Drawer,
} from "@mui/material";

import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import AssessmentIcon from "@mui/icons-material/Assessment";
import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from "@mui/icons-material/Logout";
import SaveIcon from "@mui/icons-material/Save";

import { useNavigate } from "react-router-dom";

const drawerWidth = 300;

function Settings() {
  const navigate = useNavigate();

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
      text: "Settings",
      icon: <SettingsIcon />,
      path: "/settings",
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f7f8fa" }}>
      {/* Manager Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            borderRight: "1px solid #e5e7eb",
            bgcolor: "#ffffff",
          },
        }}
      >
        {/* Logo / Header */}
        <Box sx={{ p: 3 }}>
          <Typography
            variant="h5"
            fontWeight="bold"
            sx={{ color: "#1976d2" }}
          >
            TimeTap
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.5 }}
          >
            Manager Panel
          </Typography>
        </Box>

        <Divider />

        {/* Navigation */}
        <List sx={{ px: 2, py: 2 }}>
          {menuItems.map((item) => (
            <ListItemButton
              key={item.text}
              onClick={() => navigate(item.path)}
              selected={item.path === "/settings"}
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
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          ))}
        </List>

        <Box sx={{ flexGrow: 1 }} />

        <Divider />

        {/* Logout */}
        <Box sx={{ p: 2 }}>
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

      {/* Main Content */}
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
        {/* Page Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight="bold">
            Settings
          </Typography>

          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ mt: 0.5 }}
          >
            Manage your TimeTap manager account and system settings.
          </Typography>
        </Box>

        {/* Manager Account */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 3,
            border: "1px solid #e5e7eb",
            borderRadius: 3,
          }}
        >
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
                width: 56,
                height: 56,
                bgcolor: "#1976d2",
                fontSize: 22,
              }}
            >
              M
            </Avatar>

            <Box>
              <Typography variant="h6" fontWeight="bold">
                Manager Account
              </Typography>

              <Typography variant="body2" color="text.secondary">
                Manage your manager account information.
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ mb: 3 }} />

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: "1fr 1fr",
              },
              gap: 2,
            }}
          >
            <TextField
              label="Manager Name"
              defaultValue="Manager"
              fullWidth
            />

            <TextField
              label="Role"
              defaultValue="Manager"
              fullWidth
              disabled
            />

            <TextField
              label="Email"
              defaultValue="paul@example.com"
              fullWidth
            />

            <TextField
              label="Account Status"
              defaultValue="Active"
              fullWidth
              disabled
            />
          </Box>

          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            sx={{ mt: 3 }}
          >
            Save Account
          </Button>
        </Paper>

        {/* Restaurant Settings */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 3,
            border: "1px solid #e5e7eb",
            borderRadius: 3,
          }}
        >
          <Typography variant="h6" fontWeight="bold">
            Restaurant Settings
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.5, mb: 3 }}
          >
            Configure the restaurant information used by TimeTap.
          </Typography>

          <Divider sx={{ mb: 3 }} />

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: "1fr 1fr",
              },
              gap: 2,
            }}
          >
            <TextField
              label="Restaurant Name"
              defaultValue="Chef Mezze"
              fullWidth
            />

            <TextField
              label="Phone"
              defaultValue="+371 20000009"
              fullWidth
            />

            <TextField
              label="Email"
              defaultValue="chefmezze@example.com"
              fullWidth
            />

            <TextField
              label="Address"
              defaultValue="Riga, Latvia"
              fullWidth
            />
          </Box>

          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            sx={{ mt: 3 }}
          >
            Save Restaurant
          </Button>
        </Paper>

        {/* Security */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 3,
            border: "1px solid #e5e7eb",
            borderRadius: 3,
          }}
        >
          <Typography variant="h6" fontWeight="bold">
            Security
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.5, mb: 3 }}
          >
            Change your manager account password.
          </Typography>

          <Divider sx={{ mb: 3 }} />

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
              fullWidth
            />

            <TextField
              label="New Password"
              type="password"
              fullWidth
            />

            <TextField
              label="Confirm New Password"
              type="password"
              fullWidth
            />
          </Box>

          <Button
            variant="contained"
            sx={{ mt: 3 }}
          >
            Change Password
          </Button>
        </Paper>

        {/* System Information */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            border: "1px solid #e5e7eb",
            borderRadius: 3,
          }}
        >
          <Typography variant="h6" fontWeight="bold">
            System Information
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.5, mb: 3 }}
          >
            Current TimeTap application information.
          </Typography>

          <Divider sx={{ mb: 2 }} />

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "1fr 1fr",
              },
              gap: 2,
            }}
          >
            <Box>
              <Typography variant="body2" color="text.secondary">
                Application
              </Typography>

              <Typography fontWeight="bold">
                TimeTap
              </Typography>
            </Box>

            <Box>
              <Typography variant="body2" color="text.secondary">
                Version
              </Typography>

              <Typography fontWeight="bold">
                1.0.0
              </Typography>
            </Box>

            <Box>
              <Typography variant="body2" color="text.secondary">
                Attendance System
              </Typography>

              <Typography fontWeight="bold">
                QR / Manual Check-in
              </Typography>
            </Box>

            <Box>
              <Typography variant="body2" color="text.secondary">
                Platform
              </Typography>

              <Typography fontWeight="bold">
                TimeTap Workforce Management
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}

export default Settings;