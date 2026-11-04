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

type Restaurant = { id: number; name: string };

const ROLES = ['Employee', 'Chef', 'Waiter', 'Cashier'];

// Manager creates an employee account directly (already approved)
export default function AddEmployeeScreen() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loadingRestaurants, setLoadingRestaurants] = useState(true);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Employee');
  const [restaurantId, setRestaurantId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      (async () => {
        try {
          const data = await apiRequest<Restaurant[]>('/restaurants/');
          if (!active) return;

          const list = Array.isArray(data) ? data : [];
          setRestaurants(list);

          // pre-select when there is only one restaurant
          setRestaurantId((current) =>
            current ?? (list.length === 1 ? list[0].id : null),
          );
        } catch (error) {
          Alert.alert(
            'Could not load restaurants',
            error instanceof Error ? error.message : 'Please try again.',
          );
        } finally {
          if (active) setLoadingRestaurants(false);
        }
      })();

      return () => {
        active = false;
      };
    }, []),
  );

  async function save() {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim()) {
      Alert.alert('Missing details', 'Please fill in name, email and phone.');
      return;
    }

    if (restaurantId == null) {
      Alert.alert('Restaurant', 'Please choose a restaurant for this employee.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Password', 'The password must be at least 6 characters.');
      return;
    }

    setSaving(true);

    try {
      await apiRequest('/employees/', {
        method: 'POST',
        body: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          role,
          password,
          restaurant_id: restaurantId,
        },
      });

      Alert.alert('Employee added', `${firstName.trim()} can now log in.`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert(
        'Could not add employee',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setSaving(false);
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
          <Text style={styles.heading}>Add Employee</Text>
          <Text style={styles.subtitle}>
            The account is approved right away and can log in with this
            email and password.
          </Text>

          <View style={styles.card}>
            <Text style={styles.label}>First name</Text>
            <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} />

            <Text style={styles.label}>Last name</Text>
            <TextInput style={styles.input} value={lastName} onChangeText={setLastName} />

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <Text style={styles.label}>Phone</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />

            <Text style={styles.label}>Role</Text>
            <View style={styles.chipRow}>
              {ROLES.map((item) => (
                <Pressable
                  key={item}
                  onPress={() => setRole(item)}
                  style={[styles.chip, role === item && styles.chipActive]}
                >
                  <Text style={[styles.chipText, role === item && styles.chipTextActive]}>
                    {item}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>Restaurant</Text>
            {loadingRestaurants ? (
              <ActivityIndicator color="#2463EB" />
            ) : restaurants.length === 0 ? (
              <Text style={styles.warning}>
                Add a restaurant first - employees must belong to one.
              </Text>
            ) : (
              <View style={styles.chipRow}>
                {restaurants.map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() => setRestaurantId(item.id)}
                    style={[styles.chip, restaurantId === item.id && styles.chipActive]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        restaurantId === item.id && styles.chipTextActive,
                      ]}
                    >
                      {item.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />

            <Pressable
              style={[styles.saveButton, saving && { opacity: 0.6 }]}
              disabled={saving}
              onPress={save}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveText}>Add employee</Text>
              )}
            </Pressable>
          </View>

          <Pressable style={styles.back} onPress={() => router.back()}>
            <Text style={styles.backText}>Cancel</Text>
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
  input: {
    borderWidth: 1,
    borderColor: '#DDE5F0',
    borderRadius: 12,
    padding: 13,
    fontSize: 16,
    color: '#172033',
    backgroundColor: '#FBFCFE',
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 9, paddingHorizontal: 14, borderRadius: 20, backgroundColor: '#EEF2F8' },
  chipActive: { backgroundColor: '#2463EB' },
  chipText: { color: '#506078', fontSize: 14, fontWeight: '600' },
  chipTextActive: { color: '#FFFFFF' },
  warning: { color: '#B45309', fontSize: 14 },
  saveButton: {
    backgroundColor: '#2463EB',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  saveText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  back: { alignItems: 'center', padding: 16, marginTop: 8 },
  backText: { color: '#2463EB', fontSize: 16, fontWeight: '700' },
});
