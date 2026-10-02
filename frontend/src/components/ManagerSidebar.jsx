import React from "react";

import {
  Box,
  Typography,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";

import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import AssessmentIcon from "@mui/icons-material/Assessment";
import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from "@mui/icons-material/Logout";

import { useNavigate } from "react-router-dom";

const drawerWidth = 300;

function ManagerSidebar({ activePage }) {
  const navigate = useNavigate();

  const menuItems = [
    {
      text: "Dashboard",
      icon: <DashboardIcon />,
      path: "/dashboard",
      id: "dashboard",
    },
    {
      text: "Employees",
      icon: <PeopleIcon />,
      path: "/employees",
      id: "employees",
    },
    {
      text: "Attendance",
      icon: <AccessTimeIcon />,
      path: "/manager-attendance",
      id: "attendance",
    },
    {
      text: "Restaurants",
      icon: <RestaurantIcon />,
      path: "/restaurants",
      id: "restaurants",
    },
    {
      text: "Reports",
      icon: <AssessmentIcon />,
      path: "/reports",
      id: "reports",
    },
    {
      text: "Settings",
      icon: <SettingsIcon />,
      path: "/settings",
      id: "settings",
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");

    navigate("/");
  };

  return (
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
      {/* ================================================== */}
      {/* HEADER */}
      {/* ================================================== */}

      <Box
        sx={{
          px: 3,
          py: 2,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
          }}
        >
          {/* TimeTap Clock Logo */}
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              bgcolor: "#1976d2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <AccessTimeIcon
              sx={{
                color: "#ffffff",
                fontSize: 22,
              }}
            />
          </Box>

          {/* TimeTap */}
          <Typography
            variant="h5"
            fontWeight="500"
            sx={{
              color: "#1976d2",
              lineHeight: 1.2,
            }}
          >
            TimeTap
          </Typography>
        </Box>

        {/* Manager Panel */}
        <Typography
          variant="body2"
          sx={{
            color: "#111827",
            mt: 0.75,
          }}
        >
          Manager Panel
        </Typography>
      </Box>

      <Divider />

      {/* ================================================== */}
      {/* NAVIGATION */}
      {/* ================================================== */}

      <List
        sx={{
          px: 2,
          py: 2,
        }}
      >
        {menuItems.map((item) => {
          const isActive = activePage === item.id;

          return (
            <ListItemButton
              key={item.id}
              onClick={() => navigate(item.path)}
              selected={isActive}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                minHeight: 44,

                "& .MuiListItemIcon-root": {
                  minWidth: 40,
                  color: isActive
                    ? "#1976d2"
                    : "#757575",
                },

                "& .MuiListItemText-primary": {
                  fontSize: "14px",
                  color: isActive
                    ? "#1976d2"
                    : "#111827",
                  fontWeight: isActive
                    ? 500
                    : 400,
                },

                "&.Mui-selected": {
                  bgcolor: "#e3f2fd",
                },

                "&.Mui-selected:hover": {
                  bgcolor: "#e3f2fd",
                },

                "&:hover": {
                  bgcolor: "#f5f7fa",
                },
              }}
            >
              <ListItemIcon>
                {item.icon}
              </ListItemIcon>

              <ListItemText
                primary={item.text}
              />
            </ListItemButton>
          );
        })}
      </List>

      {/* ================================================== */}
      {/* PUSH LOGOUT TO BOTTOM */}
      {/* ================================================== */}

      <Box sx={{ flexGrow: 1 }} />

      <Divider />

      {/* ================================================== */}
      {/* LOGOUT */}
      {/* ================================================== */}

      <Box
        sx={{
          px: 2,
          py: 2,
        }}
      >
        <ListItemButton
          onClick={handleLogout}
          sx={{
            borderRadius: 2,
            minHeight: 44,

            "& .MuiListItemIcon-root": {
              minWidth: 40,
              color: "#757575",
            },

            "& .MuiListItemText-primary": {
              fontSize: "14px",
              color: "#111827",
            },

            "&:hover": {
              bgcolor: "#f5f7fa",
            },
          }}
        >
          <ListItemIcon>
            <LogoutIcon />
          </ListItemIcon>

          <ListItemText primary="Logout" />
        </ListItemButton>
      </Box>
    </Drawer>
  );
}

export default ManagerSidebar;