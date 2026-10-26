
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = 'https://tiny-badgers-ring.loca.lt';

type AttendanceRecord = {
  employee_id: string;
  first_name?: string | null;
  last_name?: string | null;
  restaurant?: string | null;
  role?: string | null;
  status: string;
  check_in?: string | null;
  check_out?: string | null;
};

export default function AttendanceScreen() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAttendance = useCallback(async (refresh = false) => {
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const token = await SecureStore.getItemAsync(
        'timetap_access_token',
      );

      if (!token) {
        router.replace('/login');
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/attendance/today`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
            'Bypass-Tunnel-Reminder': 'true',
          },
        },
      );

      const responseText = await response.text();
      let data: any;

      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(
          `Unexpected server response (HTTP ${response.status}). Check the API connection.`,
        );
      }

      if (response.status === 401 || response.status === 403) {
        await SecureStore.deleteItemAsync('timetap_access_token');
        router.replace('/login');
        return;
      }

      if (!response.ok) {
        throw new Error(
          typeof data.detail === 'string'
            ? data.detail
            : `Unable to load attendance (HTTP ${response.status}).`,
        );
      }

      if (!Array.isArray(data)) {
        throw new Error('The server returned an unexpected attendance list.');
      }

      setRecords(data);
    } catch (error) {
      console.error('Load attendance error:', error);
      Alert.alert(
        'Unable to load attendance',
        error instanceof Error
          ? error.message
          : 'Check your connection and try again.',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAttendance();
    }, [loadAttendance]),
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#2463EB" />
        <Text style={styles.muted}>Loading attendance...</Text>
      </SafeAreaView>
    );
  }

  const working = records.filter((r) => r.status === 'Working').length;
  const checkedOut = records.filter((r) => r.status === 'Checked Out').length;
  const absent = records.filter((r) => r.status === 'Absent').length;

  function formatTime(value?: string | null) {
    if (!value) return '—';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadAttendance(true)}
          />
        }
      >
        <Pressable onPress={() => router.replace('/manager-dashboard')}>
          <Text style={styles.back}>‹ Back to dashboard</Text>
        </Pressable>

        <Text style={styles.brand}>TimeTap</Text>
        <Text style={styles.heading}>Employee Attendance</Text>
        <Text style={styles.subtitle}>
          Today's attendance at your restaurant.
        </Text>

        <View style={styles.summaryRow}>
          <View style={styles.summary}>
            <Text style={styles.summaryNumber}>{working}</Text>
            <Text style={styles.summaryLabel}>Working</Text>
          </View>
          <View style={styles.summary}>
            <Text style={styles.summaryNumber}>{checkedOut}</Text>
            <Text style={styles.summaryLabel}>Checked out</Text>
          </View>
          <View style={styles.summary}>
            <Text style={styles.summaryNumber}>{absent}</Text>
            <Text style={styles.summaryLabel}>Absent</Text>
          </View>
        </View>

        {records.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>No employees found</Text>
            <Text style={styles.detail}>
              No employee attendance records were returned for this restaurant.
            </Text>
          </View>
        ) : (
          records.map((record, index) => {
            const fullName = [
              record.first_name,
              record.last_name,
            ]
              .filter(Boolean)
              .join(' ') || record.employee_id;

            return (
              <View key={`${record.employee_id}-${index}`} style={styles.card}>
                <Text style={styles.cardTitle}>{fullName}</Text>
                <Text style={styles.employeeId}>
                  ID: {record.employee_id}
                </Text>
                <Text style={styles.detail}>
                  Role: {record.role || 'Not specified'}
                </Text>
                <Text style={styles.detail}>
                  Check-in: {formatTime(record.check_in)}
                </Text>
                <Text style={styles.detail}>
                  Check-out: {formatTime(record.check_out)}
                </Text>

                <Text
                  style={[
                    styles.status,
                    record.status === 'Working'
                      ? styles.workingStatus
                      : record.status === 'Absent'
                        ? styles.absentStatus
                        : styles.checkedOutStatus,
                  ]}
                >
                  {record.status}
                </Text>
              </View>
            );
          })
        )}

        <Text style={styles.footer}>
          Pull down to refresh attendance.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F8FC',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7F8FC',
  },
  container: {
    padding: 24,
    paddingTop: 20,
  },
  back: {
    color: '#2463EB',
    fontSize: 16,
    marginBottom: 24,
  },
  brand: {
    color: '#173D75',
    fontSize: 30,
    fontWeight: '800',
  },
  heading: {
    color: '#172033',
    fontSize: 27,
    fontWeight: '800',
    marginTop: 18,
  },
  subtitle: {
    color: '#64748B',
    fontSize: 15,
    marginTop: 8,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  summary: {
    flex: 1,
    backgroundColor: '#E8F1FF',
    padding: 12,
    borderRadius: 12,
  },
  summaryNumber: {
    color: '#173D75',
    fontSize: 24,
    fontWeight: '800',
  },
  summaryLabel: {
    color: '#475569',
    fontSize: 12,
    marginTop: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDE5F0',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
  },
  cardTitle: {
    color: '#172033',
    fontSize: 18,
    fontWeight: '700',
  },
  employeeId: {
    color: '#2463EB',
    fontSize: 13,
    marginTop: 5,
    marginBottom: 12,
  },
  detail: {
    color: '#475569',
    fontSize: 14,
    marginBottom: 9,
  },
  status: {
    alignSelf: 'flex-start',
    overflow: 'hidden',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 6,
  },
  workingStatus: {
    backgroundColor: '#DCFCE7',
    color: '#166534',
  },
  absentStatus: {
    backgroundColor: '#FEE2E2',
    color: '#991B1B',
  },
  checkedOutStatus: {
    backgroundColor: '#DBEAFE',
    color: '#1D4ED8',
  },
  muted: {
    color: '#64748B',
    marginTop: 10,
  },
  footer: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
});
