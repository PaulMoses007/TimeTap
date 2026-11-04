import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteIcon from "@mui/icons-material/Delete";

import ManagerSidebar from "../../components/ManagerSidebar";
import SourceChip from "../../components/SourceChip";

import {
  deleteEmployee,
  getEmployee,
  getEmployeeAttendance,
} from "../../services/employeeService";

import {
  formatDate,
  formatMinutes,
  formatTime,
} from "../../utils/time";

function Field({ label, value }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography fontWeight="500">{value || "-"}</Typography>
    </Box>
  );
}

// Individual employee account: details + attendance history
function EmployeeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [employee, setEmployee] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [emp, attendance] = await Promise.all([
        getEmployee(id),
        getEmployeeAttendance(id),
      ]);

      setEmployee(emp);
      setRecords(Array.isArray(attendance) ? attendance : []);
    } catch (err) {
      console.error(err);

      if (err.response?.status === 401) {
        localStorage.removeItem("access_token");
        navigate("/");
        return;
      }

      setError(
        err.response?.status === 404
          ? "Employee not found."
          : err.response?.data?.detail || "Failed to load employee."
      );
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async () => {
    setDeleting(true);

    try {
      await deleteEmployee(id);
      navigate("/employees");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Failed to delete employee.");
      setConfirmOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  const totalMinutes = records.reduce(
    (sum, record) => sum + (Number(record.worked_minutes) || 0),
    0
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <ManagerSidebar activePage="employees" />

      <Box component="main" sx={{ flexGrow: 1, bgcolor: "#f7f8fa", minHeight: "100vh" }}>
        <Box sx={{ maxWidth: 1200, mx: "auto", py: 5, px: { xs: 2, md: 4 } }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/employees")}
            sx={{ mb: 2 }}
          >
            Back to employees
          </Button>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
              <CircularProgress />
            </Box>
          ) : (
            employee && (
              <>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 2,
                    mb: 3,
                  }}
                >
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {employee.first_name} {employee.last_name}
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                      <Chip size="small" label={employee.role} />
                      <Chip
                        size="small"
                        label={employee.approval_status}
                        color={
                          employee.approval_status === "Approved"
                            ? "success"
                            : employee.approval_status === "Rejected"
                              ? "error"
                              : "warning"
                        }
                      />
                      <Chip
                        size="small"
                        label={employee.is_active ? "Active" : "Disabled"}
                        color={employee.is_active ? "success" : "default"}
                      />
                    </Box>
                  </Box>

                  <Button
                    color="error"
                    variant="outlined"
                    startIcon={<DeleteIcon />}
                    onClick={() => setConfirmOpen(true)}
                  >
                    Delete employee
                  </Button>
                </Box>

                <Paper
                  elevation={0}
                  sx={{ border: "1px solid #e4e7eb", borderRadius: 3, p: 3, mb: 3 }}
                >
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <Field label="Employee ID" value={employee.employee_id} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <Field label="Email" value={employee.email} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <Field label="Phone" value={employee.phone} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <Field label="Restaurant" value={employee.restaurant_name || "Not assigned"} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <Field
                        label="Schedule"
                        value={
                          employee.schedule_type === "Fixed" && employee.shift_start
                            ? `Fixed ${employee.shift_start} - ${employee.shift_end}`
                            : employee.schedule_type || "Flexible"
                        }
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <Field label="Shifts recorded" value={String(records.length)} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <Field label="Total time worked" value={formatMinutes(totalMinutes)} />
                    </Grid>
                  </Grid>
                </Paper>

                <Typography variant="h6" fontWeight="bold" sx={{ mb: 1.5 }}>
                  Attendance history
                </Typography>

                <TableContainer
                  component={Paper}
                  elevation={0}
                  sx={{ border: "1px solid #e4e7eb", borderRadius: 3, overflow: "auto" }}
                >
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Date</strong></TableCell>
                        <TableCell><strong>Check In</strong></TableCell>
                        <TableCell><strong>Check Out</strong></TableCell>
                        <TableCell><strong>Worked</strong></TableCell>
                        <TableCell><strong>In via</strong></TableCell>
                        <TableCell><strong>Out via</strong></TableCell>
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {records.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                            <Typography color="text.secondary">
                              No attendance records yet.
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        records.map((record) => (
                          <TableRow key={record.id} hover>
                            <TableCell>{formatDate(record.work_date)}</TableCell>
                            <TableCell>{formatTime(record.check_in)}</TableCell>
                            <TableCell>
                              {record.check_out ? formatTime(record.check_out) : "Not checked out"}
                            </TableCell>
                            <TableCell>
                              {record.check_out ? formatMinutes(record.worked_minutes) : "-"}
                            </TableCell>
                            <TableCell>
                              <SourceChip source={record.source} />
                            </TableCell>
                            <TableCell>
                              <SourceChip source={record.check_out_source} />
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )
          )}
        </Box>
      </Box>

      <Dialog open={confirmOpen} onClose={() => !deleting && setConfirmOpen(false)}>
        <DialogTitle fontWeight="bold">Delete employee?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {employee?.first_name} {employee?.last_name} will lose access and
            disappear from your employee list. Their past attendance records
            are kept for your reports.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmOpen(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button color="error" variant="contained" onClick={handleDelete} disabled={deleting}>
            {deleting ? <CircularProgress size={22} color="inherit" /> : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default EmployeeDetail;
