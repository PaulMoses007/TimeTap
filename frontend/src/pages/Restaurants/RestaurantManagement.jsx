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
  Container,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  TextField,
  Typography,
} from "@mui/material";

import AccessTimeIcon from "@mui/icons-material/AccessTime";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import AccessAlarmIcon from "@mui/icons-material/AccessAlarm";
import AssessmentIcon from "@mui/icons-material/Assessment";
import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from "@mui/icons-material/Logout";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";

import {
  getRestaurants,
} from "../../services/restaurantService";

const drawerWidth = 240;

function RestaurantManagement() {
  const navigate = useNavigate();

  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
  });

  useEffect(() => {
    loadRestaurants();
  }, []);

  const loadRestaurants = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getRestaurants();

      setRestaurants(
        Array.isArray(data) ? data : []
      );
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Failed to load restaurants."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    try {
      const response = await fetch(
        "/api/restaurants/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem(
              "access_token"
            )}`,
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Failed to create restaurant."
        );
      }

      setFormData({
        name: "",
        address: "",
        phone: "",
        email: "",
      });

      setShowForm(false);

      await loadRestaurants();
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Failed to create restaurant."
      );
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    window.location.href = "/";
  };

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

        {/* USER */}
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
          <ListItemButton
            onClick={() =>
              navigate("/dashboard")
            }
            sx={{
              borderRadius: 2,
              mb: 0.5,
            }}
          >
            <ListItemIcon sx={{ minWidth: 42 }}>
              <DashboardIcon />
            </ListItemIcon>

            <ListItemText primary="Dashboard" />
          </ListItemButton>

          <ListItemButton
            onClick={() =>
              navigate("/employees")
            }
            sx={{
              borderRadius: 2,
              mb: 0.5,
            }}
          >
            <ListItemIcon sx={{ minWidth: 42 }}>
              <PeopleIcon />
            </ListItemIcon>

            <ListItemText primary="Employees" />
          </ListItemButton>

          <ListItemButton
            onClick={() =>
              navigate("/manager-attendance")
            }
            sx={{
              borderRadius: 2,
              mb: 0.5,
            }}
          >
            <ListItemIcon sx={{ minWidth: 42 }}>
              <AccessAlarmIcon />
            </ListItemIcon>

            <ListItemText primary="Attendance" />
          </ListItemButton>

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
              <RestaurantIcon />
            </ListItemIcon>

            <ListItemText primary="Restaurants" />
          </ListItemButton>

          <ListItemButton
            onClick={() =>
              navigate("/reports")
            }
            sx={{
              borderRadius: 2,
              mb: 0.5,
            }}
          >
            <ListItemIcon sx={{ minWidth: 42 }}>
              <AssessmentIcon />
            </ListItemIcon>

            <ListItemText primary="Reports" />
          </ListItemButton>

          <ListItemButton
            onClick={() =>
              navigate("/settings")
            }
            sx={{
              borderRadius: 2,
              mb: 0.5,
            }}
          >
            <ListItemIcon sx={{ minWidth: 42 }}>
              <SettingsIcon />
            </ListItemIcon>

            <ListItemText primary="Settings" />
          </ListItemButton>
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
              >
                Restaurants
              </Typography>

              <Typography
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                Manage restaurants registered in
                TimeTap.
              </Typography>
            </Box>

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() =>
                setShowForm(!showForm)
              }
            >
              Add Restaurant
            </Button>
          </Box>

          {/* ERROR */}
          {error && (
            <Alert
              severity="error"
              sx={{ mb: 3 }}
            >
              {error}
            </Alert>
          )}

          {/* ADD RESTAURANT FORM */}
          {showForm && (
            <Card
              elevation={0}
              sx={{
                mb: 4,
                border:
                  "1px solid #e4e7eb",
                borderRadius: 3,
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography
                  variant="h6"
                  fontWeight="bold"
                  sx={{ mb: 3 }}
                >
                  Add New Restaurant
                </Typography>

                <Box
                  component="form"
                  onSubmit={handleSubmit}
                >
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
                      required
                      label="Restaurant Name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                    />

                    <TextField
                      required
                      label="Address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                    />

                    <TextField
                      required
                      label="Phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                    />

                    <TextField
                      required
                      type="email"
                      label="Email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      gap: 2,
                      mt: 3,
                    }}
                  >
                    <Button
                      type="submit"
                      variant="contained"
                    >
                      Save Restaurant
                    </Button>

                    <Button
                      variant="outlined"
                      onClick={() =>
                        setShowForm(false)
                      }
                    >
                      Cancel
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          )}

          {/* LOADING */}
          {loading ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                py: 8,
              }}
            >
              <CircularProgress />
            </Box>
          ) : restaurants.length === 0 ? (
            /* EMPTY STATE */
            <Paper
              elevation={0}
              sx={{
                p: 6,
                textAlign: "center",
                border:
                  "1px solid #e4e7eb",
                borderRadius: 3,
              }}
            >
              <RestaurantIcon
                sx={{
                  fontSize: 60,
                  color: "text.secondary",
                  mb: 2,
                }}
              />

              <Typography
                variant="h6"
                fontWeight="bold"
              >
                No restaurants registered
              </Typography>

              <Typography
                color="text.secondary"
                sx={{ mt: 1, mb: 3 }}
              >
                Add your first restaurant to
                start using TimeTap.
              </Typography>

              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() =>
                  setShowForm(true)
                }
              >
                Add Restaurant
              </Button>
            </Paper>
          ) : (
            /* RESTAURANT LIST */
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  md: "1fr 1fr",
                  lg: "1fr 1fr 1fr",
                },
                gap: 3,
              }}
            >
              {restaurants.map(
                (restaurant) => (
                  <Card
                    key={restaurant.id}
                    elevation={0}
                    sx={{
                      border:
                        "1px solid #e4e7eb",
                      borderRadius: 3,
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
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
                            bgcolor:
                              "primary.light",
                            color:
                              "primary.main",
                          }}
                        >
                          <RestaurantIcon />
                        </Avatar>

                        <Box>
                          <Typography
                            variant="h6"
                            fontWeight="bold"
                          >
                            {restaurant.name}
                          </Typography>

                          <Typography
                            variant="body2"
                            color="text.secondary"
                          >
                            Restaurant #
                            {restaurant.id}
                          </Typography>
                        </Box>
                      </Box>

                      <Divider sx={{ mb: 2 }} />

                      <Typography
                        variant="body2"
                        sx={{ mb: 1 }}
                      >
                        <strong>
                          Address:
                        </strong>{" "}
                        {restaurant.address ||
                          "-"}
                      </Typography>

                      <Typography
                        variant="body2"
                        sx={{ mb: 1 }}
                      >
                        <strong>
                          Phone:
                        </strong>{" "}
                        {restaurant.phone ||
                          "-"}
                      </Typography>

                      <Typography
                        variant="body2"
                        sx={{ mb: 2 }}
                      >
                        <strong>
                          Email:
                        </strong>{" "}
                        {restaurant.email ||
                          "-"}
                      </Typography>

                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={
                          <DeleteIcon />
                        }
                        disabled
                        fullWidth
                      >
                        Delete
                      </Button>
                    </CardContent>
                  </Card>
                )
              )}
            </Box>
          )}
        </Container>
      </Box>
    </Box>
  );
}

export default RestaurantManagement;