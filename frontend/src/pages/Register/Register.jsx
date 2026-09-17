import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from "@mui/material";

import PersonAddIcon from "@mui/icons-material/PersonAdd";

import { registerEmployee } from "../../services/registerService";
import { getRestaurants } from "../../services/restaurantService";

function Register() {
  const navigate = useNavigate();

  const [restaurants, setRestaurants] = useState([]);
  const [loadingRestaurants, setLoadingRestaurants] = useState(true);

  const [formData, setFormData] = useState({
    restaurant_id: "",
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    role: "Employee",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Load restaurants
  useEffect(() => {
    const loadRestaurants = async () => {
      try {
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
        setLoadingRestaurants(false);
      }
    };

    loadRestaurants();
  }, []);

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
    setSuccess("");
    setLoading(true);

    try {
      await registerEmployee({
        ...formData,
        restaurant_id: Number(formData.restaurant_id),
      });

      setSuccess(
        "Registration successful! Your account is waiting for manager approval."
      );

      setFormData({
        restaurant_id: "",
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        role: "Employee",
        password: "",
      });
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper
        elevation={8}
        sx={{
          mt: 6,
          mb: 6,
          p: {
            xs: 3,
            sm: 5,
          },
          borderRadius: 4,
        }}
      >
        {/* HEADER */}
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
        >
          <Avatar
            sx={{
              bgcolor: "primary.main",
              mb: 2,
              width: 56,
              height: 56,
            }}
          >
            <PersonAddIcon />
          </Avatar>

          <Typography
            variant="h4"
            fontWeight="bold"
          >
            Join TimeTap
          </Typography>

          <Typography
            color="text.secondary"
            textAlign="center"
            sx={{
              mt: 1,
              mb: 3,
            }}
          >
            Register as a restaurant employee
          </Typography>
        </Box>

        {/* ERROR */}
        {error && (
          <Alert
            severity="error"
            sx={{ mb: 2 }}
          >
            {error}
          </Alert>
        )}

        {/* SUCCESS */}
        {success && (
          <Alert
            severity="success"
            sx={{ mb: 2 }}
          >
            {success}
          </Alert>
        )}

        {/* FORM */}
        <Box
          component="form"
          onSubmit={handleSubmit}
        >
          {/* RESTAURANT */}
          <FormControl
            fullWidth
            required
            margin="normal"
          >
            <InputLabel>Restaurant</InputLabel>

            <Select
              label="Restaurant"
              name="restaurant_id"
              value={formData.restaurant_id}
              onChange={handleChange}
              disabled={loadingRestaurants}
            >
              {restaurants
                .filter(
                  (restaurant) =>
                    restaurant.is_active
                )
                .map((restaurant) => (
                  <MenuItem
                    key={restaurant.id}
                    value={restaurant.id}
                  >
                    {restaurant.name}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            required
            label="First Name"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            margin="normal"
          />

          <TextField
            fullWidth
            required
            label="Last Name"
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
            margin="normal"
          />

          <TextField
            fullWidth
            required
            type="email"
            label="Email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            margin="normal"
          />

          <TextField
            fullWidth
            required
            label="Phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            margin="normal"
          />

          <FormControl
            fullWidth
            required
            margin="normal"
          >
            <InputLabel>Role</InputLabel>

            <Select
              label="Role"
              name="role"
              value={formData.role}
              onChange={handleChange}
            >
              <MenuItem value="Employee">
                Employee
              </MenuItem>

              <MenuItem value="Chef">
                Chef
              </MenuItem>

              <MenuItem value="Waiter">
                Waiter
              </MenuItem>

              <MenuItem value="Cashier">
                Cashier
              </MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            required
            type="password"
            label="Password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            margin="normal"
          />

          <Button
            fullWidth
            type="submit"
            variant="contained"
            size="large"
            disabled={
              loading ||
              loadingRestaurants ||
              restaurants.length === 0
            }
            sx={{
              mt: 3,
              py: 1.5,
            }}
          >
            {loading ? (
              <CircularProgress
                size={24}
                color="inherit"
              />
            ) : (
              "Create Account"
            )}
          </Button>

          <Button
            fullWidth
            variant="text"
            sx={{ mt: 1 }}
            onClick={() => navigate("/")}
          >
            Already have an account? Login
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}

export default Register;