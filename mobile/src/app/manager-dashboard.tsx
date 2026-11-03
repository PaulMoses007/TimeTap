
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = 'https://timetap-backend.onrender.com';

type ManagerProfile = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: string;
  restaurant_name: string | null;
  employee_id: string;
  approval_status: string;
};

export default function ManagerDashboard() {
  const [checking, setChecking] = useState(true);
  const [profile, setProfile] = useState<ManagerProfile | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const token = await SecureStore.getItemAsync(
          'timetap_access_token',
        );

        if (!token) {
          router.replace('/login');
          return;
        }

        const response = await fetch(
          `${API_BASE_URL}/employees/me`,
          {
            headers: {
              Accept: 'application/json',
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            await SecureStore.deleteItemAsync('timetap_access_token');
            router.replace('/login');
            return;
          }

          throw new Error(`Profile request failed: ${response.status}`);
        }

        const data = await response.json();

        if (String(data.role).toLowerCase() !== 'manager') {
          router.replace('/employee-dashboard');
          return;
        }

        setProfile(data);
      } catch (error) {
        console.error('Manager profile error:', error);

        Alert.alert(
          'Profile error',
          'Could not load your manager details. Please try again.',
        );
      } finally {
        setChecking(false);
      }
    }

    loadDashboard();
  }, []);

  async function logout() {
    try {
      await SecureStore.deleteItemAsync('timetap_access_token');
      router.replace('/login');
    } catch {
      Alert.alert('Error', 'Could not log out. Please try again.');
    }
  }

  if (checking) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#2463EB" />
        <Text style={styles.loading}>Loading TimeTap...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.brand}>TimeTap</Text>

        <Text style={styles.heading}>Manager Dashboard</Text>

        <Text style={styles.subtitle}>
          Manage your restaurant team and attendance.
        </Text>

        {/* Manager Profile */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {profile
                  ? `${profile.first_name?.[0] ?? ''}${profile.last_name?.[0] ?? ''}`.toUpperCase()
                  : 'M'}
              </Text>
            </View>

            <View style={styles.profileHeading}>
              <Text style={styles.profileTitle}>My Profile</Text>

              <Text style={styles.profileSubtitle}>
                Manager account details
              </Text>

              {/* Edit Profile Button */}
              <Pressable
                style={styles.editProfileButton}
                onPress={() => router.push('/edit-manager-profile')}
                accessibilityRole="button"
              >
                <Text style={styles.editProfileText}>
                  Edit Profile
                </Text>
              </Pressable>
            </View>
          </View>

          {profile ? (
            <>
              <View style={styles.profileDivider} />

              <ProfileRow
                label="Full name"
                value={`${profile.first_name} ${profile.last_name}`}
              />

              <ProfileRow
                label="Email"
                value={profile.email}
              />

              <ProfileRow
                label="Phone"
                value={profile.phone || 'Not provided'}
              />

              <ProfileRow
                label="Role"
                value={profile.role}
              />

              <ProfileRow
                label="Restaurant"
                value={profile.restaurant_name || 'Not assigned'}
              />

              <ProfileRow
                label="Manager ID"
                value={profile.employee_id}
              />

              <ProfileRow
                label="Account status"
                value={profile.approval_status}
              />
            </>
          ) : (
            <Text style={styles.profileError}>
              Manager profile is currently unavailable.
            </Text>
          )}
        </View>

        {/* Restaurants */}
        <Pressable
          style={styles.restaurantCard}
          onPress={() => router.push('/restaurants')}
          accessibilityRole="button"
        >
          <Text style={styles.restaurantTitle}>
            Restaurants
          </Text>

          <Text style={styles.restaurantDescription}>
            View restaurant details, invitation codes, and restaurant
            actions.
          </Text>

          <Text style={styles.restaurantLink}>
            Manage restaurants →
          </Text>
        </Pressable>

        {/* Employee Attendance */}
        <Pressable
          style={styles.card}
          onPress={() => router.push('/attendance')}
          accessibilityRole="button"
        >
          <Text style={styles.cardTitle}>
            Employee Attendance
          </Text>

          <Text style={styles.cardDescription}>
            View employee attendance and check-in activity.
          </Text>

          <Text style={styles.link}>
            View attendance →
          </Text>
        </Pressable>

        {/* Team */}
        <Pressable
          style={styles.card}
          onPress={() => router.push('/team')}
          accessibilityRole="button"
        >
          <Text style={styles.cardTitle}>
            Your Team
          </Text>

          <Text style={styles.cardDescription}>
            Manage employees and review their attendance.
          </Text>

          <Text style={styles.link}>
            View employees →
          </Text>
        </Pressable>

        {/* Logout */}
        <Pressable
          style={styles.logoutButton}
          onPress={logout}
          accessibilityRole="button"
        >
          <Text style={styles.logoutText}>
            Log out
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function ProfileRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.profileRow}>
      <Text style={styles.profileLabel}>
        {label}
      </Text>

      <Text style={styles.profileValue}>
        {value}
      </Text>
    </View>
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

  loading: {
    marginTop: 12,
    color: '#64748B',
  },

  container: {
    padding: 24,
    paddingTop: 36,
    paddingBottom: 40,
  },

  brand: {
    color: '#173D75',
    fontSize: 32,
    fontWeight: '800',
  },

  heading: {
    color: '#172033',
    fontSize: 28,
    fontWeight: '800',
    marginTop: 24,
  },

  subtitle: {
    color: '#64748B',
    fontSize: 16,
    marginTop: 8,
    marginBottom: 28,
    lineHeight: 23,
  },

  profileCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#DCE4F0',
  },

  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#E8F0FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarText: {
    color: '#2463EB',
    fontSize: 21,
    fontWeight: '800',
  },

  profileHeading: {
    marginLeft: 14,
    flex: 1,
  },

  profileTitle: {
    color: '#172033',
    fontSize: 20,
    fontWeight: '800',
  },

  profileSubtitle: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 4,
  },

  editProfileButton: {
    backgroundColor: '#2463EB',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginTop: 10,
  },

  editProfileText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  profileDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 18,
  },

  profileRow: {
    marginBottom: 15,
  },

  profileLabel: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },

  profileValue: {
    color: '#172033',
    fontSize: 15,
    fontWeight: '600',
    marginTop: 5,
  },

  profileError: {
    color: '#DC2626',
    marginTop: 18,
  },

  restaurantCard: {
    backgroundColor: '#E8F0FF',
    padding: 20,
    borderRadius: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#B8CEFA',
  },

  restaurantTitle: {
    color: '#173D75',
    fontSize: 20,
    fontWeight: '800',
  },

  restaurantDescription: {
    color: '#425574',
    fontSize: 15,
    marginTop: 12,
    lineHeight: 22,
  },

  restaurantLink: {
    color: '#2463EB',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 18,
  },

  card: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DCE4F0',
  },

  cardTitle: {
    color: '#172033',
    fontSize: 20,
    fontWeight: '700',
  },

  cardDescription: {
    color: '#64748B',
    fontSize: 15,
    marginTop: 12,
    lineHeight: 22,
  },

  link: {
    color: '#2463EB',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 20,
  },

  logoutButton: {
    backgroundColor: '#2463EB',
    padding: 17,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 12,
  },

  logoutText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});
