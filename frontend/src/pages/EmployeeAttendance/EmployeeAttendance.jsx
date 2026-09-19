import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Alert,
  Avatar,
  Box,
  CircularProgress,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
} from "@mui/material";

import AccessTimeIcon from "@mui/icons-material/AccessTime";
import DashboardIcon from "@mui/icons-material/Dashboard";
import HistoryIcon from "@mui/icons-material/History";
import PersonIcon from "@mui/icons-material/Person";
import LogoutIcon from "@mui/icons-material/Logout";

import {
  getMyAttendance,
} from "../../services/attendanceService";

const drawerWidth = 300;

function EmployeeAttendance() {
  const navigate = useNavigate();

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadHistory = async () => {
      const token =
        localStorage.getItem("access_token");

      if (!token) {
        navigate("/");
        return;
      }

      try {
        setError("");

        const data =
          await getMyAttendance();

        setRecords(
          Array.isArray(data)
            ? data
            : []
        );
      } catch (err) {
        console.error(err);

        if (
          err.response?.status === 401
        ) {
          localStorage.removeItem(
            "access_token"
          );

          navigate("/");
          return;
        }

        setError(
          err.response?.data?.detail ||
            "Failed to load attendance history."
        );
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem(
      "access_token"
    );

    window.location.href = "/";
  };

  const formatDate = (value) => {
    if (!value) {
      return "-";
    }

    return new Date(
      `${value}T00:00:00`
    ).toLocaleDateString(
      undefined,
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      }
    );
  };

  const formatTime = (value) => {
    if (!value) {
      return "-";
    }

    return new Date(value).toLocaleTimeString(
      [],
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  const formatHours = (record) => {
    if (
      record.worked_hours === null ||
      record.worked_hours === undefined
    ) {
      return "-";
    }

    return `${record.worked_hours} hrs`;
  };

  const getStatusColor = (status) => {
    if (status === "Present") {
      return "success";
    }

    if (status === "Absent") {
      return "error";
    }

    return "default";
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
      }}
    >
      {/* SIDEBAR */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,

          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            borderRight:
              "1px solid #e0e0e0",
          },
        }}
      >
        {/* LOGO */}
        <Box
          sx={{
            height: 80,
            display: "flex",
            alignItems: "center",
            px: 3,
          }}
        >
          <Avatar
            sx={{
              mr: 1.5,
              bgcolor: "primary.main",
            }}
          >
            <AccessTimeIcon />
          </Avatar>

          <Typography
            variant="h5"
            fontWeight="bold"
            color="primary"
          >
            TimeTap
          </Typography>
        </Box>

        <Divider />

        {/* USER */}
        <Box
          sx={{
            px: 2,
            py: 3,
          }}
        >
          <Typography
            variant="body2"
            color="text.secondary"
          >
            Logged in as
          </Typography>

          <Typography
            variant="subtitle1"
            fontWeight="bold"
          >
            Employee
          </Typography>
        </Box>

        {/* MENU */}
        <List sx={{ px: 1 }}>
          <ListItemButton
            onClick={() =>
              navigate(
                "/employee-dashboard"
              )
            }
            sx={{
              borderRadius: 2,
              mb: 0.5,
            }}
          >
            <ListItemIcon
              sx={{ minWidth: 42 }}
            >
              <DashboardIcon />
            </ListItemIcon>

            <ListItemText
              primary="Dashboard"
            />
          </ListItemButton>

          <ListItemButton
            selected
            sx={{
              borderRadius: 2,
              mb: 0.5,
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 42,
                color: "primary.main",
              }}
            >
              <HistoryIcon />
            </ListItemIcon>

            <ListItemText
              primary="Attendance History"
            />
          </ListItemButton>

          <ListItemButton
            sx={{
              borderRadius: 2,
              mb: 0.5,
            }}
          >
            <ListItemIcon
              sx={{ minWidth: 42 }}
            >
              <PersonIcon />
            </ListItemIcon>

            <ListItemText
              primary="My Profile"
            />
          </ListItemButton>
        </List>

        {/* LOGOUT */}
        <Box
          sx={{
            mt: "auto",
            p: 1,
          }}
        >
          <Divider sx={{ mb: 1 }} />

          <ListItemButton
            onClick={handleLogout}
            sx={{
              borderRadius: 2,
            }}
          >
            <ListItemIcon
              sx={{ minWidth: 42 }}
            >
              <LogoutIcon />
            </ListItemIcon>

            <ListItemText
              primary="Logout"
            />
          </ListItemButton>
        </Box>
      </Drawer>

      {/* MAIN CONTENT */}
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
            maxWidth: 1400,
            mx: "auto",
            py: 5,
            px: {
              xs: 2,
              md: 4,
            },
          }}
        >
          {/* HEADER */}
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="h4"
              fontWeight="bold"
            >
              Attendance History
            </Typography>

            <Typography
              color="text.secondary"
              sx={{ mt: 0.5 }}
            >
              View your previous attendance
              records and worked hours.
            </Typography>
          </Box>

          {error && (
            <Alert
              severity="error"
              sx={{ mb: 3 }}
            >
              {error}
            </Alert>
          )}

          {/* TABLE */}
          <TableContainer
            component={Paper}
            elevation={0}
            sx={{
              border:
                "1px solid #e4e7eb",
              borderRadius: 3,
              overflow: "hidden",
            }}
          >
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <strong>Date</strong>
                  </TableCell>

                  <TableCell>
                    <strong>Check In</strong>
                  </TableCell>

                  <TableCell>
                    <strong>Check Out</strong>
                  </TableCell>

                  <TableCell>
                    <strong>Worked Minutes</strong>
                  </TableCell>

                  <TableCell>
                    <strong>Worked Hours</strong>
                  </TableCell>

                  <TableCell>
                    <strong>Status</strong>
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {records.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      align="center"
                      sx={{ py: 6 }}
                    >
                      <Typography
                        color="text.secondary"
                      >
                        No attendance records
                        found.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  records.map(
                    (record) => (
                      <TableRow
                        key={record.id}
                        hover
                      >
                        <TableCell>
                          {formatDate(
                            record.work_date
                          )}
                        </TableCell>

                        <TableCell>
                          {formatTime(
                            record.check_in
                          )}
                        </TableCell>

                        <TableCell>
                          {formatTime(
                            record.check_out
                          )}
                        </TableCell>

                        <TableCell>
                          {record.worked_minutes ??
                            0}
                        </TableCell>

                        <TableCell>
                          {formatHours(
                            record
                          )}
                        </TableCell>

                        <TableCell>
                          <Chip
                            label={
                              record.status ||
                              "Unknown"
                            }
                            color={getStatusColor(
                              record.status
                            )}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    )
                  )
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Box>
    </Box>
  );
}

export default EmployeeAttendance;