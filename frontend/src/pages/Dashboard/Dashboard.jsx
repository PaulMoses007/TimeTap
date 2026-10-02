import { useEffect, useState } from "react";

import {
  Alert,
  Avatar,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Grid,
  Typography,
} from "@mui/material";

import AccessTimeIcon from "@mui/icons-material/AccessTime";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PersonOffIcon from "@mui/icons-material/PersonOff";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import GroupsIcon from "@mui/icons-material/Groups";

import { getDashboard } from "../../services/dashboardService";
import ManagerSidebar from "../../components/ManagerSidebar";

function Dashboard() {
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
        <Alert severity="error">
          {error}
        </Alert>
      </Container>
    );
  }

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
      {/* COMMON MANAGER SIDEBAR */}
      <ManagerSidebar activePage="dashboard" />

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