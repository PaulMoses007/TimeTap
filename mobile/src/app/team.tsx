
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import * as SecureStore from "expo-secure-store";

const API_BASE_URL = "https://dry-clouds-thank.loca.lt";

type Employee = {
  id: number;
  employee_id?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
  restaurant_name?: string | null;
  approval_status?: string | null;
  is_active?: boolean;
};

type AttendanceRecord = {
  id: number;
  employee_id?: number;
  work_date?: string | null;
  check_in?: string | null;
  check_out?: string | null;
  worked_minutes?: number | null;
  worked_hours?: number | null;
  status?: string | null;
};

export default function TeamScreen() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [pendingEmployees, setPendingEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyEmployeeId, setBusyEmployeeId] = useState<number | null>(null);

  const getToken = async () => {
    const token = await SecureStore.getItemAsync("timetap_access_token");

    if (!token) {
      router.replace("/login");
      return null;
    }

    return token;
  };

  const requestHeaders = (token: string) => ({
    Authorization: `Bearer ${token}`,
    "Bypass-Tunnel-Reminder": "true",
  });

  const fetchEmployees = async () => {
    const token = await getToken();
    if (!token) return;

    const response = await fetch(`${API_BASE_URL}/employees/`, {
      headers: requestHeaders(token),
    });

    if (response.status === 401 || response.status === 403) {
      await SecureStore.deleteItemAsync("timetap_access_token");
      router.replace("/login");
      throw new Error("Your session has expired. Please log in again.");
    }

    if (!response.ok) {
      throw new Error("Could not load employees.");
    }

    const data = await response.json();
    setEmployees(Array.isArray(data) ? data : []);
  };

  const fetchPendingEmployees = async () => {
    const token = await getToken();
    if (!token) return;

    const response = await fetch(`${API_BASE_URL}/employees/pending`, {
      headers: requestHeaders(token),
    });

    if (response.status === 401 || response.status === 403) {
      await SecureStore.deleteItemAsync("timetap_access_token");
      router.replace("/login");
      throw new Error("Your session has expired. Please log in again.");
    }

    if (!response.ok) {
      throw new Error("Could not load pending employee requests.");
    }

    const data = await response.json();
    setPendingEmployees(Array.isArray(data) ? data : []);
  };

  const loadTeam = async (showErrors = true) => {
    try {
      await Promise.all([fetchEmployees(), fetchPendingEmployees()]);
    } catch (error) {
      if (showErrors) {
        Alert.alert(
          "Error",
          error instanceof Error ? error.message : "Could not load the team."
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void loadTeam();
    }, [])
  );

  const refreshTeam = () => {
    setRefreshing(true);
    void loadTeam();
  };

  const getEmployeeName = (employee: Employee) => {
    const name =
      `${employee.first_name ?? ""} ${employee.last_name ?? ""}`.trim();

    return name || employee.email || `Employee #${employee.id}`;
  };

  const formatDateTime = (value?: string | null) => {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString();
  };

  const formatDuration = (record: AttendanceRecord) => {
    const minutes =
      typeof record.worked_minutes === "number"
        ? record.worked_minutes
        : typeof record.worked_hours === "number"
          ? Math.round(record.worked_hours * 60)
          : null;

    if (minutes === null) {
      return record.check_out ? "Not recorded" : "In progress";
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours === 0) return `${remainingMinutes} min`;
    if (remainingMinutes === 0) return `${hours} hr`;

    return `${hours} hr ${remainingMinutes} min`;
  };

  const fetchEmployeeAttendance = async (employee: Employee) => {
    try {
      const token = await getToken();
      if (!token) return;

      const response = await fetch(
        `${API_BASE_URL}/attendance/employee/${employee.id}`,
        {
          headers: requestHeaders(token),
        }
      );

      if (response.status === 401 || response.status === 403) {
        await SecureStore.deleteItemAsync("timetap_access_token");
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        throw new Error("Could not load attendance history.");
      }

      const data = await response.json();
      const records: AttendanceRecord[] = Array.isArray(data) ? data : [];

      if (records.length === 0) {
        Alert.alert(
          "Attendance History",
          `No attendance records found for ${getEmployeeName(employee)}.`
        );
        return;
      }

      const history = records
        .map((record, index) => {
          const duration = formatDuration(record);

          return (
            `${index + 1}. Date: ${record.work_date ?? "—"}\n` +
            `Check-in: ${formatDateTime(record.check_in)}\n` +
            `Check-out: ${formatDateTime(record.check_out)}\n` +
            `Duration: ${duration}\n` +
            `Status: ${record.status ?? "—"}`
          );
        })
        .join("\n\n");

      Alert.alert(
        `Attendance: ${getEmployeeName(employee)}`,
        history,
        [{ text: "Close" }]
      );
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "Could not load attendance history."
      );
    }
  };

  const showEmployeeDetails = (employee: Employee) => {
    const details =
      `Employee ID: ${employee.employee_id ?? employee.id}\n` +
      `Email: ${employee.email ?? "—"}\n` +
      `Phone: ${employee.phone ?? "—"}\n` +
      `Role: ${employee.role ?? "Employee"}\n` +
      `Restaurant: ${employee.restaurant_name ?? "—"}\n` +
      `Account: ${employee.is_active === false ? "Inactive" : "Active"}\n` +
      `Approval: ${employee.approval_status ?? "Unknown"}`;

    const buttons: {
      text: string;
      onPress?: () => void;
      style?: "cancel" | "default" | "destructive";
    }[] = [
      { text: "Close", style: "cancel" },
    ];

    if ((employee.role ?? "").toLowerCase() !== "manager") {
      buttons.push({
        text: "View Attendance",
        onPress: () => {
          void fetchEmployeeAttendance(employee);
        },
      });
    }

    Alert.alert(getEmployeeName(employee), details, buttons);
  };

  const reviewEmployee = (
    employee: Employee,
    action: "approve" | "reject"
  ) => {
    const employeeName = getEmployeeName(employee);

    Alert.alert(
      action === "approve" ? "Approve Employee" : "Reject Employee",
      `Are you sure you want to ${
        action === "approve" ? "approve" : "reject"
      } ${employeeName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: action === "approve" ? "Approve" : "Reject",
          style: action === "reject" ? "destructive" : "default",
          onPress: async () => {
            setBusyEmployeeId(employee.id);

            try {
              const token = await getToken();
              if (!token) return;

              const response = await fetch(
                `${API_BASE_URL}/employees/${employee.id}/${action}`,
                {
                  method: "PUT",
                  headers: requestHeaders(token),
                }
              );

              const result = await response.json().catch(() => null);

              if (response.status === 401 || response.status === 403) {
                await SecureStore.deleteItemAsync("timetap_access_token");
                router.replace("/login");
                return;
              }

              if (!response.ok) {
                throw new Error(
                  result?.detail ??
                    `Could not ${action} this employee.`
                );
              }

              Alert.alert(
                "Success",
                `${employeeName} has been ${
                  action === "approve" ? "approved" : "rejected"
                }.`
              );

              await loadTeam(false);
            } catch (error) {
              Alert.alert(
                "Error",
                error instanceof Error
                  ? error.message
                  : "Something went wrong."
              );
            } finally {
              setBusyEmployeeId(null);
            }
          },
        },
      ]
    );
  };

  const renderEmployeeCard = (
    employee: Employee,
    isPending = false
  ) => {
    const isBusy = busyEmployeeId === employee.id;
    const status = employee.approval_status ?? "Unknown";

    return (
      <View key={employee.id} style={styles.employeeCard}>
        <View style={styles.employeeHeader}>
          <View style={styles.employeeInfo}>
            <Text style={styles.employeeName}>
              {getEmployeeName(employee)}
            </Text>
            <Text style={styles.employeeEmail}>
              {employee.email ?? "No email provided"}
            </Text>
            <Text style={styles.employeeRole}>
              {employee.role ?? "Employee"}
            </Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              isPending
                ? styles.pendingBadge
                : status.toLowerCase() === "approved"
                  ? styles.approvedBadge
                  : status.toLowerCase() === "rejected"
                    ? styles.rejectedBadge
                    : styles.neutralBadge,
            ]}
          >
            <Text style={styles.statusText}>{status}</Text>
          </View>
        </View>

        <Text style={styles.restaurantText}>
          Restaurant: {employee.restaurant_name ?? "Not specified"}
        </Text>

        <Text style={styles.activeText}>
          Account: {employee.is_active === false ? "Inactive" : "Active"}
        </Text>

        <TouchableOpacity
          style={styles.detailsButton}
          onPress={() => showEmployeeDetails(employee)}
        >
          <Text style={styles.detailsButtonText}>View Details</Text>
        </TouchableOpacity>

        {isPending && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[
                styles.approveButton,
                isBusy && styles.disabledButton,
              ]}
              disabled={isBusy}
              onPress={() => reviewEmployee(employee, "approve")}
            >
              <Text style={styles.actionButtonText}>
                {isBusy ? "Please wait..." : "Approve"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.rejectButton,
                isBusy && styles.disabledButton,
              ]}
              disabled={isBusy}
              onPress={() => reviewEmployee(employee, "reject")}
            >
              <Text style={styles.actionButtonText}>
                {isBusy ? "Please wait..." : "Reject"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading your team...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshTeam}
          />
        }
      >
        <View style={styles.pageHeader}>
          <View>
            <Text style={styles.title}>Your Team</Text>
            <Text style={styles.subtitle}>
              Manage employees and approval requests
            </Text>
          </View>

          <TouchableOpacity
            style={styles.refreshButton}
            onPress={refreshTeam}
          >
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Employees</Text>
          <Text style={styles.summaryNumber}>{employees.length}</Text>
          <Text style={styles.summaryNote}>
            {pendingEmployees.length} pending approval
            {pendingEmployees.length === 1 ? "" : "s"}
          </Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Pending Requests</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>
              {pendingEmployees.length}
            </Text>
          </View>
        </View>

        {pendingEmployees.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No pending requests</Text>
            <Text style={styles.emptyText}>
              New employee registration requests will appear here.
            </Text>
          </View>
        ) : (
          pendingEmployees.map((employee) =>
            renderEmployeeCard(employee, true)
          )
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>All Employees</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>
              {employees.length}
            </Text>
          </View>
        </View>

        {employees.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No employees found</Text>
            <Text style={styles.emptyText}>
              Employees connected to your restaurants will appear here.
            </Text>
          </View>
        ) : (
          employees.map((employee) => renderEmployeeCard(employee))
        )}

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f6fb",
  },
  content: {
    padding: 18,
    paddingBottom: 36,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f3f6fb",
  },
  loadingText: {
    marginTop: 12,
    color: "#475569",
    fontSize: 15,
  },
  pageHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#172554",
  },
  subtitle: {
    marginTop: 5,
    fontSize: 13,
    color: "#64748b",
  },
  refreshButton: {
    backgroundColor: "#dbeafe",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  refreshButtonText: {
    color: "#1d4ed8",
    fontWeight: "700",
  },
  summaryCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  summaryLabel: {
    color: "#64748b",
    fontSize: 14,
    fontWeight: "600",
  },
  summaryNumber: {
    marginTop: 5,
    color: "#172554",
    fontSize: 36,
    fontWeight: "800",
  },
  summaryNote: {
    marginTop: 5,
    color: "#b45309",
    fontSize: 13,
    fontWeight: "600",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    marginTop: 4,
  },
  sectionTitle: {
    color: "#172554",
    fontSize: 20,
    fontWeight: "800",
  },
  countBadge: {
    marginLeft: 10,
    minWidth: 26,
    height: 26,
    paddingHorizontal: 7,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#dbeafe",
  },
  countBadgeText: {
    color: "#1d4ed8",
    fontWeight: "800",
    fontSize: 12,
  },
  employeeCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  employeeHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  employeeInfo: {
    flex: 1,
    paddingRight: 8,
  },
  employeeName: {
    color: "#172554",
    fontSize: 17,
    fontWeight: "800",
  },
  employeeEmail: {
    marginTop: 4,
    color: "#64748b",
    fontSize: 13,
  },
  employeeRole: {
    marginTop: 5,
    color: "#475569",
    fontSize: 13,
    textTransform: "capitalize",
  },
  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
  },
  pendingBadge: {
    backgroundColor: "#fef3c7",
  },
  approvedBadge: {
    backgroundColor: "#dcfce7",
  },
  rejectedBadge: {
    backgroundColor: "#fee2e2",
  },
  neutralBadge: {
    backgroundColor: "#e2e8f0",
  },
  statusText: {
    color: "#334155",
    fontSize: 11,
    fontWeight: "800",
  },
  restaurantText: {
    marginTop: 12,
    color: "#475569",
    fontSize: 13,
  },
  activeText: {
    marginTop: 5,
    color: "#475569",
    fontSize: 13,
  },
  detailsButton: {
    marginTop: 14,
    paddingVertical: 10,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#bfdbfe",
    alignItems: "center",
  },
  detailsButtonText: {
    color: "#1d4ed8",
    fontSize: 13,
    fontWeight: "700",
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  approveButton: {
    flex: 1,
    backgroundColor: "#15803d",
    paddingVertical: 12,
    borderRadius: 9,
    alignItems: "center",
  },
  rejectButton: {
    flex: 1,
    backgroundColor: "#dc2626",
    paddingVertical: 12,
    borderRadius: 9,
    alignItems: "center",
  },
  disabledButton: {
    opacity: 0.55,
  },
  actionButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
  },
  emptyCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  emptyTitle: {
    color: "#172554",
    fontSize: 15,
    fontWeight: "800",
  },
  emptyText: {
    marginTop: 6,
    color: "#64748b",
    fontSize: 13,
    lineHeight: 19,
  },
  backButton: {
    marginTop: 12,
    backgroundColor: "#e2e8f0",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  backButtonText: {
    color: "#334155",
    fontWeight: "800",
    fontSize: 14,
  },
});
