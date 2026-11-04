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
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';

import { apiRequest } from '../lib/api';
import {
  SOURCE_LABELS,
  formatDate,
  formatMinutes,
  formatTime,
} from '../lib/time';

type Employee = {
  id: number;
  employee_id: string | null;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  role: string;
  restaurant_name: string | null;
  schedule_type: string | null;
  shift_start: string | null;
  shift_end: string | null;
  approval_status: string;
  is_active: boolean;
};

type AttendanceRecord = {
  id: number;
  work_date: string;
  check_in: string;
  check_out: string | null;
  worked_minutes: number;
  source?: string | null;
  check_out_source?: string | null;
};

// Manager view of one employee: details, attendance history, delete
export default function EmployeeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      const [emp, attendance] = await Promise.all([
        apiRequest<Employee>(`/employees/${id}`),
        apiRequest<AttendanceRecord[]>(`/attendance/employee/${id}`),
      ]);

      setEmployee(emp);
      setRecords(Array.isArray(attendance) ? attendance : []);
    } catch (error) {
      Alert.alert(
        'Could not load employee',
        error instanceof Error ? error.message : 'Please try again.',
        [{ text: 'Back', onPress: () => router.back() }],
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  function confirmDelete() {
    if (!employee) return;

    Alert.alert(
      'Delete employee?',
      `${employee.first_name} ${employee.last_name} will lose access and disappear from your team. Past attendance records are kept for your reports.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);

            try {
              await apiRequest(`/employees/${employee.id}`, { method: 'DELETE' });
              router.back();
            } catch (error) {
              Alert.alert(
                'Could not delete',
                error instanceof Error ? error.message : 'Please try again.',
              );
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#2463EB" />
      </SafeAreaView>
    );
  }

  if (!employee) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.empty}>Employee not found.</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backText}>Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const totalMinutes = records.reduce(
    (sum, record) => sum + (record.worked_minutes || 0),
    0,
  );

  const rows: [string, string][] = [
    ['Employee ID', employee.employee_id ?? '—'],
    ['Role', employee.role],
    ['Email', employee.email],
    ['Phone', employee.phone ?? '—'],
    ['Restaurant', employee.restaurant_name ?? 'Not assigned'],
    [
      'Schedule',
      employee.schedule_type === 'Fixed' && employee.shift_start
        ? `Fixed ${employee.shift_start} - ${employee.shift_end}`
        : employee.schedule_type ?? 'Flexible',
    ],
    ['Approval', employee.approval_status],
    ['Account', employee.is_active ? 'Active' : 'Disabled'],
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load();
            }}
          />
        }
      >
        <Text style={styles.heading}>
          {employee.first_name} {employee.last_name}
        </Text>

        <View style={styles.card}>
          {rows.map(([label, value]) => (
            <View key={label} style={styles.row}>
              <Text style={styles.rowLabel}>{label}</Text>
              <Text style={styles.rowValue}>{value}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Attendance history</Text>
        <Text style={styles.meta}>
          {records.length} shift{records.length === 1 ? '' : 's'} · {formatMinutes(totalMinutes)} worked in total
        </Text>

        {records.length === 0 ? (
          <Text style={styles.empty}>No attendance records yet.</Text>
        ) : (
          records.map((record) => (
            <View key={record.id} style={styles.recordCard}>
              <Text style={styles.recordDate}>{formatDate(record.work_date)}</Text>
              <Text style={styles.recordLine}>
                {formatTime(record.check_in)} →{' '}
                {record.check_out ? formatTime(record.check_out) : 'not checked out'}
                {record.check_out ? `  (${formatMinutes(record.worked_minutes)})` : ''}
              </Text>
              <Text style={styles.recordSource}>
                In: {SOURCE_LABELS[record.source ?? ''] ?? '—'}
                {record.check_out
                  ? ` · Out: ${SOURCE_LABELS[record.check_out_source ?? ''] ?? '—'}`
                  : ''}
              </Text>
            </View>
          ))
        )}

        <Pressable
          style={[styles.deleteButton, deleting && { opacity: 0.6 }]}
          disabled={deleting}
          onPress={confirmDelete}
        >
          <Text style={styles.deleteText}>
            {deleting ? 'Deleting…' : 'Delete employee'}
          </Text>
        </Pressable>

        <Pressable style={styles.back} onPress={() => router.back()}>
          <Text style={styles.backText}>Back</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7F8FC' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7F8FC' },
  container: { padding: 24, paddingBottom: 48 },
  heading: { color: '#172033', fontSize: 27, fontWeight: '800', marginBottom: 16 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DDE5F0',
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5EAF2',
    gap: 12,
  },
  rowLabel: { color: '#64748B', fontSize: 14 },
  rowValue: { color: '#172033', fontSize: 15, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
  sectionTitle: { color: '#172033', fontSize: 21, fontWeight: '800', marginTop: 26 },
  meta: { color: '#64748B', fontSize: 14, marginTop: 4, marginBottom: 12 },
  empty: { color: '#64748B', fontSize: 15, marginTop: 8 },
  recordCard: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DDE5F0',
    marginBottom: 10,
  },
  recordDate: { color: '#172033', fontSize: 16, fontWeight: '700' },
  recordLine: { color: '#506078', fontSize: 15, marginTop: 6 },
  recordSource: { color: '#64748B', fontSize: 13, marginTop: 4 },
  deleteButton: {
    borderWidth: 1,
    borderColor: '#DC2626',
    padding: 15,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 28,
  },
  deleteText: { color: '#DC2626', fontSize: 16, fontWeight: '700' },
  back: { alignItems: 'center', padding: 16, marginTop: 8 },
  backText: { color: '#2463EB', fontSize: 16, fontWeight: '700' },
});
