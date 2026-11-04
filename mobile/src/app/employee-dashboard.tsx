
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Alert } from '../lib/alert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { deleteToken } from '../lib/storage';
import { apiRequest as callApi } from '../lib/api';
import HoldButton from '../components/hold-button';
import { SOURCE_LABELS, formatDate, formatMinutes, formatTime } from '../lib/time';

import { API_BASE_URL } from '../lib/config';

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
  source?: string | null;
  check_out_source?: string | null;
};

export default function EmployeeDashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<
    'check-in' | 'check-out' | null
  >(null);

  // Shared client: friendly errors, 401 -> login, 403 is only an error message
  const apiRequest = (path: string, method = 'GET', body?: object) =>
    callApi(path, { method, body });

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
        source: 'button',
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
    try {
      await deleteToken();
      router.replace('/login');
    } catch {
      Alert.alert('Error', 'Could not log out. Please try again.');
    }
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

          <Text style={styles.info}>
            {isCheckedIn
              ? 'Your shift is in progress.'
              : 'You are not currently checked in.'}
          </Text>

          <Text style={styles.sectionLabel}>Main method</Text>

          <Pressable
            style={[
              styles.scanButton,
              actionLoading !== null && styles.disabledButton,
            ]}
            disabled={actionLoading !== null}
            onPress={() => router.push('/scan-qr')}
          >
            <Text style={styles.primaryButtonText}>
              {isCheckedIn ? 'Scan QR to Check Out' : 'Scan QR to Check In'}
            </Text>
          </Pressable>

          <Text style={styles.sectionLabel}>
            No QR code? Press and hold the button
          </Text>

          {isCheckedIn ? (
            <HoldButton
              key="out"
              label="Hold to Check Out"
              variant="secondary"
              loading={actionLoading === 'check-out'}
              disabled={actionLoading !== null}
              onComplete={() => recordAttendance('check-out')}
            />
          ) : (
            <HoldButton
              key="in"
              label="Hold to Check In"
              loading={actionLoading === 'check-in'}
              disabled={actionLoading !== null}
              onComplete={() => recordAttendance('check-in')}
            />
          )}

          <Text style={styles.sectionLabel}>Forgot to check in or out?</Text>

          <Pressable
            style={styles.linkButton}
            onPress={() => router.push('/manual-request')}
          >
            <Text style={styles.linkButtonText}>
              Request manual attendance
            </Text>
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
                <Text style={styles.historyDate}>{formatDate(record.work_date)}</Text>

                <Text style={styles.info}>
                  Check-in: {formatTime(record.check_in)}
                </Text>

                <Text style={styles.info}>
                  Check-out: {formatTime(record.check_out)}
                </Text>

                <Text style={styles.info}>
                  Hours worked:{' '}
                  {record.check_out
                    ? formatMinutes(
                        record.worked_minutes ??
                          Math.round((record.worked_hours ?? 0) * 60),
                      )
                    : '—'}
                </Text>

                <Text style={styles.info}>
                  Via: {SOURCE_LABELS[record.source ?? ''] ?? '—'}
                  {record.check_out
                    ? ` / ${SOURCE_LABELS[record.check_out_source ?? ''] ?? '—'}`
                    : ''}
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
  sectionLabel: {
    color: '#173D75',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 22,
  },
  linkButton: {
    borderWidth: 1,
    borderColor: '#2463EB',
    padding: 15,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  linkButtonText: { color: '#2463EB', fontSize: 16, fontWeight: '700' },
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
