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
import EditIcon from "@mui/icons-material/Edit";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

import {
  createEmployee,
  getEmployees,
  approveEmployee,
  rejectEmployee,
  updateEmployee,
  getEmployeeAttendance,
} from "../../services/employeeService";

import { getRestaurants } from "../../services/restaurantService";

import ManagerSidebar from "../../components/ManagerSidebar";


function EmployeeList() {
  const [employees, setEmployees] = useState([]);
  const [restaurants, setRestaurants] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [openDialog, setOpenDialog] = useState(false);
  const [saving, setSaving] = useState(false);

  const [processingId, setProcessingId] = useState(null);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [editRestaurantId, setEditRestaurantId] = useState("");

  const [successMessage, setSuccessMessage] = useState("");

  const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceError, setAttendanceError] = useState("");

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    role: "Employee",
    password: "",
  });


  // --------------------------------------------------
  // Load Restaurants
  // --------------------------------------------------

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
    }
  };


  // --------------------------------------------------
  // Load Employees
  // --------------------------------------------------

  const loadEmployees = async () => {
    try {
      setError("");

      const data = await getEmployees();

      setEmployees(
        Array.isArray(data) ? data : []
      );
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


  // --------------------------------------------------
  // Initial Load
  // --------------------------------------------------

  useEffect(() => {
    loadEmployees();
    loadRestaurants();
  }, []);


  // --------------------------------------------------
  // Form Change
  // --------------------------------------------------

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };


  // --------------------------------------------------
  // Add Employee Dialog
  // --------------------------------------------------

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


  // --------------------------------------------------
  // Create Employee
  // --------------------------------------------------

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


  // --------------------------------------------------
  // Approve Employee
  // --------------------------------------------------

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


  // --------------------------------------------------
  // Reject Employee
  // --------------------------------------------------

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


  // --------------------------------------------------
  // Edit Employee
  // --------------------------------------------------

  const handleOpenEditDialog = (employee) => {
    setEditingEmployee(employee);

    setEditRestaurantId(
      employee.restaurant_id
        ? String(employee.restaurant_id)
        : ""
    );

    setEditDialogOpen(true);
  };


  const handleCloseEditDialog = () => {
    if (!saving) {
      setEditDialogOpen(false);
      setEditingEmployee(null);
      setEditRestaurantId("");
    }
  };


  // --------------------------------------------------
  // Update Employee
  // --------------------------------------------------

  const handleUpdateEmployee = async () => {
    if (!editingEmployee) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      await updateEmployee(
        editingEmployee.id,
        {
          first_name: editingEmployee.first_name,
          last_name: editingEmployee.last_name,
          email: editingEmployee.email,
          phone: editingEmployee.phone,
          role: editingEmployee.role,
          is_active: editingEmployee.is_active,
          restaurant_id: editRestaurantId
            ? Number(editRestaurantId)
            : null,
          schedule_type:
            editingEmployee.schedule_type ||
            "Flexible",
          shift_start:
            editingEmployee.shift_start || null,
          shift_end:
            editingEmployee.shift_end || null,
        }
      );

      setEditDialogOpen(false);
      setEditingEmployee(null);
      setEditRestaurantId("");

      setSuccessMessage(
        "Employee restaurant assignment updated successfully."
      );

      await loadEmployees();
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Failed to update employee."
      );
    } finally {
      setSaving(false);
    }
  };


  // --------------------------------------------------
  // Restaurant Name
  // --------------------------------------------------

  const getRestaurantName = (restaurantId) => {
    if (!restaurantId) {
      return "Not assigned";
    }

    const restaurant = restaurants.find(
      (item) => item.id === restaurantId
    );

    return restaurant?.name || "Not assigned";
  };


  // --------------------------------------------------
  // Approval Color
  // --------------------------------------------------

  const getApprovalColor = (status) => {
    if (status === "Approved") {
      return "success";
    }

    if (status === "Rejected") {
      return "error";
    }

    return "warning";
  };


  // --------------------------------------------------
  // View Employee Attendance
  // --------------------------------------------------

  const handleViewAttendance = async (employee) => {
    setSelectedEmployee(employee);
    setAttendanceDialogOpen(true);
    setAttendanceLoading(true);
    setAttendanceError("");
    setAttendanceRecords([]);

    try {
      const records = await getEmployeeAttendance(employee.id);
      setAttendanceRecords(Array.isArray(records) ? records : []);
    } catch (err) {
      console.error(err);
      setAttendanceError(
        err.response?.data?.detail ||
          "Failed to load employee attendance."
      );
    } finally {
      setAttendanceLoading(false);
    }
  };

  // --------------------------------------------------
  // Loading
  // --------------------------------------------------

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


  // --------------------------------------------------
  // Main Page
  // --------------------------------------------------

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
      }}
    >

      {/* COMMON MANAGER SIDEBAR */}
      <ManagerSidebar activePage="employees" />


      {/* MAIN CONTENT */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          bgcolor: "#f7f8fa",
          minHeight: "100vh",
          py: 4,
          px: {
            xs: 2,
            md: 4,
          },
        }}
      >

        <Box
          sx={{
            maxWidth: 1400,
            mx: "auto",
          }}
        >

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
                        <strong>Restaurant</strong>
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
                          colSpan={10}
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

                        <TableRow
                          key={employee.id}
                        >

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
                            {getRestaurantName(
                              employee.restaurant_id
                            )}
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

                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "center",
                                gap: 0.5,
                              }}
                            >

                              {/* VIEW ATTENDANCE */}

                              <Tooltip title="View employee attendance">
                                <IconButton
                                  color="info"
                                  onClick={() => handleViewAttendance(employee)}
                                  aria-label={`View attendance for ${employee.first_name}`}
                                >
                                  <AccessTimeIcon />
                                </IconButton>
                              </Tooltip>

                              {/* EDIT */}

                              {employee.approval_status !==
                                "Pending" && (

                                <Tooltip title="Edit employee">

                                  <IconButton
                                    color="primary"
                                    onClick={() =>
                                      handleOpenEditDialog(
                                        employee
                                      )
                                    }
                                  >
                                    <EditIcon />
                                  </IconButton>

                                </Tooltip>

                              )}


                              {/* APPROVE / REJECT */}

                              {employee.approval_status ===
                                "Pending" && (

                                <>

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

                                </>

                              )}

                            </Box>

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


        {/* ================================================ */}
        {/* ADD EMPLOYEE DIALOG */}
        {/* ================================================ */}

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

                <InputLabel>
                  Role
                </InputLabel>

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


        {/* ================================================ */}
        {/* EDIT EMPLOYEE / RESTAURANT DIALOG */}
        {/* ================================================ */}

        <Dialog
          open={editDialogOpen}
          onClose={handleCloseEditDialog}
          fullWidth
          maxWidth="sm"
        >

          <DialogTitle fontWeight="bold">
            Edit Employee
          </DialogTitle>


          <DialogContent>

            {editingEmployee && (

              <>

                <Typography
                  variant="body1"
                  fontWeight="bold"
                  sx={{ mb: 1 }}
                >
                  {editingEmployee.first_name}{" "}
                  {editingEmployee.last_name}
                </Typography>


                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 3 }}
                >
                  Employee ID:{" "}
                  {editingEmployee.employee_id || "-"}
                </Typography>


                <FormControl
                  fullWidth
                  margin="normal"
                >

                  <InputLabel>
                    Restaurant
                  </InputLabel>

                  <Select
                    label="Restaurant"
                    value={editRestaurantId}
                    onChange={(event) =>
                      setEditRestaurantId(
                        event.target.value
                      )
                    }
                  >

                    <MenuItem value="">
                      <em>Not assigned</em>
                    </MenuItem>


                    {restaurants.map((restaurant) => (

                      <MenuItem
                        key={restaurant.id}
                        value={String(restaurant.id)}
                      >
                        {restaurant.name}
                      </MenuItem>

                    ))}

                  </Select>

                </FormControl>

              </>

            )}

          </DialogContent>


          <DialogActions
            sx={{
              px: 3,
              pb: 3,
            }}
          >

            <Button
              onClick={handleCloseEditDialog}
              disabled={saving}
            >
              Cancel
            </Button>


            <Button
              variant="contained"
              onClick={handleUpdateEmployee}
              disabled={saving}
            >

              {saving ? (

                <CircularProgress
                  size={24}
                  color="inherit"
                />

              ) : (

                "Save Changes"

              )}

            </Button>

          </DialogActions>

        </Dialog>


        {/* EMPLOYEE ATTENDANCE HISTORY DIALOG */}

        <Dialog
          open={attendanceDialogOpen}
          onClose={() => setAttendanceDialogOpen(false)}
          fullWidth
          maxWidth="md"
        >
          <DialogTitle>
            Attendance History
            {selectedEmployee && (
              <Typography variant="subtitle2" color="text.secondary">
                {selectedEmployee.first_name} {selectedEmployee.last_name}
                {" — "}
                {selectedEmployee.employee_id || selectedEmployee.email}
              </Typography>
            )}
          </DialogTitle>

          <DialogContent>
            {attendanceLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
                <CircularProgress />
              </Box>
            ) : attendanceError ? (
              <Alert severity="error" sx={{ my: 2 }}>
                {attendanceError}
              </Alert>
            ) : attendanceRecords.length === 0 ? (
              <Typography color="text.secondary" sx={{ py: 3 }}>
                No attendance records found for this employee.
              </Typography>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Date</strong></TableCell>
                      <TableCell><strong>Check In</strong></TableCell>
                      <TableCell><strong>Check Out</strong></TableCell>
                      <TableCell><strong>Hours Worked</strong></TableCell>
                      <TableCell><strong>Status</strong></TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {attendanceRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          {record.work_date
                            ? new Date(`${record.work_date}T12:00:00`).toLocaleDateString()
                            : "-"}
                        </TableCell>

                        <TableCell>
                          {record.check_in
                            ? new Date(record.check_in).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "-"}
                        </TableCell>

                        <TableCell>
                          {record.check_out
                            ? new Date(record.check_out).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "Not checked out"}
                        </TableCell>

                        <TableCell>
                          {(() => {
  const minutes =
    record.worked_minutes != null
      ? Number(record.worked_minutes)
      : record.worked_hours != null
        ? Math.round(Number(record.worked_hours) * 60)
        : null;

  if (minutes == null || !Number.isFinite(minutes)) {
    return "-";
  }

  if (minutes < 60) {
    return `${minutes} ${minutes === 1 ? "minute" : "minutes"}`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours} ${hours === 1 ? "hour" : "hours"}`;
  }

  return `${hours} ${hours === 1 ? "hour" : "hours"} ${remainingMinutes} min`;
})()}
                        </TableCell>

                        <TableCell>
                          <Chip
                            size="small"
                            label={
                              record.status ||
                              (record.check_out ? "Completed" : "Working")
                            }
                            color={record.check_out ? "success" : "warning"}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </DialogContent>

          <DialogActions>
            <Button onClick={() => setAttendanceDialogOpen(false)}>
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* SUCCESS MESSAGE */}

        <Snackbar
          open={Boolean(successMessage)}
          autoHideDuration={4000}
          onClose={() => setSuccessMessage("")}
          message={successMessage}
        />

      </Box>

    </Box>
  );
}

export default EmployeeList;