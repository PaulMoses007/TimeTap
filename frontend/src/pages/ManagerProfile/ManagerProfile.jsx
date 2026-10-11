import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Typography,
  Divider,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import api from "../../api/axios";

function ManagerProfile() {
  const [manager, setManager] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await api.get("/employees/me");
        setManager(response.data);
      } catch (error) {
        console.error("Failed to load manager profile:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  if (loading) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!manager) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography color="error">
          Unable to load manager profile.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" sx={{ mb: 1 }}>
        My Profile
      </Typography>

      <Typography color="text.secondary" sx={{ mb: 3 }}>
        View your manager account information.
      </Typography>

      <Card sx={{ maxWidth: 800 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
            <PersonIcon
              sx={{ fontSize: 50, mr: 2, color: "primary.main" }}
            />

            <Box>
              <Typography variant="h5">
                {manager.first_name} {manager.last_name}
              </Typography>

              <Typography color="text.secondary">
                {manager.role}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ mb: 3 }} />

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 3,
            }}
          >
            <Box>
              <Typography color="text.secondary">Manager ID</Typography>
              <Typography variant="body1">
                {manager.employee_id}
              </Typography>
            </Box>

            <Box>
              <Typography color="text.secondary">Role</Typography>
              <Typography variant="body1">
                {manager.role}
              </Typography>
            </Box>

            <Box>
              <Typography color="text.secondary">Email</Typography>
              <Typography variant="body1">
                {manager.email}
              </Typography>
            </Box>

            <Box>
              <Typography color="text.secondary">Phone</Typography>
              <Typography variant="body1">
                {manager.phone || "Not provided"}
              </Typography>
            </Box>

            <Box>
              <Typography color="text.secondary">Restaurant</Typography>
              <Typography variant="body1">
                {manager.restaurant_name || "Not assigned"}
              </Typography>
            </Box>

            <Box>
              <Typography color="text.secondary">Status</Typography>
              <Typography variant="body1">
                {manager.is_active ? "Active" : "Inactive"}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

export default ManagerProfile;