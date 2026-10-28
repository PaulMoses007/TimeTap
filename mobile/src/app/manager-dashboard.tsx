
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

export default function ManagerDashboard() {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkLogin() {
      try {
        const token = await SecureStore.getItemAsync(
          'timetap_access_token',
        );

        if (!token) {
          router.replace('/login');
          return;
        }

        setChecking(false);
      } catch {
        Alert.alert(
          'Session error',
          'Could not verify your login. Please log in again.',
        );
        router.replace('/login');
      }
    }

    checkLogin();
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

        {/* Restaurants */}
        <Pressable
          style={styles.restaurantCard}
          onPress={() => router.push('/restaurants')}
          accessibilityRole="button"
        >
          <Text style={styles.restaurantTitle}>Restaurants</Text>
          <Text style={styles.restaurantDescription}>
            View restaurant details, invitation codes, and restaurant
            actions.
          </Text>
          <Text style={styles.restaurantLink}>
            Manage restaurants {'→'}
          </Text>
        </Pressable>

        {/* Employee Attendance */}
        <Pressable
          style={styles.card}
          onPress={() => router.push('/attendance')}
          accessibilityRole="button"
        >
          <Text style={styles.cardTitle}>Employee Attendance</Text>
          <Text style={styles.cardDescription}>
            View employee attendance and check-in activity.
          </Text>
          <Text style={styles.link}>View attendance {'→'}</Text>
        </Pressable>

        {/* Team */}
        <Pressable
          style={styles.card}
          onPress={() => router.push('/team')}
          accessibilityRole="button"
        >
          <Text style={styles.cardTitle}>Your Team</Text>
          <Text style={styles.cardDescription}>
            Manage employees and review their attendance.
          </Text>
          <Text style={styles.link}>View employees {'→'}</Text>
        </Pressable>

        {/* Logout */}
        <Pressable
          style={styles.logoutButton}
          onPress={logout}
          accessibilityRole="button"
        >
          <Text style={styles.logoutText}>Log out</Text>
        </Pressable>
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
