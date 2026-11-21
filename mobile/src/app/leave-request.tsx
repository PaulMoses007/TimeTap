import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Alert } from '../lib/alert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';

import { apiRequest } from '../lib/api';
import { formatDate } from '../lib/time';

type Leave = {
  id: number;
  leave_type: string;
  start_date: string;
  end_date: string;
  days: number;
  reason: string | null;
  status: 'Pending' | 'Approved' | 'Rejected';
  review_note: string | null;
};

const TYPES = ['Vacation', 'Sick', 'Day off', 'Other'];

const STATUS_COLORS = {
  Pending: { bg: '#FEF3C7', text: '#92400E' },
  Approved: { bg: '#DCFCE7', text: '#166534' },
  Rejected: { bg: '#FEE2E2', text: '#991B1B' },
};

const todayRiga = () =>
  new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Riga' });

function period(item: Leave) {
  return item.start_date === item.end_date
    ? formatDate(item.start_date)
    : `${formatDate(item.start_date)} - ${formatDate(item.end_date)}`;
}

// Employee: ask for sick days, vacation or a day off
export default function LeaveRequestScreen() {
  const [leaveType, setLeaveType] = useState('Vacation');
  const [startDate, setStartDate] = useState(todayRiga());
  const [endDate, setEndDate] = useState(todayRiga());
  const [reason, setReason] = useState('');
  const [sending, setSending] = useState(false);

  const [list, setList] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await apiRequest<Leave[]>('/leave/my');
      setList(Array.isArray(data) ? data : []);
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  async function send() {
    const valid = /^\d{4}-\d{2}-\d{2}$/;

    if (!valid.test(startDate.trim()) || !valid.test(endDate.trim())) {
      Alert.alert('Dates', 'Enter the dates like 2026-12-24.');
      return;
    }

    if (endDate.trim() < startDate.trim()) {
      Alert.alert('Dates', 'The last day cannot be before the first day.');
      return;
    }

    setSending(true);

    try {
      await apiRequest('/leave/', {
        method: 'POST',
        body: {
          leave_type: leaveType,
          start_date: startDate.trim(),
          end_date: endDate.trim(),
          reason: reason.trim() || null,
        },
      });

      setReason('');
      Alert.alert('Request sent', 'Your manager will answer it.');
      await load();
    } catch (error) {
      Alert.alert(
        'Could not send the request',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setSending(false);
    }
  }

  async function withdraw(id: number) {
    try {
      await apiRequest(`/leave/${id}`, { method: 'DELETE' });
      await load();
    } catch (error) {
      Alert.alert(
        'Could not withdraw',
        error instanceof Error ? error.message : 'Please try again.',
      );
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.heading}>Request Leave</Text>
          <Text style={styles.subtitle}>
            Sick days, vacation or a day off. Your manager approves or rejects it.
          </Text>

          <View style={styles.card}>
            <Text style={styles.label}>Type</Text>
            <View style={styles.chipRow}>
              {TYPES.map((item) => (
                <Pressable
                  key={item}
                  onPress={() => setLeaveType(item)}
                  style={[styles.chip, leaveType === item && styles.chipActive]}
                >
                  <Text style={[styles.chipText, leaveType === item && styles.chipTextActive]}>
                    {item}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>First day (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              value={startDate}
              onChangeText={setStartDate}
              placeholder="2026-12-24"
              autoCapitalize="none"
            />

            <Text style={styles.label}>Last day (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              value={endDate}
              onChangeText={setEndDate}
              placeholder="2026-12-26"
              autoCapitalize="none"
            />

            <Text style={styles.label}>Reason (optional)</Text>
            <TextInput
              style={[styles.input, { minHeight: 70, textAlignVertical: 'top' }]}
              value={reason}
              onChangeText={setReason}
              multiline
              maxLength={500}
            />

            <Pressable
              style={[styles.saveButton, sending && { opacity: 0.6 }]}
              disabled={sending}
              onPress={send}
            >
              {sending ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveText}>Send request</Text>
              )}
            </Pressable>
          </View>

          <Text style={styles.sectionTitle}>My requests</Text>

          {loading ? (
            <ActivityIndicator color="#2463EB" />
          ) : list.length === 0 ? (
            <Text style={styles.empty}>No leave requests yet.</Text>
          ) : (
            list.map((item) => {
              const colors = STATUS_COLORS[item.status];

              return (
                <View key={item.id} style={styles.item}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.itemTitle}>
                      {item.leave_type}: {period(item)}
                    </Text>
                    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
                      <Text style={[styles.badgeText, { color: colors.text }]}>
                        {item.status}
                      </Text>
                    </View>
                  </View>

                  {item.review_note ? (
                    <Text style={styles.note}>Manager note: {item.review_note}</Text>
                  ) : null}

                  {item.status === 'Pending' && (
                    <Pressable onPress={() => withdraw(item.id)}>
                      <Text style={styles.withdraw}>Withdraw request</Text>
                    </Pressable>
                  )}
                </View>
              );
            })
          )}

          <Pressable style={styles.back} onPress={() => router.back()}>
            <Text style={styles.backText}>Back</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7F8FC' },
  container: { padding: 24, paddingBottom: 48 },
  heading: { color: '#172033', fontSize: 27, fontWeight: '800' },
  subtitle: { color: '#64748B', fontSize: 15, marginTop: 8, marginBottom: 18, lineHeight: 22 },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#DDE5F0',
    marginBottom: 24,
  },
  label: { color: '#506078', fontSize: 14, fontWeight: '600', marginTop: 12, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#DDE5F0',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 9, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#EEF2F8' },
  chipActive: { backgroundColor: '#2463EB' },
  chipText: { color: '#506078', fontSize: 14, fontWeight: '600' },
  chipTextActive: { color: '#FFFFFF' },
  saveButton: {
    backgroundColor: '#2463EB',
    padding: 15,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  saveText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  sectionTitle: { color: '#172033', fontSize: 20, fontWeight: '800', marginBottom: 12 },
  empty: { color: '#64748B', fontSize: 15 },
  item: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DDE5F0',
    marginBottom: 10,
  },
  itemTitle: { flex: 1, color: '#172033', fontSize: 15, fontWeight: '700' },
  badge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  note: { color: '#173D75', fontSize: 14, marginTop: 6, fontStyle: 'italic' },
  withdraw: { color: '#DC2626', fontSize: 14, fontWeight: '700', marginTop: 8 },
  back: { alignItems: 'center', padding: 16, marginTop: 8 },
  backText: { color: '#2463EB', fontSize: 16, fontWeight: '700' },
});
