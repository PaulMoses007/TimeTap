
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

export default function TeamScreen() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadEmployees = useCallback(async (refresh = false) => {
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
        `${API_BASE_URL}/employees/`,
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
          `Unexpected server response (HTTP ${response.status}).`,
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
            : `Could not load employees (HTTP ${response.status}).`,
        );
      }

      if (!Array.isArray(data)) {
        throw new Error('The server returned an unexpected employee list.');
      }

      setEmployees(data);
    } catch (error) {
      console.error('Load team error:', error);

      Alert.alert(
        'Unable to load team',
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
      loadEmployees();
    }, [loadEmployees]),
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#2463EB" />
        <Text style={styles.muted}>Loading your team...</Text>
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
            onRefresh={() => loadEmployees(true)}
          />
        }
      >
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>‹ Back to dashboard</Text>
        </Pressable>

        <Text style={styles.brand}>TimeTap</Text>
        <Text style={styles.heading}>Your Team</Text>
        <Text style={styles.subtitle}>
          Employees belonging to your managed restaurant.
        </Text>

        <View style={styles.summary}>
          <Text style={styles.summaryNumber}>
            {employees.length}
          </Text>
          <Text style={styles.summaryLabel}>
            {employees.length === 1 ? 'Employee' : 'Employees'}
          </Text>
        </View>

        {employees.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>No employees found</Text>
            <Text style={styles.muted}>
              Employees assigned to your restaurant will appear here.
            </Text>
          </View>
        ) : (
          employees.map((employee) => {
            const fullName = [
              employee.first_name,
              employee.last_name,
            ]
              .filter(Boolean)
              .join(' ') || 'Unnamed employee';

            return (
              <View key={employee.id} style={styles.card}>
                <Text style={styles.employeeName}>{fullName}</Text>

                <Text style={styles.employeeId}>
                  ID: {employee.employee_id || employee.id}
                </Text>

                <View style={styles.divider} />

                <Text style={styles.detail}>
                  Email: {employee.email || 'Not provided'}
                </Text>

                <Text style={styles.detail}>
                  Phone: {employee.phone || 'Not provided'}
                </Text>

                <Text style={styles.detail}>
                  Role: {employee.role || 'Not specified'}
                </Text>

                <Text style={styles.detail}>
                  Restaurant: {employee.restaurant_name || 'Not assigned'}
                </Text>

                <View style={styles.badges}>
                  <Text
                    style={[
                      styles.badge,
                      employee.is_active
                        ? styles.activeBadge
                        : styles.inactiveBadge,
                    ]}
                  >
                    {employee.is_active ? 'Active' : 'Inactive'}
                  </Text>

                  <Text
                    style={[
                      styles.badge,
                      employee.approval_status?.toLowerCase() === 'approved'
                        ? styles.activeBadge
                        : styles.pendingBadge,
                    ]}
                  >
                    {employee.approval_status || 'Unknown'}
                  </Text>
                </View>
              </View>
            );
          })
        )}
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
    fontSize: 28,
    fontWeight: '800',
    marginTop: 18,
  },
  subtitle: {
    color: '#64748B',
    fontSize: 15,
    marginTop: 8,
    marginBottom: 20,
  },
  summary: {
    backgroundColor: '#E8F1FF',
    padding: 18,
    borderRadius: 14,
    marginBottom: 20,
  },
  summaryNumber: {
    color: '#173D75',
    fontSize: 28,
    fontWeight: '800',
  },
  summaryLabel: {
    color: '#475569',
    fontSize: 14,
    marginTop: 3,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDE5F0',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
  },
  employeeName: {
    color: '#172033',
    fontSize: 19,
    fontWeight: '700',
  },
  employeeId: {
    color: '#2463EB',
    fontSize: 13,
    marginTop: 5,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5EAF2',
    marginVertical: 14,
  },
  detail: {
    color: '#475569',
    fontSize: 14,
    marginBottom: 9,
  },
  muted: {
    color: '#64748B',
    fontSize: 14,
    marginTop: 10,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  badge: {
    overflow: 'hidden',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontSize: 12,
    fontWeight: '700',
  },
  activeBadge: {
    backgroundColor: '#DCFCE7',
    color: '#166534',
  },
  inactiveBadge: {
    backgroundColor: '#FEE2E2',
    color: '#991B1B',
  },
  pendingBadge: {
    backgroundColor: '#FEF3C7',
    color: '#92400E',
  },
});
