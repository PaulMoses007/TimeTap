
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = 'https://timetap-backend.onrender.com';

type Profile = {
  id: number;
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  restaurant_id: number | null;
  restaurant_name: string | null;
};

type AttendanceRecord = {
  id: number;
  employee_id: number;
  work_date: string;
  check_in: string;
  check_out: string | null;
  worked_minutes: number;
  worked_hours: number;
  status: string;
};

async function readResponse(response: Response): Promise<any> {
  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      `Unexpected server response (HTTP ${response.status}). Please try again.`,
    );
  }
}

export default function EmployeeDashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<
    'check-in' | 'check-out' | null
  >(null);

  const apiRequest = async (
    path: string,
    method = 'GET',
    body?: object,
  ) => {
    const token = await SecureStore.getItemAsync('timetap_access_token');

    if (!token) {
      router.replace('/login');
      throw new Error('Please log in again.');
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

    const data = await readResponse(response);

    if (response.status === 401 || response.status === 403) {
      await SecureStore.deleteItemAsync('timetap_access_token');
      router.replace('/login');
      throw new Error(
        typeof data.detail === 'string'
          ? data.detail
          : 'Your session expired or access was denied. Please log in again.',
      );
    }

    if (!response.ok) {
      throw new Error(
        typeof data.detail === 'string'
          ? data.detail
          : `Request failed (HTTP ${response.status}).`,
      );
    }

    return data;
  };

  const loadDashboard = useCallback(async () => {
    try {
      const [user, records] = await Promise.all([
        apiRequest('/employees/me'),
        apiRequest('/attendance/my'),
      ]);

      setProfile(user as Profile);
      setHistory(Array.isArray(records) ? records : []);
    } catch (error) {
      console.error('TimeTap employee dashboard error:', error);

      Alert.alert(
        'Unable to load attendance',
        error instanceof Error
          ? error.message
          : 'Please check your connection and try again.',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadDashboard();
    }, [loadDashboard]),
  );

  async function recordAttendance(action: 'check-in' | 'check-out') {
    if (!profile?.restaurant_id) {
      Alert.alert(
        'Restaurant not found',
        'Your account is not assigned to a restaurant. Please contact your manager.',
      );
      return;
    }

    setActionLoading(action);

    try {
      await apiRequest(`/attendance/${action}`, 'POST', {
        restaurant_id: profile.restaurant_id,
      });

      await loadDashboard();

      Alert.alert(
        'Success',
        action === 'check-in'
          ? 'Your check-in has been recorded.'
          : 'Your check-out has been recorded.',
      );
    } catch (error) {
      Alert.alert(
        'Attendance error',
        error instanceof Error
          ? error.message
          : 'Could not record your attendance.',
      );
    } finally {
      setActionLoading(null);
    }
  }

  async function logout() {
    await SecureStore.deleteItemAsync('timetap_access_token');
    router.replace('/login');
  }

  const isCheckedIn = history.some((record) => record.check_out == null);

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#2463EB" />
        <Text style={styles.muted}>Loading your TimeTap account...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void loadDashboard();
            }}
          />
        }
      >
        <Text style={styles.brand}>TimeTap</Text>
        <Text style={styles.heading}>Employee Dashboard</Text>
        <Text style={styles.subtitle}>
          Your attendance and work information.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {profile
              ? `${profile.first_name} ${profile.last_name}`
              : 'Employee'}
          </Text>
          <Text style={styles.info}>ID: {profile?.employee_id ?? '—'}</Text>
          <Text style={styles.info}>Role: {profile?.role ?? '—'}</Text>
          <Text style={styles.info}>
            Restaurant: {profile?.restaurant_name ?? 'Not assigned'}
          </Text>
          <Text style={styles.info}>Email: {profile?.email ?? '—'}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Today's Attendance</Text>
          <Text style={styles.subtitle}>
            Scan your restaurant QR code or use the attendance buttons.
          </Text>

          <Pressable
            style={[
              styles.scanButton,
              actionLoading !== null && styles.disabledButton,
            ]}
            disabled={actionLoading !== null}
            onPress={() => router.push('/scan-qr')}
          >
            <Text style={styles.primaryButtonText}>Scan QR Code</Text>
          </Pressable>

          <Text style={styles.info}>
            {isCheckedIn
              ? 'Your shift is in progress.'
              : 'You are not currently checked in.'}
          </Text>

          <Pressable
            style={[
              styles.primaryButton,
              (actionLoading !== null || isCheckedIn) &&
                styles.disabledButton,
            ]}
            disabled={actionLoading !== null || isCheckedIn}
            onPress={() => recordAttendance('check-in')}
          >
            {actionLoading === 'check-in' ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>
                {isCheckedIn ? 'Already Checked In' : 'Check In'}
              </Text>
            )}
          </Pressable>

          <Pressable
            style={[
              styles.secondaryButton,
              (actionLoading !== null || !isCheckedIn) &&
                styles.disabledButton,
            ]}
            disabled={actionLoading !== null || !isCheckedIn}
            onPress={() => recordAttendance('check-out')}
          >
            {actionLoading === 'check-out' ? (
              <ActivityIndicator color="#2463EB" />
            ) : (
              <Text style={styles.secondaryButtonText}>Check Out</Text>
            )}
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Attendance History</Text>

          {history.length === 0 ? (
            <Text style={styles.info}>
              No attendance records yet. Your shifts will appear here.
            </Text>
          ) : (
            history.map((record) => (
              <View key={record.id} style={styles.historyItem}>
                <Text style={styles.historyDate}>{record.work_date}</Text>
                <Text style={styles.info}>
                  Check-in: {formatTime(record.check_in)}
                </Text>
                <Text style={styles.info}>
                  Check-out: {formatTime(record.check_out)}
                </Text>
                <Text style={styles.info}>
                  Hours worked:{' '}
                  {record.worked_minutes ??
                    Math.round((record.worked_hours ?? 0) * 60)} minutes
                </Text>
                <Text style={styles.info}>Status: {record.status}</Text>
              </View>
            ))
          )}
        </View>

        <Pressable style={styles.logoutButton} onPress={logout}>
          <Text style={styles.primaryButtonText}>Log out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function formatTime(value: string | null) {
  if (!value) return '—';

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7F8FC' },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F8FC',
  },
  container: {
    padding: 24,
    paddingTop: 36,
    paddingBottom: 48,
  },
  brand: { color: '#173D75', fontSize: 32, fontWeight: '800' },
  heading: {
    color: '#172033',
    fontSize: 27,
    fontWeight: '800',
    marginTop: 24,
  },
  subtitle: {
    color: '#64748B',
    fontSize: 16,
    marginTop: 8,
    marginBottom: 24,
    lineHeight: 23,
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#DDE5F0',
    marginBottom: 20,
  },
  cardTitle: {
    color: '#172033',
    fontSize: 21,
    fontWeight: '800',
    marginBottom: 12,
  },
  info: {
    color: '#506078',
    fontSize: 16,
    marginTop: 10,
    lineHeight: 23,
  },
  muted: { color: '#64748B', marginTop: 12 },
  scanButton: {
    backgroundColor: '#173D75',
    padding: 17,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  primaryButton: {
    backgroundColor: '#2463EB',
    padding: 17,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  secondaryButton: {
    backgroundColor: '#E7F0FF',
    padding: 17,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 14,
  },
  disabledButton: { opacity: 0.55 },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  secondaryButtonText: {
    color: '#2463EB',
    fontSize: 17,
    fontWeight: '700',
  },
  historyItem: {
    borderTopWidth: 1,
    borderTopColor: '#E1E7F0',
    paddingTop: 14,
    marginTop: 14,
  },
  historyDate: {
    color: '#172033',
    fontSize: 17,
    fontWeight: '700',
  },
  logoutButton: {
    backgroundColor: '#2463EB',
    padding: 17,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 4,
  },
});
