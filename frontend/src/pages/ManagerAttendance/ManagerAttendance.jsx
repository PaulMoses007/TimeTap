import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import api from "../../api/axios";
import ManagerSidebar from "../../components/ManagerSidebar";

function ManagerAttendance() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState("today");
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAttendance = async (selectedPeriod = period) => {
    try {
      setLoading(true);
      setError("");

      let endpoint = "/attendance/today";

      if (selectedPeriod === "weekly") {
        endpoint = "/attendance/weekly";
      }

      if (selectedPeriod === "monthly") {
        endpoint = "/attendance/monthly";
      }

      const response = await api.get(endpoint);
      setRecords(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error(err);

      if (err.response?.status === 401) {
        localStorage.removeItem("access_token");
        navigate("/");
        return;
      }

      setError(
        err.response?.data?.detail || "Failed to load attendance data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance(period);
  }, [period]);

  const handlePeriodChange = (event, newValue) => {
    setPeriod(newValue);
  };

  const handleRefresh = () => {
    loadAttendance(period);
  };

  const formatTime = (value) => {
    if (!value) return "-";

    const utcValue = value.endsWith("Z") ? value : `${value}Z`;

    return new Date(utcValue).toLocaleTimeString("en-GB", {
      timeZone: "Europe/Riga",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status) => {
    if (status === "Working") return "success";
    if (status === "Checked Out") return "primary";
    if (status === "Absent") return "error";
    if (status === "Present") return "success";
    return "default";
  };

  const getPeriodTitle = () => {
    if (period === "weekly") return "Weekly Attendance";
    if (period === "monthly") return "Monthly Attendance";
    return "Today's Attendance";
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <ManagerSidebar activePage="attendance" />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: "#f7f8fa",
          minHeight: "100vh",
        }}
      >
        <Box
          sx={{
            maxWidth: 1500,
            mx: "auto",
            py: 5,
            px: { xs: 2, md: 4 },
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: { xs: "flex-start", md: "center" },
              flexDirection: { xs: "column", md: "row" },
              gap: 2,
              mb: 4,
            }}
          >
            <Box>
              <Typography variant="h4" fontWeight="bold">
                Attendance
              </Typography>

              <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                Monitor employee attendance and working hours.
              </Typography>
            </Box>

            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              disabled={loading}
            >
              Refresh
            </Button>
          </Box>

          <Paper
            elevation={0}
            sx={{
              border: "1px solid #e4e7eb",
              borderRadius: 3,
              mb: 3,
            }}
          >
            <Tabs
              value={period}
              onChange={handlePeriodChange}
              sx={{ px: 2 }}
            >
              <Tab label="Today" value="today" />
              <Tab label="Weekly" value="weekly" />
              <Tab label="Monthly" value="monthly" />
            </Tabs>
          </Paper>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" fontWeight="bold">
              {getPeriodTitle()}
            </Typography>

            <Typography variant="body2" color="text.secondary">
              {records.length} employee record
              {records.length === 1 ? "" : "s"}
            </Typography>
          </Box>

          {loading ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                py: 10,
              }}
            >
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer
              component={Paper}
              elevation={0}
              sx={{
                border: "1px solid #e4e7eb",
                borderRadius: 3,
                overflow: "auto",
              }}
            >
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <strong>Employee ID</strong>
                    </TableCell>

                    <TableCell>
                      <strong>Employee</strong>
                    </TableCell>

                    <TableCell>
                      <strong>Restaurant</strong>
                    </TableCell>

                    <TableCell>
                      <strong>Role</strong>
                    </TableCell>

                    {period === "today" ? (
                      <>
                        <TableCell>
                          <strong>Status</strong>
                        </TableCell>

                        <TableCell>
                          <strong>Check In</strong>
                        </TableCell>

                        <TableCell>
                          <strong>Check Out</strong>
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell>
                          <strong>Days Present</strong>
                        </TableCell>

                        <TableCell>
                          <strong>Days Absent</strong>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                </TableHead>

                <TableBody>
                  {records.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={period === "today" ? 7 : 6}
                        align="center"
                        sx={{ py: 6 }}
                      >
                        <Typography color="text.secondary">
                          No attendance records found.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    records.map((record) => (
                      <TableRow
                        key={record.employee_id}
                        hover
                      >
                        <TableCell>{record.employee_id}</TableCell>

                        <TableCell>
                          <Typography fontWeight="500">
                            {record.first_name} {record.last_name}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          {record.restaurant || "Not Assigned"}
                        </TableCell>

                        <TableCell>{record.role}</TableCell>

                        {period === "today" ? (
                          <>
                            <TableCell>
                              <Chip
                                label={record.status || "Unknown"}
                                color={getStatusColor(record.status)}
                                size="small"
                              />
                            </TableCell>

                            <TableCell>
                              {formatTime(record.check_in)}
                            </TableCell>

                            <TableCell>
                              {formatTime(record.check_out)}
                            </TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell>
                              <Chip
                                label={record.days_present ?? 0}
                                color="success"
                                size="small"
                              />
                            </TableCell>

                            <TableCell>
                              <Chip
                                label={record.days_absent ?? 0}
                                color={
                                  record.days_absent > 0
                                    ? "error"
                                    : "default"
                                }
                                size="small"
                              />
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Box>
    </Box>
  );
}

export default ManagerAttendance;