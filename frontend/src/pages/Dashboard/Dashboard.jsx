import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Alert,
  Avatar,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Grid,
  Typography,
} from "@mui/material";

import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import AssessmentIcon from "@mui/icons-material/Assessment";
import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from "@mui/icons-material/Logout";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PersonOffIcon from "@mui/icons-material/PersonOff";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import GroupsIcon from "@mui/icons-material/Groups";

import { getDashboard } from "../../services/dashboardService";

const drawerWidth = 240;

function Dashboard() {
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const dashboardData = await getDashboard();
        setData(dashboardData);
      } catch (err) {
        console.error(err);

        setError(
          err.response?.data?.detail ||
            "Failed to load dashboard data."
        );
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    window.location.href = "/";
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

  if (error) {
    return (
      <Container sx={{ mt: 5 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  const menuItems = [
    {
      text: "Dashboard",
      icon: <DashboardIcon />,
      active: true,
    },
    {
      text: "Employees",
      icon: <PeopleIcon />,
    },
    {
      text: "Attendance",
      icon: <AccessTimeIcon />,
    },
    {
      text: "Restaurants",
      icon: <RestaurantIcon />,
    },
    {
      text: "Reports",
      icon: <AssessmentIcon />,
    },
    {
      text: "Settings",
      icon: <SettingsIcon />,
    },
  ];

  const cards = [
    {
      title: "Total Employees",
      value: data.total_employees,
      icon: <GroupsIcon />,
      description: "Registered employees",
    },
    {
      title: "Working Now",
      value: data.working_now,
      icon: <AccessTimeIcon />,
      description: "Currently working",
    },
    {
      title: "Checked In Today",
      value: data.checked_in_today,
      icon: <CheckCircleIcon />,
      description: "Today's attendance",
    },
    {
      title: "Checked Out Today",
      value: data.checked_out_today,
      icon: <AccessTimeIcon />,
      description: "Completed shifts",
    },
    {
      title: "Absent Today",
      value: data.absent_today,
      icon: <PersonOffIcon />,
      description: "Employees not checked in",
    },
    {
      title: "Pending Approvals",
      value: data.pending_approvals,
      icon: <PendingActionsIcon />,
      description: "Waiting for approval",
    },
  ];

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
            borderRight: "1px solid #e0e0e0",
          },
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

          <Typography
            variant="h5"
            fontWeight="bold"
            color="primary"
          >
            TimeTap
          </Typography>
        </Box>

        <Divider />

        {/* USER INFORMATION */}
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
            Manager
          </Typography>
        </Box>

        {/* NAVIGATION */}
        <List sx={{ px: 1 }}>
          {menuItems.map((item) => (
            <ListItemButton
              key={item.text}
              selected={item.active}
              onClick={() => {
                if (item.text === "Dashboard") {
                  navigate("/dashboard");
                }

                if (item.text === "Employees") {
                  navigate("/employees");
                }
              }}
              sx={{
                borderRadius: 2,
                mb: 0.5,
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 42,
                  color: item.active
                    ? "primary.main"
                    : "text.secondary",
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

        {/* LOGOUT */}
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
            <ListItemIcon sx={{ minWidth: 42 }}>
              <LogoutIcon />
            </ListItemIcon>

            <ListItemText primary="Logout" />
          </ListItemButton>
        </Box>
      </Drawer>

      {/* MAIN CONTENT */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: "#f7f8fa",
          minHeight: "100vh",
        }}
      >
        <Container
          maxWidth="xl"
          sx={{
            py: 4,
            px: {
              xs: 2,
              md: 4,
            },
          }}
        >
          {/* HEADER */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 4,
            }}
          >
            <Box>
              <Typography
                variant="h4"
                fontWeight="bold"
                sx={{ mb: 0.5 }}
              >
                Manager Dashboard
              </Typography>

              <Typography color="text.secondary">
                Monitor your restaurant attendance and
                workforce.
              </Typography>
            </Box>

            <Avatar
              sx={{
                width: 48,
                height: 48,
                bgcolor: "primary.main",
              }}
            >
              M
            </Avatar>
          </Box>

          {/* STATISTICS CARDS */}
          <Grid container spacing={3}>
            {cards.map((card) => (
              <Grid
                key={card.title}
                size={{
                  xs: 12,
                  sm: 6,
                  lg: 4,
                }}
              >
                <Card
                  elevation={0}
                  sx={{
                    border: "1px solid #e4e7eb",
                    borderRadius: 3,
                    height: "100%",
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                      }}
                    >
                      <Box>
                        <Typography
                          color="text.secondary"
                          variant="body2"
                          fontWeight="500"
                        >
                          {card.title}
                        </Typography>

                        <Typography
                          variant="h3"
                          fontWeight="bold"
                          sx={{ mt: 1 }}
                        >
                          {card.value}
                        </Typography>

                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mt: 1 }}
                        >
                          {card.description}
                        </Typography>
                      </Box>

                      <Avatar
                        sx={{
                          bgcolor: "primary.light",
                          color: "primary.main",
                          width: 48,
                          height: 48,
                        }}
                      >
                        {card.icon}
                      </Avatar>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* RESTAURANT OVERVIEW */}
          <Card
            elevation={0}
            sx={{
              mt: 4,
              border: "1px solid #e4e7eb",
              borderRadius: 3,
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <RestaurantIcon color="primary" />

                <Box>
                  <Typography
                    variant="h6"
                    fontWeight="bold"
                  >
                    Restaurant Overview
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    {data.total_restaurants} restaurant(s)
                    currently registered in TimeTap.
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Container>
      </Box>
    </Box>
  );
}

export default Dashboard;