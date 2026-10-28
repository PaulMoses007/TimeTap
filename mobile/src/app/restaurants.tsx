
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
import * as Clipboard from 'expo-clipboard';

const API_BASE_URL = 'https://dry-clouds-thank.loca.lt';

type Restaurant = {
  id: number;
  name: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  invitation_code?: string | null;
  is_active?: boolean;
};

export default function RestaurantsScreen() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadRestaurants = useCallback(async (refresh = false) => {
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

      const response = await fetch(`${API_BASE_URL}/restaurants/`, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
          'Bypass-Tunnel-Reminder': 'true',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || 'Could not load restaurants.',
        );
      }

      setRestaurants(Array.isArray(data) ? data : []);
    } catch (error: any) {
      Alert.alert(
        'Unable to load restaurants',
        error.message || 'Please check your connection and try again.',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadRestaurants();
    }, [loadRestaurants]),
  );

  async function copyInvitationCode(code: string) {
    try {
      await Clipboard.setStringAsync(code);
      Alert.alert('Copied', 'Employee invitation code copied.');
    } catch {
      Alert.alert('Error', 'Could not copy the invitation code.');
    }
  }

  function confirmDelete(restaurant: Restaurant) {
    Alert.alert(
      'Delete restaurant?',
      `Are you sure you want to delete "${restaurant.name}"? This action may affect its associated records.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteRestaurant(restaurant.id),
        },
      ],
    );
  }

  async function deleteRestaurant(id: number) {
    setDeletingId(id);

    try {
      const token = await SecureStore.getItemAsync(
        'timetap_access_token',
      );

      if (!token) {
        router.replace('/login');
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/restaurants/${id}`,
        {
          method: 'DELETE',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
            'Bypass-Tunnel-Reminder': 'true',
          },
        },
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          data.detail || 'Could not delete this restaurant.',
        );
      }

      setRestaurants((current) =>
        current.filter((restaurant) => restaurant.id !== id),
      );

      Alert.alert('Deleted', 'Restaurant deletion was successful.');
    } catch (error: any) {
      Alert.alert(
        'Delete failed',
        error.message || 'Please try again.',
      );
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#2463EB" />
        <Text style={styles.muted}>Loading restaurants...</Text>
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
            onRefresh={() => loadRestaurants(true)}
          />
        }
      >
        <Text style={styles.heading}>Restaurants</Text>
        <Text style={styles.subtitle}>
          Manage restaurants registered in TimeTap.
        </Text>

        <Pressable
          style={styles.addButton}
          onPress={() => router.push('/register-restaurant')}
        >
          <Text style={styles.addButtonText}>+ Register Restaurant</Text>
        </Pressable>

        {restaurants.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>
              No restaurants registered yet
            </Text>
            <Text style={styles.muted}>
              Register your restaurant to get an employee invitation code.
            </Text>
          </View>
        ) : (
          restaurants.map((restaurant) => (
            <View key={restaurant.id} style={styles.card}>
              <View style={styles.restaurantHeader}>
                <View style={styles.iconCircle}>
                  <Text style={styles.iconText}>🍴</Text>
                </View>

                <View style={styles.restaurantHeading}>
                  <Text style={styles.restaurantName}>
                    {restaurant.name}
                  </Text>
                  <Text style={styles.restaurantNumber}>
                    Restaurant #{restaurant.id}
                  </Text>
                </View>
              </View>

              <View style={styles.separator} />

              <Text style={styles.detail}>
                <Text style={styles.detailLabel}>Address: </Text>
                {restaurant.address || 'Not provided'}
              </Text>
              <Text style={styles.detail}>
                <Text style={styles.detailLabel}>Phone: </Text>
                {restaurant.phone || 'Not provided'}
              </Text>
              <Text style={styles.detail}>
                <Text style={styles.detailLabel}>Email: </Text>
                {restaurant.email || 'Not provided'}
              </Text>

              <View style={styles.invitationBox}>
                <Text style={styles.invitationTitle}>
                  Employee Invitation
                </Text>
                <Text style={styles.invitationDescription}>
                  Give this code to employees so they can register for
                  this restaurant.
                </Text>

                {restaurant.invitation_code ? (
                  <View style={styles.codeRow}>
                    <View style={styles.codeField}>
                      <Text style={styles.codeText}>
                        {restaurant.invitation_code}
                      </Text>
                    </View>

                    <Pressable
                      style={styles.copyButton}
                      onPress={() =>
                        copyInvitationCode(restaurant.invitation_code!)
                      }
                    >
                      <Text style={styles.copyText}>▢ COPY</Text>
                    </Pressable>
                  </View>
                ) : (
                  <Text style={styles.muted}>
                    No invitation code returned.
                  </Text>
                )}
              </View>

              <View style={styles.actions}>
                <Pressable
                  style={styles.qrButton}
                  onPress={() =>
                    Alert.alert(
                      'Attendance QR',
                      'We need to connect this button to your backend QR response before displaying the code.',
                    )
                  }
                >
                  <Text style={styles.qrButtonText}>
                    ▦ ATTENDANCE QR
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.deleteButton,
                    deletingId === restaurant.id && styles.disabled,
                  ]}
                  disabled={deletingId === restaurant.id}
                  onPress={() => confirmDelete(restaurant)}
                >
                  {deletingId === restaurant.id ? (
                    <ActivityIndicator color="#DC2626" />
                  ) : (
                    <Text style={styles.deleteText}>Delete</Text>
                  )}
                </Pressable>
              </View>
            </View>
          ))
        )}

        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>Back to Dashboard</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F7FA',
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  heading: {
    color: '#111827',
    fontSize: 27,
    fontWeight: '500',
  },
  subtitle: {
    color: '#111827',
    fontSize: 13,
    marginTop: 6,
    marginBottom: 22,
  },
  addButton: {
    backgroundColor: '#2463EB',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 18,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DDE2E8',
    padding: 18,
    marginBottom: 18,
  },
  restaurantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#DCEEFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 19,
  },
  restaurantHeading: {
    flex: 1,
  },
  restaurantName: {
    color: '#27364B',
    fontSize: 17,
    fontWeight: '500',
  },
  restaurantNumber: {
    color: '#111827',
    fontSize: 12,
    marginTop: 3,
  },
  separator: {
    height: 1,
    backgroundColor: '#D7DCE2',
    marginVertical: 18,
  },
  detail: {
    color: '#111827',
    fontSize: 12,
    lineHeight: 22,
  },
  detailLabel: {
    fontWeight: '700',
  },
  invitationBox: {
    backgroundColor: '#F4F8FF',
    borderColor: '#D4E4FF',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 14,
  },
  invitationTitle: {
    color: '#24364E',
    fontSize: 13,
    fontWeight: '600',
  },
  invitationDescription: {
    color: '#263445',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
    marginBottom: 10,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  codeField: {
    flex: 1,
    minHeight: 40,
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#C9D2DF',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 9,
  },
  codeText: {
    color: '#263445',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  copyButton: {
    borderWidth: 1,
    borderColor: '#60A5FA',
    borderRadius: 6,
    paddingHorizontal: 9,
    paddingVertical: 10,
  },
  copyText: {
    color: '#2463EB',
    fontSize: 11,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  qrButton: {
    flex: 1,
    backgroundColor: '#1976D2',
    borderRadius: 5,
    paddingVertical: 12,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  deleteButton: {
    flex: 1,
    borderColor: '#D1D5DB',
    borderWidth: 1,
    borderRadius: 5,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.5,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DDE2E8',
    padding: 20,
    gap: 10,
  },
  emptyTitle: {
    color: '#172033',
    fontSize: 17,
    fontWeight: '700',
  },
  muted: {
    color: '#64748B',
    marginTop: 10,
    fontSize: 14,
  },
  backButton: {
    alignItems: 'center',
    padding: 15,
  },
  backText: {
    color: '#2463EB',
    fontWeight: '600',
  },
});
