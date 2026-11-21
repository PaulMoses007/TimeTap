import { useCallback, useEffect, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";

import { getMyLeave, requestLeave, withdrawLeave } from "../services/leaveService";
import { formatDate } from "../utils/time";

const STATUS_COLOR = { Pending: "warning", Approved: "success", Rejected: "error" };

const todayRiga = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Riga" });

// Employee: ask for sick days, vacation or a day off, and see the answers
function MyLeaveCard() {
  const [list, setList] = useState(null);
  const [form, setForm] = useState({
    leave_type: "Vacation",
    start_date: todayRiga(),
    end_date: todayRiga(),
    reason: "",
  });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  const load = useCallback(async () => {
    try {
      setList(await getMyLeave());
    } catch {
      setList([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const change = (field) => (event) => {
    const value = event.target.value;

    setForm((prev) => {
      const next = { ...prev, [field]: value };

      // keep the last day from being before the first day
      if (field === "start_date" && next.end_date < value) {
        next.end_date = value;
      }

      return next;
    });
  };

  const submit = async (event) => {
    event.preventDefault();
    setSending(true);
    setError("");
    setDone("");

    try {
      await requestLeave({ ...form, reason: form.reason.trim() || null });
      setDone("Request sent. Your manager will answer it.");
      setForm((prev) => ({ ...prev, reason: "" }));
      await load();
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Please check the dates and try again.");
    } finally {
      setSending(false);
    }
  };

  const withdraw = async (id) => {
    try {
      await withdrawLeave(id);
      await load();
    } catch (err) {
      setError(err.response?.data?.detail || "Could not withdraw the request.");
    }
  };

  const period = (item) =>
    item.start_date === item.end_date
      ? formatDate(item.start_date)
      : `${formatDate(item.start_date)} - ${formatDate(item.end_date)}`;

  return (
    <Card sx={{ mb: 4, borderRadius: 3 }} elevation={0}>
      <CardContent>
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
          Leave
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {done && <Alert severity="success" sx={{ mb: 2 }}>{done}</Alert>}

        <Box
          component="form"
          onSubmit={submit}
          sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "flex-start" }}
        >
          <TextField
            select
            size="small"
            label="Type"
            value={form.leave_type}
            onChange={change("leave_type")}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="Vacation">Vacation</MenuItem>
            <MenuItem value="Sick">Sick</MenuItem>
            <MenuItem value="Day off">Day off</MenuItem>
            <MenuItem value="Other">Other</MenuItem>
          </TextField>

          <TextField
            size="small"
            type="date"
            label="First day"
            value={form.start_date}
            onChange={change("start_date")}
            slotProps={{ inputLabel: { shrink: true } }}
            required
          />

          <TextField
            size="small"
            type="date"
            label="Last day"
            value={form.end_date}
            onChange={change("end_date")}
            slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: form.start_date } }}
            required
          />

          <TextField
            size="small"
            label="Reason (optional)"
            value={form.reason}
            onChange={change("reason")}
            slotProps={{ htmlInput: { maxLength: 500 } }}
            sx={{ minWidth: 220, flexGrow: 1 }}
          />

          <Button type="submit" variant="contained" disabled={sending}>
            {sending ? <CircularProgress size={22} color="inherit" /> : "Request leave"}
          </Button>
        </Box>

        {list && list.length > 0 && (
          <Box sx={{ display: "grid", gap: 1, mt: 3 }}>
            {list.slice(0, 8).map((item) => (
              <Box
                key={item.id}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 2,
                  flexWrap: "wrap",
                  p: 1.5,
                  border: "1px solid #e4e7eb",
                  borderRadius: 2,
                }}
              >
                <Box>
                  <Typography fontWeight="500">
                    {item.leave_type}: {period(item)}
                  </Typography>
                  {item.review_note && (
                    <Typography variant="caption" color="text.secondary">
                      Manager note: {item.review_note}
                    </Typography>
                  )}
                </Box>

                <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                  <Chip size="small" label={item.status} color={STATUS_COLOR[item.status] || "default"} />
                  {item.status === "Pending" && (
                    <Button size="small" onClick={() => withdraw(item.id)}>
                      Withdraw
                    </Button>
                  )}
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

export default MyLeaveCard;
