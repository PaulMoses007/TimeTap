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
import {
  addDays,
  formatDate,
  formatDateTime,
  todayInRiga,
} from '../lib/time';

type Kind = 'in' | 'out' | 'both';

type ManualRequest = {
  id: number;
  work_date: string;
  requested_check_in: string | null;
  requested_check_out: string | null;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  review_note: string | null;
};

const KINDS: { value: Kind; label: string }[] = [
  { value: 'in', label: 'Missed check-in' },
  { value: 'out', label: 'Missed check-out' },
  { value: 'both', label: 'Whole shift' },
];

const TIME_PATTERN = /^([01]?\d|2[0-3]):([0-5]\d)$/;

function normalizeTime(value: string): string | null {
  const match = value.trim().match(TIME_PATTERN);
  if (!match) return null;

  return `${match[1].padStart(2, '0')}:${match[2]}`;
}

const STATUS_COLORS = {
  Pending: { bg: '#FEF3C7', text: '#92400E' },
  Approved: { bg: '#DCFCE7', text: '#166534' },
  Rejected: { bg: '#FEE2E2', text: '#991B1B' },
};

export default function ManualRequestScreen() {
  const today = todayInRiga();
  // today and the 6 days before it
  const dates = Array.from({ length: 7 }, (_, i) => addDays(today, -i));

  const [kind, setKind] = useState<Kind>('both');
  const [date, setDate] = useState(today);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [requests, setRequests] = useState<ManualRequest[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  const loadRequests = useCallback(async () => {
    try {
      const data = await apiRequest<ManualRequest[]>(
        '/attendance/manual-requests/my',
      );
      setRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Could not load manual requests', error);
    } finally {
      setLoadingList(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadRequests();
    }, [loadRequests]),
  );

  const needsIn = kind === 'in' || kind === 'both';
  const needsOut = kind === 'out' || kind === 'both';

  async function submit() {
    const inTime = needsIn ? normalizeTime(checkIn) : null;
    const outTime = needsOut ? normalizeTime(checkOut) : null;

    if (needsIn && !inTime) {
      Alert.alert('Check-in time', 'Enter the time as HH:MM, for example 09:00.');
      return;
    }

    if (needsOut && !outTime) {
      Alert.alert('Check-out time', 'Enter the time as HH:MM, for example 17:30.');
      return;
    }

    if (reason.trim().length < 5) {
      Alert.alert('Reason', 'Please explain why you need this change (at least 5 characters).');
      return;
    }

    // Times are restaurant (Riga) time. A check-out earlier than the
    // check-in means the shift ended after midnight.
    let outDate = date;

    if (inTime && outTime && outTime <= inTime) {
      outDate = addDays(date, 1);
    }

    setSubmitting(true);

    try {
      await apiRequest('/attendance/manual-requests/', {
        method: 'POST',
        body: {
          check_in: inTime ? `${date}T${inTime}:00` : null,
          check_out: outTime ? `${outDate}T${outTime}:00` : null,
          reason: reason.trim(),
        },
      });

      setCheckIn('');
      setCheckOut('');
      setReason('');

      Alert.alert(
        'Request sent',
        'Your manager will review it. You can see the result below.',
      );

      await loadRequests();
    } catch (error) {
      Alert.alert(
        'Could not send request',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.heading}>Manual Attendance</Text>
          <Text style={styles.subtitle}>
            Use this only if you could not scan the QR code or use the hold
            button. Your manager must approve it.
          </Text>

          <View style={styles.card}>
            <Text style={styles.label}>What happened?</Text>
            <View style={styles.chipRow}>
              {KINDS.map((item) => (
                <Pressable
                  key={item.value}
                  onPress={() => setKind(item.value)}
                  style={[styles.chip, kind === item.value && styles.chipActive]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      kind === item.value && styles.chipTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>Shift date</Text>
            <View style={styles.chipRow}>
              {dates.map((d, index) => (
                <Pressable
                  key={d}
                  onPress={() => setDate(d)}
                  style={[styles.chip, date === d && styles.chipActive]}
                >
                  <Text style={[styles.chipText, date === d && styles.chipTextActive]}>
                    {index === 0 ? 'Today' : index === 1 ? 'Yesterday' : formatDate(d)}
                  </Text>
                </Pressable>
              ))}
            </View>

            {needsIn && (
              <>
                <Text style={styles.label}>Check-in time (24h, HH:MM)</Text>
                <TextInput
                  style={styles.input}
                  value={checkIn}
                  onChangeText={setCheckIn}
                  placeholder="09:00"
                  keyboardType="numbers-and-punctuation"
                  maxLength={5}
                />
              </>
            )}

            {needsOut && (
              <>
                <Text style={styles.label}>Check-out time (24h, HH:MM)</Text>
                <TextInput
                  style={styles.input}
                  value={checkOut}
                  onChangeText={setCheckOut}
                  placeholder="17:30"
                  keyboardType="numbers-and-punctuation"
                  maxLength={5}
                />
              </>
            )}

            <Text style={styles.label}>Reason</Text>
            <TextInput
              style={[styles.input, styles.reasonInput]}
              value={reason}
              onChangeText={setReason}
              placeholder="For example: my phone battery died"
              multiline
              maxLength={500}
            />

            <Pressable
              style={[styles.submitButton, submitting && styles.disabled]}
              disabled={submitting}
              onPress={submit}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitText}>Send to manager</Text>
              )}
            </Pressable>
          </View>

          <Text style={styles.sectionTitle}>My requests</Text>

          {loadingList ? (
            <ActivityIndicator style={{ marginTop: 16 }} color="#2463EB" />
          ) : requests.length === 0 ? (
            <Text style={styles.empty}>You have not sent any requests yet.</Text>
          ) : (
            requests.map((request) => {
              const colors = STATUS_COLORS[request.status];

              return (
                <View key={request.id} style={styles.requestCard}>
                  <View style={styles.requestHeader}>
                    <Text style={styles.requestDate}>
                      {formatDate(request.work_date)}
                    </Text>
                    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
                      <Text style={[styles.badgeText, { color: colors.text }]}>
                        {request.status}
                      </Text>
                    </View>
                  </View>

                  {request.requested_check_in && (
                    <Text style={styles.requestLine}>
                      In: {formatDateTime(request.requested_check_in)}
                    </Text>
                  )}
                  {request.requested_check_out && (
                    <Text style={styles.requestLine}>
                      Out: {formatDateTime(request.requested_check_out)}
                    </Text>
                  )}
                  <Text style={styles.requestLine}>Reason: {request.reason}</Text>
                  {request.review_note && (
                    <Text style={styles.requestNote}>
                      Manager: {request.review_note}
                    </Text>
                  )}
                </View>
              );
            })
          )}

          <Pressable style={styles.backButton} onPress={() => router.back()}>
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
  subtitle: { color: '#64748B', fontSize: 15, marginTop: 8, marginBottom: 20, lineHeight: 22 },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#DDE5F0',
  },
  label: { color: '#173D75', fontSize: 14, fontWeight: '700', marginTop: 16, marginBottom: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#EEF2F8',
  },
  chipActive: { backgroundColor: '#2463EB' },
  chipText: { color: '#506078', fontSize: 14, fontWeight: '600' },
  chipTextActive: { color: '#FFFFFF' },
  input: {
    borderWidth: 1,
    borderColor: '#DDE5F0',
    borderRadius: 12,
    padding: 13,
    fontSize: 16,
    color: '#172033',
    backgroundColor: '#FBFCFE',
  },
  reasonInput: { minHeight: 80, textAlignVertical: 'top' },
  submitButton: {
    backgroundColor: '#2463EB',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 22,
  },
  disabled: { opacity: 0.55 },
  submitText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  sectionTitle: { color: '#172033', fontSize: 21, fontWeight: '800', marginTop: 28, marginBottom: 12 },
  empty: { color: '#64748B', fontSize: 15 },
  requestCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DDE5F0',
    marginBottom: 12,
  },
  requestHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  requestDate: { color: '#172033', fontSize: 16, fontWeight: '700' },
  badge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  requestLine: { color: '#506078', fontSize: 14, marginTop: 6, lineHeight: 20 },
  requestNote: { color: '#173D75', fontSize: 14, marginTop: 6, fontStyle: 'italic' },
  backButton: { alignItems: 'center', padding: 16, marginTop: 12 },
  backText: { color: '#2463EB', fontSize: 16, fontWeight: '700' },
});
