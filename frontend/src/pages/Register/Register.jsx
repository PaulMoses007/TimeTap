import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Container,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from "@mui/material";

import PersonAddIcon from "@mui/icons-material/PersonAdd";

import { registerEmployee } from "../../services/registerService";


function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    // Restaurant invitation
    invitation_code: "",

    // Personal information
    first_name: "",
    last_name: "",
    email: "",
    phone: "",

    // Role
    role: "Employee",
    custom_role: "",

    // Schedule
    schedule_type: "Flexible",
    shift_start: "",
    shift_end: "",

    // Authentication
    password: "",
  });

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");


  // ==================================================
  // HANDLE FORM CHANGES
  // ==================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };


  // ==================================================
  // HANDLE ROLE CHANGE
  // ==================================================

  const handleRoleChange = (event) => {
    const value = event.target.value;

    setFormData((previous) => ({
      ...previous,
      role: value,

      // Clear custom role when Other is not selected
      custom_role:
        value === "Other"
          ? previous.custom_role
          : "",
    }));
  };


  // ==================================================
  // HANDLE SCHEDULE TYPE
  // ==================================================

  const handleScheduleTypeChange = (event) => {
    const value = event.target.value;

    setFormData((previous) => ({
      ...previous,

      schedule_type: value,

      // Clear times when Flexible is selected
      shift_start:
        value === "Flexible"
          ? ""
          : previous.shift_start,

      shift_end:
        value === "Flexible"
          ? ""
          : previous.shift_end,
    }));
  };


  // ==================================================
  // SUBMIT REGISTRATION
  // ==================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");


    // --------------------------------------------------
    // Validate invitation code
    // --------------------------------------------------

    if (!formData.invitation_code.trim()) {
      setError(
        "Please enter the restaurant invitation code."
      );

      return;
    }


    // --------------------------------------------------
    // Validate personal information
    // --------------------------------------------------

    if (!formData.first_name.trim()) {
      setError("Please enter your first name.");

      return;
    }

    if (!formData.last_name.trim()) {
      setError("Please enter your last name.");

      return;
    }

    if (!formData.email.trim()) {
      setError("Please enter your email.");

      return;
    }

    if (!formData.phone.trim()) {
      setError("Please enter your phone number.");

      return;
    }


    // --------------------------------------------------
    // Validate custom role
    // --------------------------------------------------

    if (
      formData.role === "Other" &&
      !formData.custom_role.trim()
    ) {
      setError(
        "Please enter your job role."
      );

      return;
    }


    // --------------------------------------------------
    // Validate fixed schedule
    // --------------------------------------------------

    if (
      formData.schedule_type === "Fixed" &&
      (
        !formData.shift_start ||
        !formData.shift_end
      )
    ) {
      setError(
        "Please enter both shift start and shift end times for a fixed schedule."
      );

      return;
    }


    // --------------------------------------------------
    // Validate fixed schedule time order
    // --------------------------------------------------

    if (
      formData.schedule_type === "Fixed" &&
      formData.shift_start &&
      formData.shift_end &&
      formData.shift_start >= formData.shift_end
    ) {
      setError(
        "Shift end time must be later than shift start time."
      );

      return;
    }


    // --------------------------------------------------
    // Prepare final role
    // --------------------------------------------------

    const finalRole =
      formData.role === "Other"
        ? formData.custom_role.trim()
        : formData.role;


    setLoading(true);


    try {

      await registerEmployee({

        // Restaurant is identified by invitation
        invitation_code:
          formData.invitation_code
            .trim()
            .toUpperCase(),

        first_name:
          formData.first_name.trim(),

        last_name:
          formData.last_name.trim(),

        email:
          formData.email.trim(),

        phone:
          formData.phone.trim(),

        role: finalRole,

        schedule_type:
          formData.schedule_type,

        shift_start:
          formData.schedule_type === "Fixed"
            ? formData.shift_start
            : null,

        shift_end:
          formData.schedule_type === "Fixed"
            ? formData.shift_end
            : null,

        password:
          formData.password,
      });


      setSuccess(
        "Registration successful! Your account is waiting for manager approval."
      );


      // --------------------------------------------------
      // Reset form
      // --------------------------------------------------

      setFormData({
        invitation_code: "",

        first_name: "",

        last_name: "",

        email: "",

        phone: "",

        role: "Employee",

        custom_role: "",

        schedule_type: "Flexible",

        shift_start: "",

        shift_end: "",

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


  // ==================================================
  // PAGE
  // ==================================================

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


          {/* ========================================
              RESTAURANT INVITATION
          ======================================== */}

          <TextField
            fullWidth
            required
            label="Restaurant Invitation Code"
            name="invitation_code"
            value={formData.invitation_code}
            onChange={handleChange}
            margin="normal"
            placeholder="TT-IMNTZ7H3"
            helperText={
              "Enter the invitation code provided by your restaurant manager."
            }
          />


          {/* ========================================
              FIRST NAME
          ======================================== */}

          <TextField
            fullWidth
            required
            label="First Name"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            margin="normal"
          />


          {/* ========================================
              LAST NAME
          ======================================== */}

          <TextField
            fullWidth
            required
            label="Last Name"
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
            margin="normal"
          />


          {/* ========================================
              EMAIL
          ======================================== */}

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


          {/* ========================================
              PHONE
          ======================================== */}

          <TextField
            fullWidth
            required
            label="Phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            margin="normal"
          />


          {/* ========================================
              ROLE
          ======================================== */}

          <FormControl
            fullWidth
            required
            margin="normal"
          >

            <InputLabel>
              Role
            </InputLabel>

            <Select
              label="Role"
              name="role"
              value={formData.role}
              onChange={handleRoleChange}
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

              <MenuItem value="Other">
                Other
              </MenuItem>

            </Select>

          </FormControl>


          {/* ========================================
              CUSTOM ROLE
          ======================================== */}

          {formData.role === "Other" && (

            <TextField
              fullWidth
              required
              label="Specify Your Role"
              name="custom_role"
              value={formData.custom_role}
              onChange={handleChange}
              margin="normal"
              placeholder="Example: Pizza Maker"
              helperText={
                "Enter your actual job position."
              }
            />

          )}


          {/* ========================================
              WORK SCHEDULE
          ======================================== */}

          <Typography
            variant="subtitle1"
            fontWeight="bold"
            sx={{
              mt: 3,
              mb: 1,
            }}
          >
            Work Schedule
          </Typography>


          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mb: 2,
            }}
          >
            Choose whether your working hours are
            fixed or flexible.
          </Typography>


          <FormControl
            fullWidth
            required
            margin="normal"
          >

            <InputLabel>
              Schedule Type
            </InputLabel>

            <Select
              label="Schedule Type"
              name="schedule_type"
              value={formData.schedule_type}
              onChange={handleScheduleTypeChange}
            >

              <MenuItem value="Flexible">
                Flexible
              </MenuItem>

              <MenuItem value="Fixed">
                Fixed
              </MenuItem>

            </Select>


            <FormHelperText>
              Flexible employees do not need to provide
              fixed working hours.
            </FormHelperText>

          </FormControl>


          {/* ========================================
              FIXED SCHEDULE
          ======================================== */}

          {formData.schedule_type === "Fixed" && (

            <>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  mt: 2,
                  mb: 1,
                }}
              >
                Enter your scheduled working hours in
                24-hour format.
              </Typography>


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

                {/* SHIFT START */}

                <TextField
                  fullWidth
                  required
                  label="Shift Start"
                  name="shift_start"
                  value={formData.shift_start}
                  onChange={handleChange}
                  margin="normal"
                  placeholder="11:00"
                  helperText="Example: 11:00"
                  inputProps={{
                    pattern: "[0-9]{2}:[0-9]{2}",
                  }}
                />


                {/* SHIFT END */}

                <TextField
                  fullWidth
                  required
                  label="Shift End"
                  name="shift_end"
                  value={formData.shift_end}
                  onChange={handleChange}
                  margin="normal"
                  placeholder="19:00"
                  helperText="Example: 19:00"
                  inputProps={{
                    pattern: "[0-9]{2}:[0-9]{2}",
                  }}
                />

              </Box>

            </>

          )}


          {/* ========================================
              PASSWORD
          ======================================== */}

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


          {/* ========================================
              CREATE ACCOUNT
          ======================================== */}

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
              "Create Account"
            )}

          </Button>


          {/* ========================================
              LOGIN
          ======================================== */}

          <Button
            fullWidth
            variant="text"
            sx={{
              mt: 1,
            }}
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