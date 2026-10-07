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

import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";

import api from "../../api/axios";


function RegisterManager() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
    confirm_password: "",
  });

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");


  // ==================================================
  // HANDLE INPUT
  // ==================================================

  const handleChange = (event) => {

    const {
      name,
      value,
    } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };


  // ==================================================
  // SUBMIT
  // ==================================================

  const handleSubmit = async (event) => {

    event.preventDefault();

    setError("");
    setSuccess("");


    // --------------------------------------------------
    // PASSWORD MATCH
    // --------------------------------------------------

    if (
      formData.password !==
      formData.confirm_password
    ) {

      setError(
        "Passwords do not match."
      );

      return;
    }


    // --------------------------------------------------
    // PASSWORD LENGTH
    // --------------------------------------------------

    if (
      formData.password.length < 6
    ) {

      setError(
        "Password must contain at least 6 characters."
      );

      return;
    }


    setLoading(true);


    try {

      await api.post(
        "/register/manager",
        {
          first_name:
            formData.first_name.trim(),

          last_name:
            formData.last_name.trim(),

          email:
            formData.email.trim(),

          phone:
            formData.phone.trim(),

          password:
            formData.password,
        }
      );


      setSuccess(
        "Manager account created successfully. You can now log in."
      );


      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        password: "",
        confirm_password: "",
      });


    } catch (err) {

      console.error(err);

      setError(
        err.response?.data?.detail ||
        "Failed to create manager account."
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
          mt: 8,
          mb: 6,
          p: {
            xs: 3,
            sm: 5,
          },
          borderRadius: 4,
        }}
      >

        {/* ==========================================
            HEADER
        ========================================== */}

        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
        >

          <Avatar
            sx={{
              bgcolor:
                "primary.main",
              mb: 2,
              width: 56,
              height: 56,
            }}
          >
            <ManageAccountsIcon />
          </Avatar>


          <Typography
            variant="h4"
            fontWeight="bold"
          >
            Create Manager Account
          </Typography>


          <Typography
            color="text.secondary"
            textAlign="center"
            sx={{
              mt: 1,
              mb: 3,
            }}
          >
            Create your TimeTap manager
            account before setting up
            your restaurant.
          </Typography>

        </Box>


        {/* ==========================================
            ERROR
        ========================================== */}

        {error && (

          <Alert
            severity="error"
            sx={{ mb: 2 }}
          >
            {error}
          </Alert>

        )}


        {/* ==========================================
            SUCCESS
        ========================================== */}

        {success && (

          <Alert
            severity="success"
            sx={{ mb: 2 }}
          >
            {success}
          </Alert>

        )}


        {/* ==========================================
            FORM
        ========================================== */}

        <Box
          component="form"
          onSubmit={handleSubmit}
        >

          {/* FIRST NAME */}

          <TextField
            fullWidth
            required
            label="First Name"
            name="first_name"
            value={
              formData.first_name
            }
            onChange={handleChange}
            margin="normal"
          />


          {/* LAST NAME */}

          <TextField
            fullWidth
            required
            label="Last Name"
            name="last_name"
            value={
              formData.last_name
            }
            onChange={handleChange}
            margin="normal"
          />


          {/* EMAIL */}

          <TextField
            fullWidth
            required
            type="email"
            label="Email"
            name="email"
            value={
              formData.email
            }
            onChange={handleChange}
            margin="normal"
          />


          {/* PHONE */}

          <TextField
            fullWidth
            required
            label="Phone"
            name="phone"
            value={
              formData.phone
            }
            onChange={handleChange}
            margin="normal"
          />


          {/* PASSWORD */}

          <TextField
            fullWidth
            required
            type="password"
            label="Password"
            name="password"
            value={
              formData.password
            }
            onChange={handleChange}
            margin="normal"
            helperText="Minimum 6 characters"
          />


          {/* CONFIRM PASSWORD */}

          <TextField
            fullWidth
            required
            type="password"
            label="Confirm Password"
            name="confirm_password"
            value={
              formData.confirm_password
            }
            onChange={handleChange}
            margin="normal"
          />


          {/* CREATE ACCOUNT */}

          <Button
            fullWidth
            type="submit"
            variant="contained"
            size="large"
            disabled={loading}
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

              "Create Manager Account"

            )}

          </Button>


          {/* LOGIN */}

          <Button
            fullWidth
            variant="text"
            sx={{
              mt: 1,
            }}
            onClick={() =>
              navigate("/")
            }
          >
            Already have an account?
            Login
          </Button>

        </Box>

      </Paper>

    </Container>
  );
}


export default RegisterManager;