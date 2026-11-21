
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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

type RangeKey = 'week' | 'month' | 'custom' | 'all';

const RANGES: { key: RangeKey; label: string }[] = [
  { key: 'week', label: 'This week' },
  { key: 'month', label: 'This month' },
  { key: 'custom', label: 'Custom dates' },
  { key: 'all', label: 'All' },
];

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// Plain "YYYY-MM-DD" arithmetic (no time zones involved)
function addDays(isoDate: string, days: number) {
  const date = new Date(`${isoDate}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function todayRiga() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Riga' });
}

function mondayOf(isoDate: string) {
  const day = new Date(`${isoDate}T12:00:00Z`).getUTCDay(); // 0 = Sunday
  return addDays(isoDate, -((day + 6) % 7));
}

export default function EmployeeDashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [range, setRange] = useState<RangeKey>('week');
  const [fromDate, setFromDate] = useState(() => todayRiga().slice(0, 8) + '01');
  const [toDate, setToDate] = useState(() => todayRiga());
  const [shifts, setShifts] = useState<
    { id: number; work_date: string; start_time: string; end_time: string; note: string | null }[]
  >([]);
  const [hours, setHours] = useState<{
    week: { total_minutes: number; days_worked: number };
    month: { total_minutes: number; days_worked: number };
  } | null>(null);
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

      // extras: a failure here must not break the check-in screen
      apiRequest('/roster/my')
        .then((data) => setShifts(Array.isArray(data) ? (data as typeof shifts) : []))
        .catch(() => setShifts([]));

      apiRequest('/attendance/my-summary')
        .then((data) => setHours(data as typeof hours))
        .catch(() => setHours(null));
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

  // Attendance History filter: this week, this month, your own dates, or all
  const today = todayRiga();
  let rangeStart = '0000-01-01';
  let rangeEnd = '9999-12-31';
  let rangeError = '';

  if (range === 'week') {
    rangeStart = mondayOf(today);
    rangeEnd = addDays(rangeStart, 6);
  } else if (range === 'month') {
    rangeStart = today.slice(0, 8) + '01';
    // "31" is fine as an upper bound: dates are compared as text
    rangeEnd = today.slice(0, 8) + '31';
  } else if (range === 'custom') {
    if (!DATE_PATTERN.test(fromDate.trim()) || !DATE_PATTERN.test(toDate.trim())) {
      rangeError = 'Enter both dates like 2026-11-01.';
    } else if (toDate.trim() < fromDate.trim()) {
      rangeError = 'The last day cannot be before the first day.';
    } else {
      rangeStart = fromDate.trim();
      rangeEnd = toDate.trim();
    }
  }

  const visibleHistory = rangeError
    ? []
    : history.filter(
        (record) => record.work_date >= rangeStart && record.work_date <= rangeEnd,
      );

  const visibleMinutes = visibleHistory.reduce(
    (sum, record) =>
      sum +
      (record.check_out
        ? (record.worked_minutes ?? Math.round((record.worked_hours ?? 0) * 60))
        : 0),
    0,
  );

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
          <Text style={styles.cardTitle}>My hours</Text>

          <Text style={styles.info}>
            This week: {hours ? formatMinutes(hours.week.total_minutes) : '—'}
            {hours ? ` (${hours.week.days_worked} ${hours.week.days_worked === 1 ? 'day' : 'days'})` : ''}
          </Text>
          <Text style={styles.info}>
            This month: {hours ? formatMinutes(hours.month.total_minutes) : '—'}
            {hours ? ` (${hours.month.days_worked} ${hours.month.days_worked === 1 ? 'day' : 'days'})` : ''}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>My next shifts</Text>

          {shifts.length === 0 ? (
            <Text style={styles.info}>No shifts planned for the next two weeks.</Text>
          ) : (
            shifts.map((shift) => (
              <Text key={shift.id} style={styles.info}>
                {formatDate(shift.work_date)}: {shift.start_time} - {shift.end_time}
                {shift.note ? ` (${shift.note})` : ''}
              </Text>
            ))
          )}

          <Pressable
            style={[styles.linkButton, { marginTop: 14 }]}
            onPress={() => router.push('/leave-request')}
          >
            <Text style={styles.linkButtonText}>Request leave</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Attendance History</Text>

          <View style={styles.rangeRow}>
            {RANGES.map((item) => (
              <Pressable
                key={item.key}
                onPress={() => setRange(item.key)}
                style={[styles.rangeChip, range === item.key && styles.rangeChipActive]}
              >
                <Text
                  style={[styles.rangeText, range === item.key && styles.rangeTextActive]}
                >
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {range === 'custom' && (
            <View style={styles.dateRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.dateLabel}>From (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.dateInput}
                  value={fromDate}
                  onChangeText={setFromDate}
                  placeholder="2026-11-01"
                  autoCapitalize="none"
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.dateLabel}>To (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.dateInput}
                  value={toDate}
                  onChangeText={setToDate}
                  placeholder="2026-11-30"
                  autoCapitalize="none"
                />
              </View>
            </View>
          )}

          {rangeError ? (
            <Text style={styles.rangeError}>{rangeError}</Text>
          ) : (
            <Text style={styles.rangeTotal}>
              {visibleHistory.length} shift{visibleHistory.length === 1 ? '' : 's'} ·{' '}
              {formatMinutes(visibleMinutes)} worked
            </Text>
          )}

          {history.length === 0 ? (
            <Text style={styles.info}>
              No attendance records yet. Your shifts will appear here.
            </Text>
          ) : visibleHistory.length === 0 ? (
            !rangeError && (
              <Text style={styles.info}>No attendance records in this period.</Text>
            )
          ) : (
            visibleHistory.map((record) => (
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
  rangeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  rangeChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#EEF2F8',
  },
  rangeChipActive: { backgroundColor: '#2463EB' },
  rangeText: { color: '#506078', fontSize: 14, fontWeight: '600' },
  rangeTextActive: { color: '#FFFFFF' },
  dateRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  dateLabel: { color: '#506078', fontSize: 13, fontWeight: '600', marginBottom: 6 },
  dateInput: {
    borderWidth: 1,
    borderColor: '#DDE5F0',
    borderRadius: 12,
    padding: 10,
    fontSize: 15,
    backgroundColor: '#FFFFFF',
  },
  rangeTotal: { color: '#173D75', fontSize: 15, fontWeight: '700', marginTop: 14, marginBottom: 4 },
  rangeError: { color: '#DC2626', fontSize: 14, marginTop: 12 },
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
