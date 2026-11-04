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
  approveManualRequest,
  getManualRequests,
  rejectManualRequest,
} from "../services/manualAttendanceService";

import { formatDate, formatDateTime } from "../utils/time";

const STATUS_COLOR = {
  Pending: "warning",
  Approved: "success",
  Rejected: "error",
};

// Manager view of employees' manual check-in / check-out requests
function ManualRequestsPanel({ onChanged }) {
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

      const data = await getManualRequests(
        filter === "All" ? undefined : filter
      );

      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.detail || "Failed to load manual requests."
      );
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

  const closeReview = () => {
    if (!saving) setReview(null);
  };

  const submitReview = async () => {
    if (!review) return;

    setSaving(true);
    setError("");

    try {
      if (review.action === "approve") {
        await approveManualRequest(review.request.id, note.trim());
        setMessage("Request approved. Attendance record created.");
      } else {
        await rejectManualRequest(review.request.id, note.trim());
        setMessage("Request rejected.");
      }

      setReview(null);
      await load();
      if (onChanged) onChanged();
    } catch (err) {
      console.error(err);
      // e.g. "This overlaps an existing attendance record"
      setError(
        err.response?.data?.detail || "Could not update the request."
      );
      setReview(null);
    } finally {
      setSaving(false);
    }
  };

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
          Employees send these when they could not scan the QR code.
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
                <TableCell><strong>Date</strong></TableCell>
                <TableCell><strong>Check In</strong></TableCell>
                <TableCell><strong>Check Out</strong></TableCell>
                <TableCell><strong>Reason</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell align="center"><strong>Action</strong></TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">
                      No {filter === "All" ? "" : filter.toLowerCase()} requests.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((request) => (
                  <TableRow key={request.id} hover>
                    <TableCell>
                      <Typography fontWeight="500">
                        {request.employee_name || "-"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {request.employee_code}
                      </Typography>
                    </TableCell>

                    <TableCell>{formatDate(request.work_date)}</TableCell>

                    <TableCell>
                      {request.requested_check_in
                        ? formatDateTime(request.requested_check_in)
                        : "-"}
                    </TableCell>

                    <TableCell>
                      {request.requested_check_out
                        ? formatDateTime(request.requested_check_out)
                        : "-"}
                    </TableCell>

                    <TableCell sx={{ maxWidth: 280 }}>
                      <Typography variant="body2">{request.reason}</Typography>
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

      <Dialog open={Boolean(review)} onClose={closeReview} fullWidth maxWidth="xs">
        <DialogTitle fontWeight="bold">
          {review?.action === "approve" ? "Approve request" : "Reject request"}
        </DialogTitle>

        <DialogContent>
          {review && (
            <>
              <Typography sx={{ mb: 1 }}>
                {review.request.employee_name} - {formatDate(review.request.work_date)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Reason: {review.request.reason}
              </Typography>
              <TextField
                fullWidth
                multiline
                minRows={2}
                label="Note to employee (optional)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                inputProps={{ maxLength: 500 }}
              />
            </>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeReview} disabled={saving}>
            Cancel
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
              "Reject"
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

export default ManualRequestsPanel;
