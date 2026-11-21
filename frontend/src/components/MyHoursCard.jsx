import { useEffect, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Typography,
} from "@mui/material";

import DownloadIcon from "@mui/icons-material/Download";

import api from "../api/axios";
import { getMySummary } from "../services/attendanceService";
import { formatMinutes } from "../utils/time";

function Tile({ title, range, data }) {
  return (
    <Box
      sx={{
        flex: "1 1 220px",
        p: 2.5,
        border: "1px solid #e4e7eb",
        borderRadius: 3,
        bgcolor: "#fff",
      }}
    >
      <Typography variant="caption" color="text.secondary">
        {title}
      </Typography>

      <Typography variant="h4" fontWeight="bold" sx={{ my: 0.5 }}>
        {data ? formatMinutes(data.total_minutes) : "-"}
      </Typography>

      <Typography variant="body2" color="text.secondary">
        {data
          ? `${data.days_worked} day${data.days_worked === 1 ? "" : "s"} worked`
          : ""}
      </Typography>

      <Typography variant="caption" color="text.secondary">
        {range}
      </Typography>
    </Box>
  );
}

function rangeText(data) {
  if (!data) return "";

  const format = (value) =>
    new Date(`${value}T12:00:00`).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
    });

  return `${format(data.start)} - ${format(data.end)}`;
}

// "My hours": this week and this month, plus an Excel download
function MyHoursCard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  useEffect(() => {
    getMySummary()
      .then(setSummary)
      .catch(() => setError("Could not load your hours."))
      .finally(() => setLoading(false));
  }, []);

  const download = async (period) => {
    setBusy(period);
    setError("");

    try {
      const response = await api.get("/attendance/my-export", {
        params: { period },
        responseType: "blob",
      });

      const disposition = response.headers["content-disposition"] || "";
      const match = disposition.match(/filename="?([^";]+)"?/);

      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = match?.[1] || `my_hours_${period}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setError("Could not create the Excel file. Please try again.");
    } finally {
      setBusy("");
    }
  };

  return (
    <Card sx={{ mb: 4, borderRadius: 3 }} elevation={0}>
      <CardContent>
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
          My hours
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <CircularProgress size={28} />
        ) : (
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <Tile title="This week" range={rangeText(summary?.week)} data={summary?.week} />
            <Tile title="This month" range={rangeText(summary?.month)} data={summary?.month} />
          </Box>
        )}

        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", mt: 2.5 }}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            disabled={Boolean(busy)}
            onClick={() => download("week")}
          >
            {busy === "week" ? "Preparing..." : "Download this week (Excel)"}
          </Button>

          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            disabled={Boolean(busy)}
            onClick={() => download("month")}
          >
            {busy === "month" ? "Preparing..." : "Download this month (Excel)"}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}

export default MyHoursCard;
