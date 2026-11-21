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
  IconButton,
  Paper,
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

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddIcon from "@mui/icons-material/Add";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import LockResetIcon from "@mui/icons-material/LockReset";

import ManagerSidebar from "../../components/ManagerSidebar";
import SourceChip from "../../components/SourceChip";

import {
  deleteEmployee,
  getEmployee,
  getEmployeeAttendance,
  resetEmployeePassword,
} from "../../services/employeeService";

import {
  addAttendance,
  editAttendance,
} from "../../services/attendanceService";

import {
  formatDate,
  formatMinutes,
  formatTime,
  nowRigaInput,
  toRigaInput,
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

  // password reset
  const [resetOpen, setResetOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [tempPassword, setTempPassword] = useState("");
  const [copied, setCopied] = useState(false);

  // add / edit a record (times are Riga time)
  const [recordDialog, setRecordDialog] = useState(null); // { id|null }
  const [recordForm, setRecordForm] = useState({
    check_in: "",
    check_out: "",
    note: "",
  });
  const [recordError, setRecordError] = useState("");
  const [savingRecord, setSavingRecord] = useState(false);
  const [notice, setNotice] = useState("");

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

  const handleReset = async () => {
    setResetting(true);

    try {
      const result = await resetEmployeePassword(id);
      setTempPassword(result.temporary_password);
      setCopied(false);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Could not reset the password.");
      setResetOpen(false);
    } finally {
      setResetting(false);
    }
  };

  const closeReset = () => {
    setResetOpen(false);
    setTempPassword("");
  };

  const copyPassword = async () => {
    try {
      await navigator.clipboard.writeText(tempPassword);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const openRecordDialog = (record) => {
    setRecordError("");

    if (record) {
      setRecordForm({
        check_in: toRigaInput(record.check_in),
        check_out: record.check_out ? toRigaInput(record.check_out) : "",
        note: "",
      });
      setRecordDialog({ id: record.id });
    } else {
      const now = nowRigaInput();
      setRecordForm({
        check_in: `${now.slice(0, 10)}T09:00`,
        check_out: `${now.slice(0, 10)}T17:00`,
        note: "",
      });
      setRecordDialog({ id: null });
    }
  };

  const handleSaveRecord = async () => {
    if (!recordForm.check_in) {
      setRecordError("Enter the check-in time.");
      return;
    }

    if (recordForm.note.trim().length < 3) {
      setRecordError("Please write a short reason for the change.");
      return;
    }

    setSavingRecord(true);
    setRecordError("");

    const body = {
      check_in: recordForm.check_in,
      check_out: recordForm.check_out || null,
      note: recordForm.note.trim(),
    };

    try {
      if (recordDialog.id) {
        await editAttendance(recordDialog.id, body);
        setNotice("Attendance record updated.");
      } else {
        await addAttendance(id, body);
        setNotice("Attendance record added.");
      }

      setRecordDialog(null);
      await load();
    } catch (err) {
      const detail = err.response?.data?.detail;
      setRecordError(
        typeof detail === "string"
          ? detail
          : "Could not save the record. Check the times and try again."
      );
    } finally {
      setSavingRecord(false);
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

          {notice && (
            <Alert
              severity="success"
              sx={{ mb: 3 }}
              onClose={() => setNotice("")}
            >
              {notice}
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

                  <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
                    <Button
                      variant="outlined"
                      startIcon={<LockResetIcon />}
                      onClick={() => setResetOpen(true)}
                    >
                      Reset password
                    </Button>

                    <Button
                      color="error"
                      variant="outlined"
                      startIcon={<DeleteIcon />}
                      onClick={() => setConfirmOpen(true)}
                    >
                      Delete employee
                    </Button>
                  </Box>
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

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 1.5,
                  }}
                >
                  <Typography variant="h6" fontWeight="bold">
                    Attendance history
                  </Typography>

                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => openRecordDialog(null)}
                  >
                    Add record
                  </Button>
                </Box>

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
                        <TableCell><strong>Note</strong></TableCell>
                        <TableCell />
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {records.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} align="center" sx={{ py: 5 }}>
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
                            <TableCell sx={{ maxWidth: 220 }}>
                              <Typography variant="caption" color="text.secondary">
                                {record.edit_note || ""}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Tooltip title="Edit times">
                                <IconButton
                                  size="small"
                                  onClick={() => openRecordDialog(record)}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
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


      <Dialog
        open={Boolean(recordDialog)}
        onClose={() => !savingRecord && setRecordDialog(null)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle fontWeight="bold">
          {recordDialog?.id ? "Edit attendance record" : "Add attendance record"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "grid", gap: 2, pt: 1 }}>
            {recordError && <Alert severity="error">{recordError}</Alert>}

            <TextField
              type="datetime-local"
              label="Check in (Riga time)"
              value={recordForm.check_in}
              onChange={(e) =>
                setRecordForm((prev) => ({ ...prev, check_in: e.target.value }))
              }
              slotProps={{ inputLabel: { shrink: true } }}
            />

            <TextField
              type="datetime-local"
              label="Check out (Riga time)"
              value={recordForm.check_out}
              onChange={(e) =>
                setRecordForm((prev) => ({ ...prev, check_out: e.target.value }))
              }
              helperText="Leave empty if the employee is still working."
              slotProps={{ inputLabel: { shrink: true } }}
            />

            <TextField
              label="Reason for the change"
              value={recordForm.note}
              onChange={(e) =>
                setRecordForm((prev) => ({ ...prev, note: e.target.value }))
              }
              multiline
              minRows={2}
              required
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRecordDialog(null)} disabled={savingRecord}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSaveRecord} disabled={savingRecord}>
            {savingRecord ? <CircularProgress size={22} color="inherit" /> : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={resetOpen}
        onClose={() => !resetting && closeReset()}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle fontWeight="bold">Reset password</DialogTitle>
        <DialogContent>
          {tempPassword ? (
            <>
              <DialogContentText sx={{ mb: 2 }}>
                Give this temporary password to {employee?.first_name}. It is
                shown only once. They can change it in My Profile after
                logging in.
              </DialogContentText>

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1,
                  p: 2,
                  bgcolor: "#f1f5f9",
                  borderRadius: 2,
                  fontFamily: "monospace",
                  fontSize: 20,
                  letterSpacing: 1,
                }}
              >
                {tempPassword}

                <Tooltip title={copied ? "Copied" : "Copy"}>
                  <IconButton onClick={copyPassword}>
                    <ContentCopyIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </>
          ) : (
            <DialogContentText>
              This creates a new temporary password for {employee?.first_name}{" "}
              {employee?.last_name}. The old password stops working
              immediately.
            </DialogContentText>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          {tempPassword ? (
            <Button variant="contained" onClick={closeReset}>
              Done
            </Button>
          ) : (
            <>
              <Button onClick={closeReset} disabled={resetting}>
                Cancel
              </Button>
              <Button variant="contained" onClick={handleReset} disabled={resetting}>
                {resetting ? (
                  <CircularProgress size={22} color="inherit" />
                ) : (
                  "Create new password"
                )}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

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
