import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  TextField,
  Typography,
} from "@mui/material";

import LockOutlinedIcon from "@mui/icons-material/LockOutlined";

import { login } from "../../services/authService";

function decodeToken(token) {
  try {
    const payload = token.split(".")[1];

    const decodedPayload = atob(
      payload.replace(/-/g, "+").replace(/_/g, "/")
    );

    return JSON.parse(decodedPayload);
  } catch (error) {
    console.error("Failed to decode token:", error);
    return null;
  }
}

function Login() {
  const navigate = useNavigate();

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

      localStorage.setItem(
        "access_token",
        data.access_token
      );

      const user = decodeToken(data.access_token);

      if (!user) {
        throw new Error(
          "Unable to read user information."
        );
      }

      if (user.role === "Manager") {
        navigate("/dashboard");
      } else {
        navigate("/employee-dashboard");
      }
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          err.message ||
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
              sx={{
                width: "100%",
                mb: 2,
              }}
            >
              {error}
            </Alert>
          )}

          <Box
            component="form"
            onSubmit={handleLogin}
            sx={{
              width: "100%",
            }}
          >
            <TextField
              fullWidth
              required
              label="Email"
              margin="normal"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
            />

            <TextField
              fullWidth
              required
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
              sx={{
                mt: 3,
              }}
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

            <Typography
              textAlign="center"
              color="text.secondary"
              sx={{ mt: 3 }}
            >
              Don't have an account?
            </Typography>

            <Button
              fullWidth
              variant="outlined"
              sx={{ mt: 1 }}
              onClick={() => navigate("/register")}
            >
              Register as Employee
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}

export default Login;