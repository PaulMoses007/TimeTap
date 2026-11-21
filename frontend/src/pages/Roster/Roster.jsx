import { useCallback, useEffect, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

import ManagerSidebar from "../../components/ManagerSidebar";

import {
  copyWeek,
  deleteShift,
  getRosterWeek,
  setShift,
} from "../../services/rosterService";

// Dates are handled as plain "YYYY-MM-DD" strings (no time zones involved)
const addDays = (isoDate, days) => {
  const date = new Date(`${isoDate}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

const mondayOf = (isoDate) => {
  const day = new Date(`${isoDate}T12:00:00Z`).getUTCDay(); // 0 = Sunday
  return addDays(isoDate, -((day + 6) % 7));
};

const riga = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Riga" });

const dayLabel = (isoDate) =>
  new Date(`${isoDate}T12:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    timeZone: "UTC",
  });

// Weekly plan: who works which day, from when to when
function Roster() {
  const [weekStart, setWeekStart] = useState(mondayOf(riga()));
  const [week, setWeek] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [cell, setCell] = useState(null); // { employee, day, shift|null }
  const [form, setForm] = useState({ start_time: "09:00", end_time: "17:00", note: "" });
  const [dialogError, setDialogError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      setWeek(await getRosterWeek(weekStart));
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Failed to load the roster.");
    } finally {
      setLoading(false);
    }
  }, [weekStart]);

  useEffect(() => {
    load();
  }, [load]);

  const days = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const today = riga();

  const shiftFor = (employeeId, day) =>
    week?.shifts.find((s) => s.employee_id === employeeId && s.work_date === day);

  const leaveFor = (employeeId, day) =>
    week?.leave.find((l) => l.employee_id === employeeId && l.work_date === day);

  const openCell = (employee, day) => {
    const shift = shiftFor(employee.id, day);

    setDialogError("");
    setForm({
      start_time:
        shift?.start_time ||
        (employee.schedule_type === "Fixed" && employee.shift_start) ||
        "09:00",
      end_time:
        shift?.end_time ||
        (employee.schedule_type === "Fixed" && employee.shift_end) ||
        "17:00",
      note: shift?.note || "",
    });
    setCell({ employee, day, shift: shift || null });
  };

  const handleSave = async () => {
    setSaving(true);
    setDialogError("");

    try {
      await setShift({
        employee_id: cell.employee.id,
        work_date: cell.day,
        start_time: form.start_time,
        end_time: form.end_time,
        note: form.note.trim() || null,
      });

      setCell(null);
      await load();
    } catch (err) {
      const detail = err.response?.data?.detail;
      setDialogError(typeof detail === "string" ? detail : "Could not save the shift.");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    setSaving(true);

    try {
      await deleteShift(cell.shift.id);
      setCell(null);
      await load();
    } catch (err) {
      setDialogError(err.response?.data?.detail || "Could not remove the shift.");
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = async () => {
    try {
      const result = await copyWeek(addDays(weekStart, -7), weekStart);
      setMessage(
        `Copied ${result.copied} shift${result.copied === 1 ? "" : "s"} from last week` +
          (result.skipped ? ` (${result.skipped} skipped: already planned or on leave).` : ".")
      );
      await load();
    } catch (err) {
      setError(err.response?.data?.detail || "Could not copy last week.");
    }
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <ManagerSidebar activePage="roster" />

      <Box component="main" sx={{ flexGrow: 1, bgcolor: "#f7f8fa", minHeight: "100vh" }}>
        <Box sx={{ maxWidth: 1500, mx: "auto", py: 5, px: { xs: 2, md: 4 } }}>
          <Typography variant="h4" fontWeight="bold">
            Roster
          </Typography>

          <Typography color="text.secondary" sx={{ mt: 0.5, mb: 3 }}>
            Plan who works when. Click a day to set or change a shift. Employees
            see their own shifts, and late arrivals show on your dashboard.
          </Typography>

          <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", flexWrap: "wrap", mb: 3 }}>
            <Button
              variant="outlined"
              startIcon={<ChevronLeftIcon />}
              onClick={() => setWeekStart(addDays(weekStart, -7))}
            >
              Previous
            </Button>

            <Typography fontWeight="bold" sx={{ minWidth: 190, textAlign: "center" }}>
              {dayLabel(weekStart)} - {dayLabel(addDays(weekStart, 6))}
            </Typography>

            <Button
              variant="outlined"
              endIcon={<ChevronRightIcon />}
              onClick={() => setWeekStart(addDays(weekStart, 7))}
            >
              Next
            </Button>

            <Button onClick={() => setWeekStart(mondayOf(riga()))}>This week</Button>

            <Box sx={{ flexGrow: 1 }} />

            <Button variant="outlined" startIcon={<ContentCopyIcon />} onClick={handleCopy}>
              Copy last week here
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
              {error}
            </Alert>
          )}

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer
              component={Paper}
              elevation={0}
              sx={{ border: "1px solid #e4e7eb", borderRadius: 3, overflow: "auto" }}
            >
              <Table size="small" sx={{ minWidth: 900 }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ minWidth: 170 }}><strong>Employee</strong></TableCell>
                    {days.map((day) => (
                      <TableCell
                        key={day}
                        align="center"
                        sx={day === today ? { bgcolor: "#eff6ff" } : undefined}
                      >
                        <strong>{dayLabel(day)}</strong>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>

                <TableBody>
                  {!week || week.employees.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                        <Typography color="text.secondary">
                          No approved employees yet. Add employees first.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    week.employees.map((employee) => (
                      <TableRow key={employee.id} hover>
                        <TableCell>
                          <Typography fontWeight="500">{employee.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {employee.role}
                          </Typography>
                        </TableCell>

                        {days.map((day) => {
                          const shift = shiftFor(employee.id, day);
                          const leave = leaveFor(employee.id, day);

                          return (
                            <TableCell
                              key={day}
                              align="center"
                              sx={{
                                cursor: leave ? "default" : "pointer",
                                bgcolor: day === today ? "#f8fbff" : undefined,
                                "&:hover": leave ? undefined : { bgcolor: "#eef2ff" },
                              }}
                              onClick={() => !leave && openCell(employee, day)}
                            >
                              {leave ? (
                                <Chip size="small" color="warning" label={leave.leave_type} />
                              ) : shift ? (
                                <Box>
                                  <Typography variant="body2" fontWeight="600">
                                    {shift.start_time} - {shift.end_time}
                                  </Typography>
                                  {shift.note && (
                                    <Typography variant="caption" color="text.secondary">
                                      {shift.note}
                                    </Typography>
                                  )}
                                </Box>
                              ) : (
                                <Typography color="text.disabled">+</Typography>
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: "block" }}>
            Times are Riga time. A shift that ends before it starts (for example
            18:00 - 02:00) runs past midnight. Days with approved leave are locked.
          </Typography>
        </Box>
      </Box>

      <Dialog open={Boolean(cell)} onClose={() => !saving && setCell(null)} fullWidth maxWidth="xs">
        <DialogTitle fontWeight="bold">
          {cell?.employee.name} - {cell && dayLabel(cell.day)}
        </DialogTitle>

        <DialogContent>
          <Box sx={{ display: "grid", gap: 2, pt: 1 }}>
            {dialogError && <Alert severity="error">{dialogError}</Alert>}

            <TextField
              type="time"
              label="Start"
              value={form.start_time}
              onChange={(e) => setForm((prev) => ({ ...prev, start_time: e.target.value }))}
              slotProps={{ inputLabel: { shrink: true } }}
            />

            <TextField
              type="time"
              label="End"
              value={form.end_time}
              onChange={(e) => setForm((prev) => ({ ...prev, end_time: e.target.value }))}
              slotProps={{ inputLabel: { shrink: true } }}
            />

            <TextField
              label="Note (optional)"
              value={form.note}
              onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))}
              slotProps={{ htmlInput: { maxLength: 100 } }}
              placeholder="For example: kitchen, bar"
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          {cell?.shift && (
            <Button color="error" onClick={handleRemove} disabled={saving} sx={{ mr: "auto" }}>
              Remove shift
            </Button>
          )}
          <Button onClick={() => setCell(null)} disabled={saving}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? <CircularProgress size={22} color="inherit" /> : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(message)}
        autoHideDuration={5000}
        onClose={() => setMessage("")}
        message={message}
      />
    </Box>
  );
}

export default Roster;
