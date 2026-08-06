import { useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Container,
  Paper,
  TextField,
  Typography,
  Alert,
  CircularProgress,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";

import { login } from "../../services/authService";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const data = await login(email, password);

      // Save JWT Token
      localStorage.setItem(
        "access_token",
        data.access_token
      );

      alert("Login successful!");

      // Redirect to Dashboard
      window.location.href = "/dashboard";

    } catch (err) {

      setError(
        err.response?.data?.detail ||
        "Invalid email or password."
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
          mt: 10,
          p: 5,
          borderRadius: 4,
        }}
      >
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
        >
          <Avatar
            sx={{
              bgcolor: "primary.main",
              mb: 2,
            }}
          >
            <LockOutlinedIcon />
          </Avatar>

          <Typography
            variant="h4"
            fontWeight="bold"
            gutterBottom
          >
            TimeTap
          </Typography>

          <Typography
            color="text.secondary"
            mb={3}
          >
            Restaurant Attendance System
          </Typography>

          {error && (
            <Alert
              severity="error"
              sx={{ width: "100%", mb: 2 }}
            >
              {error}
            </Alert>
          )}

          <Box
            component="form"
            onSubmit={handleLogin}
            sx={{ width: "100%" }}
          >
            <TextField
              fullWidth
              label="Email"
              margin="normal"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
            />

            <TextField
              fullWidth
              type="password"
              label="Password"
              margin="normal"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
            />

            <Button
              fullWidth
              variant="contained"
              size="large"
              sx={{ mt: 3 }}
              disabled={loading}
              type="submit"
            >
              {loading ? (
                <CircularProgress
                  size={24}
                  color="inherit"
                />
              ) : (
                "Login"
              )}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}

export default Login;