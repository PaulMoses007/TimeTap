import { useEffect, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";

import {
  createEmployee,
  getEmployees,
  approveEmployee,
  rejectEmployee,
} from "../../services/employeeService";

function EmployeeList() {
  const [employees, setEmployees] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [openDialog, setOpenDialog] = useState(false);
  const [saving, setSaving] = useState(false);

  const [processingId, setProcessingId] = useState(null);

  const [successMessage, setSuccessMessage] = useState("");

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    role: "Employee",
    password: "",
  });

  const loadEmployees = async () => {
    try {
      setError("");

      const data = await getEmployees();

      setEmployees(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Failed to load employees."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleOpenDialog = () => {
    setFormData({
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      role: "Employee",
      password: "",
    });

    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    if (!saving) {
      setOpenDialog(false);
    }
  };

  const handleCreateEmployee = async (event) => {
    event.preventDefault();

    setSaving(true);
    setError("");

    try {
      await createEmployee(formData);

      setOpenDialog(false);

      setSuccessMessage(
        "Employee created successfully."
      );

      await loadEmployees();
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Failed to create employee."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async (employeeId) => {
    setProcessingId(employeeId);
    setError("");

    try {
      await approveEmployee(employeeId);

      setSuccessMessage(
        "Employee approved successfully."
      );

      await loadEmployees();
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Failed to approve employee."
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (employeeId) => {
    setProcessingId(employeeId);
    setError("");

    try {
      await rejectEmployee(employeeId);

      setSuccessMessage(
        "Employee rejected successfully."
      );

      await loadEmployees();
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Failed to reject employee."
      );
    } finally {
      setProcessingId(null);
    }
  };

  const getApprovalColor = (status) => {
    if (status === "Approved") {
      return "success";
    }

    if (status === "Rejected") {
      return "error";
    }

    return "warning";
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#f7f8fa",
        py: 4,
        px: {
          xs: 2,
          md: 4,
        },
      }}
    >
      <Box sx={{ maxWidth: 1400, mx: "auto" }}>
        {/* HEADER */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: {
              xs: "flex-start",
              sm: "center",
            },
            flexDirection: {
              xs: "column",
              sm: "row",
            },
            gap: 2,
            mb: 4,
          }}
        >
          <Box>
            <Typography
              variant="h4"
              fontWeight="bold"
            >
              Employees
            </Typography>

            <Typography
              color="text.secondary"
              sx={{ mt: 0.5 }}
            >
              Manage restaurant employees and their accounts.
            </Typography>
          </Box>

          <Button
            variant="contained"
            size="large"
            startIcon={<AddIcon />}
            onClick={handleOpenDialog}
          >
            Add Employee
          </Button>
        </Box>

        {/* ERROR */}
        {error && (
          <Alert
            severity="error"
            sx={{ mb: 3 }}
            onClose={() => setError("")}
          >
            {error}
          </Alert>
        )}

        {/* EMPLOYEE TABLE */}
        <Card
          elevation={0}
          sx={{
            border: "1px solid #e4e7eb",
            borderRadius: 3,
          }}
        >
          <CardContent sx={{ p: 0 }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <strong>ID</strong>
                    </TableCell>

                    <TableCell>
                      <strong>Employee ID</strong>
                    </TableCell>

                    <TableCell>
                      <strong>Name</strong>
                    </TableCell>

                    <TableCell>
                      <strong>Email</strong>
                    </TableCell>

                    <TableCell>
                      <strong>Phone</strong>
                    </TableCell>

                    <TableCell>
                      <strong>Role</strong>
                    </TableCell>

                    <TableCell>
                      <strong>Status</strong>
                    </TableCell>

                    <TableCell>
                      <strong>Approval</strong>
                    </TableCell>

                    <TableCell align="center">
                      <strong>Actions</strong>
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {employees.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        align="center"
                        sx={{ py: 6 }}
                      >
                        <Typography
                          color="text.secondary"
                        >
                          No employees found.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    employees.map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell>
                          {employee.id}
                        </TableCell>

                        <TableCell>
                          {employee.employee_id || "-"}
                        </TableCell>

                        <TableCell>
                          {employee.first_name}{" "}
                          {employee.last_name}
                        </TableCell>

                        <TableCell>
                          {employee.email}
                        </TableCell>

                        <TableCell>
                          {employee.phone}
                        </TableCell>

                        <TableCell>
                          {employee.role}
                        </TableCell>

                        <TableCell>
                          <Chip
                            label={
                              employee.is_active
                                ? "Active"
                                : "Inactive"
                            }
                            size="small"
                            color={
                              employee.is_active
                                ? "success"
                                : "default"
                            }
                          />
                        </TableCell>

                        <TableCell>
                          <Chip
                            label={
                              employee.approval_status
                            }
                            size="small"
                            color={getApprovalColor(
                              employee.approval_status
                            )}
                          />
                        </TableCell>

                        <TableCell align="center">
                          {employee.approval_status ===
                            "Pending" && (
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "center",
                                gap: 0.5,
                              }}
                            >
                              <Tooltip title="Approve employee">
                                <span>
                                  <IconButton
                                    color="success"
                                    onClick={() =>
                                      handleApprove(
                                        employee.id
                                      )
                                    }
                                    disabled={
                                      processingId ===
                                      employee.id
                                    }
                                  >
                                    {processingId ===
                                    employee.id ? (
                                      <CircularProgress
                                        size={22}
                                      />
                                    ) : (
                                      <CheckIcon />
                                    )}
                                  </IconButton>
                                </span>
                              </Tooltip>

                              <Tooltip title="Reject employee">
                                <span>
                                  <IconButton
                                    color="error"
                                    onClick={() =>
                                      handleReject(
                                        employee.id
                                      )
                                    }
                                    disabled={
                                      processingId ===
                                      employee.id
                                    }
                                  >
                                    <CloseIcon />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            </Box>
                          )}

                          {employee.approval_status !==
                            "Pending" && (
                            <Typography
                              variant="body2"
                              color="text.secondary"
                            >
                              —
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Box>

      {/* ADD EMPLOYEE DIALOG */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="sm"
      >
        <Box
          component="form"
          onSubmit={handleCreateEmployee}
        >
          <DialogTitle fontWeight="bold">
            Add New Employee
          </DialogTitle>

          <DialogContent>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 2 }}
            >
              Create an employee account for your restaurant.
            </Typography>

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
          </DialogContent>

          <DialogActions
            sx={{
              px: 3,
              pb: 3,
            }}
          >
            <Button
              onClick={handleCloseDialog}
              disabled={saving}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="contained"
              disabled={saving}
            >
              {saving ? (
                <CircularProgress
                  size={24}
                  color="inherit"
                />
              ) : (
                "Create Employee"
              )}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* SUCCESS MESSAGE */}
      <Snackbar
        open={Boolean(successMessage)}
        autoHideDuration={4000}
        onClose={() => setSuccessMessage("")}
        message={successMessage}
      />
    </Box>
  );
}

export default EmployeeList;