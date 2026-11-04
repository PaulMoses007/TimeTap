import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
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

import { apiRequest } from '../lib/api';
import { formatDate, formatDateTime } from '../lib/time';

type Filter = 'Pending' | 'Approved' | 'Rejected' | 'All';

type ManualRequest = {
  id: number;
  employee_name: string | null;
  employee_code: string | null;
  work_date: string;
  requested_check_in: string | null;
  requested_check_out: string | null;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  review_note: string | null;
};

const FILTERS: Filter[] = ['Pending', 'Approved', 'Rejected', 'All'];

const STATUS_COLORS = {
  Pending: { bg: '#FEF3C7', text: '#92400E' },
  Approved: { bg: '#DCFCE7', text: '#166534' },
  Rejected: { bg: '#FEE2E2', text: '#991B1B' },
};

export default function ManagerRequestsScreen() {
  const [filter, setFilter] = useState<Filter>('Pending');
  const [requests, setRequests] = useState<ManualRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [review, setReview] = useState<{
    request: ManualRequest;
    action: 'approve' | 'reject';
  } | null>(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(
    async (selected: Filter) => {
      try {
        const query = selected === 'All' ? '' : `?status=${selected}`;
        const data = await apiRequest<ManualRequest[]>(
          `/attendance/manual-requests/${query}`,
        );
        setRequests(Array.isArray(data) ? data : []);
      } catch (error) {
        Alert.alert(
          'Could not load requests',
          error instanceof Error ? error.message : 'Please try again.',
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load(filter);
    }, [filter, load]),
  );

  async function submitReview() {
    if (!review) return;

    setSaving(true);

    try {
      await apiRequest(
        `/attendance/manual-requests/${review.request.id}/${review.action}`,
        { method: 'PUT', body: { note: note.trim() || null } },
      );

      setReview(null);
      setNote('');
      await load(filter);
    } catch (error) {
      // e.g. "This overlaps an existing attendance record"
      Alert.alert(
        'Could not update request',
        error instanceof Error ? error.message : 'Please try again.',
      );
      setReview(null);
    } finally {
      setSaving(false);
    }
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
              void load(filter);
            }}
          />
        }
      >
        <Text style={styles.heading}>Manual Requests</Text>
        <Text style={styles.subtitle}>
          Check-ins and check-outs your employees could not record by QR.
        </Text>

        <View style={styles.chipRow}>
          {FILTERS.map((item) => (
            <Pressable
              key={item}
              onPress={() => setFilter(item)}
              style={[styles.chip, filter === item && styles.chipActive]}
            >
              <Text style={[styles.chipText, filter === item && styles.chipTextActive]}>
                {item}
              </Text>
            </Pressable>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#2463EB" />
        ) : requests.length === 0 ? (
          <Text style={styles.empty}>
            No {filter === 'All' ? '' : filter.toLowerCase()} requests.
          </Text>
        ) : (
          requests.map((request) => {
            const colors = STATUS_COLORS[request.status];

            return (
              <View key={request.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{request.employee_name ?? 'Employee'}</Text>
                    <Text style={styles.meta}>
                      {request.employee_code ?? ''} · {formatDate(request.work_date)}
                    </Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: colors.bg }]}>
                    <Text style={[styles.badgeText, { color: colors.text }]}>
                      {request.status}
                    </Text>
                  </View>
                </View>

                {request.requested_check_in && (
                  <Text style={styles.line}>
                    Check-in: {formatDateTime(request.requested_check_in)}
                  </Text>
                )}
                {request.requested_check_out && (
                  <Text style={styles.line}>
                    Check-out: {formatDateTime(request.requested_check_out)}
                  </Text>
                )}
                <Text style={styles.line}>Reason: {request.reason}</Text>
                {request.review_note && (
                  <Text style={styles.note}>Your note: {request.review_note}</Text>
                )}

                {request.status === 'Pending' && (
                  <View style={styles.actions}>
                    <Pressable
                      style={styles.approve}
                      onPress={() => {
                        setNote('');
                        setReview({ request, action: 'approve' });
                      }}
                    >
                      <Text style={styles.actionText}>Approve</Text>
                    </Pressable>
                    <Pressable
                      style={styles.reject}
                      onPress={() => {
                        setNote('');
                        setReview({ request, action: 'reject' });
                      }}
                    >
                      <Text style={styles.actionText}>Reject</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            );
          })
        )}

        <Pressable style={styles.back} onPress={() => router.back()}>
          <Text style={styles.backText}>Back</Text>
        </Pressable>
      </ScrollView>

      <Modal
        visible={review !== null}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!saving) setReview(null);
        }}
      >
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>
              {review?.action === 'approve' ? 'Approve request' : 'Reject request'}
            </Text>
            <Text style={styles.modalText}>
              {review?.request.employee_name} · {formatDate(review?.request.work_date)}
            </Text>
            <Text style={styles.modalText}>Reason: {review?.request.reason}</Text>

            <TextInput
              style={styles.input}
              value={note}
              onChangeText={setNote}
              placeholder="Note to employee (optional)"
              multiline
              maxLength={500}
            />

            <View style={styles.actions}>
              <Pressable
                style={styles.cancel}
                disabled={saving}
                onPress={() => setReview(null)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[
                  review?.action === 'approve' ? styles.approve : styles.reject,
                  saving && { opacity: 0.6 },
                ]}
                disabled={saving}
                onPress={submitReview}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.actionText}>
                    {review?.action === 'approve' ? 'Approve' : 'Reject'}
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7F8FC' },
  container: { padding: 24, paddingBottom: 48 },
  heading: { color: '#172033', fontSize: 27, fontWeight: '800' },
  subtitle: { color: '#64748B', fontSize: 15, marginTop: 8, marginBottom: 18, lineHeight: 22 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  chip: { paddingVertical: 9, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#EEF2F8' },
  chipActive: { backgroundColor: '#2463EB' },
  chipText: { color: '#506078', fontSize: 14, fontWeight: '600' },
  chipTextActive: { color: '#FFFFFF' },
  empty: { color: '#64748B', fontSize: 16, marginTop: 30, textAlign: 'center' },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DDE5F0',
    marginBottom: 14,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  name: { color: '#172033', fontSize: 17, fontWeight: '700' },
  meta: { color: '#64748B', fontSize: 13, marginTop: 2 },
  badge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  line: { color: '#506078', fontSize: 15, marginTop: 6, lineHeight: 21 },
  note: { color: '#173D75', fontSize: 14, marginTop: 6, fontStyle: 'italic' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  approve: { flex: 1, backgroundColor: '#16A34A', padding: 13, borderRadius: 12, alignItems: 'center' },
  reject: { flex: 1, backgroundColor: '#DC2626', padding: 13, borderRadius: 12, alignItems: 'center' },
  actionText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  cancel: { flex: 1, backgroundColor: '#EEF2F8', padding: 13, borderRadius: 12, alignItems: 'center' },
  cancelText: { color: '#506078', fontSize: 16, fontWeight: '700' },
  back: { alignItems: 'center', padding: 16, marginTop: 8 },
  backText: { color: '#2463EB', fontSize: 16, fontWeight: '700' },
  overlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', justifyContent: 'center', padding: 24 },
  modal: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 20 },
  modalTitle: { color: '#172033', fontSize: 20, fontWeight: '800', marginBottom: 10 },
  modalText: { color: '#506078', fontSize: 15, marginBottom: 6, lineHeight: 21 },
  input: {
    borderWidth: 1,
    borderColor: '#DDE5F0',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    minHeight: 70,
    textAlignVertical: 'top',
    marginTop: 10,
  },
});
