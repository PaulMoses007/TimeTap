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
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";

import {
  approveLeave,
  getLeaveRequests,
  rejectLeave,
} from "../services/leaveService";

import { formatDate } from "../utils/time";

const STATUS_COLOR = {
  Pending: "warning",
  Approved: "success",
  Rejected: "error",
};

// Manager view of employees' sick / vacation / day-off requests
function LeaveRequestsPanel({ onChanged }) {
  const [filter, setFilter] = useState("Pending");
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [review, setReview] = useState(null); // { request, action }
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getLeaveRequests(filter === "All" ? undefined : filter);
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Failed to load leave requests.");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const openReview = (request, action) => {
    setReview({ request, action });
    setNote("");
  };

  const submitReview = async () => {
    if (!review) return;

    setSaving(true);
    setError("");

    try {
      if (review.action === "approve") {
        await approveLeave(review.request.id, note.trim());
        setMessage("Leave approved.");
      } else {
        await rejectLeave(review.request.id, note.trim());
        setMessage(
          review.request.status === "Approved" ? "Leave cancelled." : "Leave rejected."
        );
      }

      setReview(null);
      await load();
      if (onChanged) onChanged();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Could not update the request.");
      setReview(null);
    } finally {
      setSaving(false);
    }
  };

  const period = (request) =>
    request.start_date === request.end_date
      ? formatDate(request.start_date)
      : `${formatDate(request.start_date)} - ${formatDate(request.end_date)}`;

  return (
    <Box>
      <Box sx={{ mb: 2, display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={filter}
          onChange={(e, value) => value && setFilter(value)}
        >
          <ToggleButton value="Pending">Pending</ToggleButton>
          <ToggleButton value="Approved">Approved</ToggleButton>
          <ToggleButton value="Rejected">Rejected</ToggleButton>
          <ToggleButton value="All">All</ToggleButton>
        </ToggleButtonGroup>

        <Typography variant="body2" color="text.secondary">
          Approved leave shows as "On leave" instead of "Absent" and is marked in the Excel export.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{ border: "1px solid #e4e7eb", borderRadius: 3, overflow: "auto" }}
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Employee</strong></TableCell>
                <TableCell><strong>Type</strong></TableCell>
                <TableCell><strong>Days</strong></TableCell>
                <TableCell><strong>Reason</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell align="center"><strong>Action</strong></TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">
                      No {filter === "All" ? "" : filter.toLowerCase()} leave requests.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((request) => (
                  <TableRow key={request.id} hover>
                    <TableCell>
                      <Typography fontWeight="500">{request.employee_name || "-"}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {request.employee_code}
                      </Typography>
                    </TableCell>

                    <TableCell>{request.leave_type}</TableCell>

                    <TableCell>
                      {period(request)}
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                        {request.days} day{request.days === 1 ? "" : "s"}
                      </Typography>
                    </TableCell>

                    <TableCell sx={{ maxWidth: 260 }}>
                      <Typography variant="body2">{request.reason || "-"}</Typography>
                      {request.review_note && (
                        <Typography variant="caption" color="text.secondary">
                          Manager note: {request.review_note}
                        </Typography>
                      )}
                    </TableCell>

                    <TableCell>
                      <Chip
                        size="small"
                        label={request.status}
                        color={STATUS_COLOR[request.status] || "default"}
                      />
                    </TableCell>

                    <TableCell align="center">
                      {request.status === "Pending" ? (
                        <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            onClick={() => openReview(request, "approve")}
                          >
                            Approve
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            onClick={() => openReview(request, "reject")}
                          >
                            Reject
                          </Button>
                        </Box>
                      ) : request.status === "Approved" ? (
                        <Button
                          size="small"
                          color="error"
                          onClick={() => openReview(request, "reject")}
                        >
                          Cancel leave
                        </Button>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog
        open={Boolean(review)}
        onClose={() => !saving && setReview(null)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle fontWeight="bold">
          {review?.action === "approve"
            ? "Approve leave"
            : review?.request.status === "Approved"
              ? "Cancel approved leave"
              : "Reject leave"}
        </DialogTitle>

        <DialogContent>
          {review && (
            <>
              <Typography sx={{ mb: 1 }}>
                {review.request.employee_name} - {review.request.leave_type},{" "}
                {period(review.request)}
              </Typography>
              <TextField
                fullWidth
                multiline
                minRows={2}
                label="Note to employee (optional)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                slotProps={{ htmlInput: { maxLength: 500 } }}
              />
            </>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setReview(null)} disabled={saving}>
            Back
          </Button>
          <Button
            variant="contained"
            color={review?.action === "approve" ? "success" : "error"}
            onClick={submitReview}
            disabled={saving}
          >
            {saving ? (
              <CircularProgress size={22} color="inherit" />
            ) : review?.action === "approve" ? (
              "Approve"
            ) : (
              "Confirm"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(message)}
        autoHideDuration={4000}
        onClose={() => setMessage("")}
        message={message}
      />
    </Box>
  );
}

export default LeaveRequestsPanel;
