import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Divider,
  TextField,
  Button,
  Avatar,
  Alert,
  CircularProgress,
} from "@mui/material";

import SaveIcon from "@mui/icons-material/Save";
import api from "../../api/axios";
import ManagerSidebar from "../../components/ManagerSidebar";

function Settings() {
  const [manager, setManager] = useState(null);
  const [loadingManager, setLoadingManager] = useState(true);
  const [managerError, setManagerError] = useState("");

  const [restaurant, setRestaurant] = useState(null);
  const [loadingRestaurant, setLoadingRestaurant] = useState(true);
  const [restaurantError, setRestaurantError] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    const loadManager = async () => {
      try {
        setLoadingManager(true);
        setManagerError("");

        const response = await api.get("/employees/me");
        setManager(response.data);
      } catch (error) {
        console.error("Failed to load manager information:", error);

        setManagerError(
          error.response?.data?.detail ||
            "Unable to load manager information."
        );
      } finally {
        setLoadingManager(false);
      }
    };

    loadManager();
  }, []);

  useEffect(() => {
    const loadRestaurant = async () => {
      try {
        setLoadingRestaurant(true);
        setRestaurantError("");

        const response = await api.get("/restaurants/");
        const restaurants = response.data;

        if (restaurants && restaurants.length > 0) {
          setRestaurant(restaurants[0]);
        } else {
          setRestaurant(null);
          setRestaurantError("No restaurant has been created yet.");
        }
      } catch (error) {
        console.error("Failed to load restaurant information:", error);

        setRestaurantError(
          error.response?.data?.detail ||
            "Unable to load restaurant information."
        );
      } finally {
        setLoadingRestaurant(false);
      }
    };

    loadRestaurant();
  }, []);

  const getInitials = () => {
    if (!manager) {
      return "M";
    }

    const first = manager.first_name?.charAt(0) || "";
    const last = manager.last_name?.charAt(0) || "";

    return `${first}${last}`.toUpperCase() || "M";
  };

  const getFullName = () => {
    if (!manager) {
      return "Manager";
    }

    return `${manager.first_name || ""} ${
      manager.last_name || ""
    }`.trim();
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
    } catch (error) {
      console.error("Failed to change password:", error);

      setPasswordError(
        error.response?.data?.detail ||
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

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        bgcolor: "#f7f8fa",
      }}
    >
      <ManagerSidebar activePage="settings" />

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
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h4"
            fontWeight="bold"
          >
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
              {getInitials()}
            </Avatar>

            <Box>
              <Typography
                variant="h6"
                fontWeight="bold"
              >
                Manager Account
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
              >
                Manage your manager account information.
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {loadingManager ? (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                py: 3,
              }}
            >
              <CircularProgress size={24} />

              <Typography color="text.secondary">
                Loading manager information...
              </Typography>
            </Box>
          ) : managerError ? (
            <Alert severity="error" sx={{ mb: 3 }}>
              {managerError}
            </Alert>
          ) : (
            <>
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
                  value={getFullName()}
                  fullWidth
                  InputProps={{ readOnly: true }}
                />

                <TextField
                  label="Role"
                  value={manager?.role || ""}
                  fullWidth
                  disabled
                />

                <TextField
                  label="Email"
                  value={manager?.email || ""}
                  fullWidth
                  InputProps={{ readOnly: true }}
                />

                <TextField
                  label="Employee ID"
                  value={manager?.employee_id || ""}
                  fullWidth
                  disabled
                />

                <TextField
                  label="Phone"
                  value={manager?.phone || ""}
                  fullWidth
                  InputProps={{ readOnly: true }}
                />

                <TextField
                  label="Account Status"
                  value={
                    manager?.is_active
                      ? "Active"
                      : "Inactive"
                  }
                  fullWidth
                  disabled
                />
              </Box>

              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                sx={{ mt: 3 }}
                disabled
              >
                Save Account
              </Button>
            </>
          )}
        </Paper>

        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 3,
            border: "1px solid #e5e7eb",
            borderRadius: 3,
          }}
        >
          <Typography
            variant="h6"
            fontWeight="bold"
          >
            Restaurant Settings
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mt: 0.5,
              mb: 3,
            }}
          >
            Configure the restaurant information used by TimeTap.
          </Typography>

          <Divider sx={{ mb: 3 }} />

          {loadingRestaurant ? (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                py: 3,
              }}
            >
              <CircularProgress size={24} />

              <Typography color="text.secondary">
                Loading restaurant information...
              </Typography>
            </Box>
          ) : restaurantError ? (
            <Alert severity="warning" sx={{ mb: 3 }}>
              {restaurantError}
            </Alert>
          ) : restaurant ? (
            <>
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
                  value={restaurant.name || ""}
                  fullWidth
                  InputProps={{ readOnly: true }}
                />

                <TextField
                  label="Phone"
                  value={restaurant.phone || ""}
                  fullWidth
                  InputProps={{ readOnly: true }}
                />

                <TextField
                  label="Email"
                  value={restaurant.email || ""}
                  fullWidth
                  InputProps={{ readOnly: true }}
                />

                <TextField
                  label="Address"
                  value={restaurant.address || ""}
                  fullWidth
                  InputProps={{ readOnly: true }}
                />

                <TextField
                  label="Restaurant ID"
                  value={restaurant.id || ""}
                  fullWidth
                  disabled
                />

                <TextField
                  label="Status"
                  value={
                    restaurant.is_active
                      ? "Active"
                      : "Inactive"
                  }
                  fullWidth
                  disabled
                />
              </Box>

              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                sx={{ mt: 3 }}
                disabled
              >
                Save Restaurant
              </Button>
            </>
          ) : null}
        </Paper>

        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 3,
            border: "1px solid #e5e7eb",
            borderRadius: 3,
          }}
        >
          <Typography
            variant="h6"
            fontWeight="bold"
          >
            Security
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mt: 0.5,
              mb: 3,
            }}
          >
            Change your manager account password.
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
              fullWidth
              helperText="Minimum 8 characters"
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
              fullWidth
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
        </Paper>

        <Paper
          elevation={0}
          sx={{
            p: 3,
            border: "1px solid #e5e7eb",
            borderRadius: 3,
          }}
        >
          <Typography
            variant="h6"
            fontWeight="bold"
          >
            System Information
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mt: 0.5,
              mb: 3,
            }}
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
              <Typography
                variant="body2"
                color="text.secondary"
              >
                Application
              </Typography>

              <Typography fontWeight="bold">
                TimeTap
              </Typography>
            </Box>

            <Box>
              <Typography
                variant="body2"
                color="text.secondary"
              >
                Version
              </Typography>

              <Typography fontWeight="bold">
                1.0.0
              </Typography>
            </Box>

            <Box>
              <Typography
                variant="body2"
                color="text.secondary"
              >
                Attendance System
              </Typography>

              <Typography fontWeight="bold">
                QR / Manual Check-in
              </Typography>
            </Box>

            <Box>
              <Typography
                variant="body2"
                color="text.secondary"
              >
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