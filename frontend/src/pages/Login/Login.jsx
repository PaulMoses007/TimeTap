import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Container,
  Divider,
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
      payload
        .replace(/-/g, "+")
        .replace(/_/g, "/")
    );

    return JSON.parse(decodedPayload);

  } catch (error) {

    console.error(
      "Failed to decode token:",
      error
    );

    return null;
  }
}


function Login() {

  const navigate = useNavigate();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");


  // ==================================================
  // LOGIN
  // ==================================================

  const handleLogin = async (e) => {

    e.preventDefault();

    setError("");

    setLoading(true);

    try {

      const data =
        await login(
          email,
          password
        );


      localStorage.setItem(
        "access_token",
        data.access_token
      );


      const user =
        decodeToken(
          data.access_token
        );


      if (!user) {

        throw new Error(
          "Unable to read user information."
        );
      }


      // ----------------------------------------------
      // MANAGER
      // ----------------------------------------------

      if (
        user.role === "Manager"
      ) {

        navigate(
          "/dashboard"
        );

      }

      // ----------------------------------------------
      // EMPLOYEE
      // ----------------------------------------------

      else {

        navigate(
          "/employee-dashboard"
        );

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


  // ==================================================
  // PAGE
  // ==================================================

  return (

    <Container maxWidth="sm">

      <Paper
        elevation={8}
        sx={{
          mt: 10,
          mb: 6,
          p: 5,
          borderRadius: 4,
        }}
      >

        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
        >

          {/* ==========================================
              LOGO
          ========================================== */}

          <Avatar
            sx={{
              bgcolor:
                "primary.main",
              mb: 2,
            }}
          >
            <LockOutlinedIcon />
          </Avatar>


          {/* ==========================================
              TITLE
          ========================================== */}

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
            Restaurant Attendance
            System
          </Typography>


          {/* ==========================================
              ERROR
          ========================================== */}

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


          {/* ==========================================
              LOGIN FORM
          ========================================== */}

          <Box
            component="form"
            onSubmit={handleLogin}
            sx={{
              width: "100%",
            }}
          >

            {/* EMAIL */}

            <TextField
              fullWidth
              required
              label="Email"
              margin="normal"
              value={email}
              onChange={(e) =>
                setEmail(
                  e.target.value
                )
              }
            />


            {/* PASSWORD */}

            <TextField
              fullWidth
              required
              type="password"
              label="Password"
              margin="normal"
              value={password}
              onChange={(e) =>
                setPassword(
                  e.target.value
                )
              }
            />


            {/* LOGIN */}

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


            {/* ========================================
                EMPLOYEE REGISTRATION
            ======================================== */}

            <Typography
              textAlign="center"
              color="text.secondary"
              sx={{
                mt: 3,
              }}
            >
              Don't have an employee
              account?
            </Typography>


            <Button
              fullWidth
              variant="outlined"
              sx={{
                mt: 1,
              }}
              onClick={() =>
                navigate(
                  "/register"
                )
              }
            >
              Register as Employee
            </Button>


            <Divider
              sx={{
                my: 3,
              }}
            />


            {/* ========================================
                MANAGER REGISTRATION
            ======================================== */}

            <Typography
              textAlign="center"
              color="text.secondary"
            >
              Are you a restaurant manager?
            </Typography>


            <Button
              fullWidth
              variant="outlined"
              color="secondary"
              sx={{
                mt: 1,
              }}
              onClick={() =>
                navigate(
                  "/register-manager"
                )
              }
            >
              Create Manager Account
            </Button>

          </Box>

        </Box>

      </Paper>

    </Container>

  );
}


export default Login;