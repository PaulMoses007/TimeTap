
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = 'https://timetap-backend.onrender.com';

export default function EditManagerProfile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    async function loadProfile() {
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

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.detail || 'Could not load profile.');
        }

        if (String(data.role).toLowerCase() !== 'manager') {
          Alert.alert('Access denied', 'Manager account required.');
          router.replace('/employee-dashboard');
          return;
        }

        setFirstName(data.first_name || '');
        setLastName(data.last_name || '');
        setEmail(data.email || '');
        setPhone(data.phone || '');
      } catch (error) {
        Alert.alert(
          'Profile error',
          error instanceof Error ? error.message : 'Could not load profile.',
        );
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  async function saveProfile() {
    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !email.trim() ||
      !phone.trim()
    ) {
      Alert.alert('Missing information', 'Please complete all fields.');
      return;
    }

    setSaving(true);

    try {
      const token = await SecureStore.getItemAsync(
        'timetap_access_token',
      );

      if (!token) {
        router.replace('/login');
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/employees/me/profile`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            email: email.trim(),
            phone: phone.trim(),
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Could not update profile.');
      }

      Alert.alert(
        'Success',
        'Your manager profile has been updated.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/manager-dashboard'),
          },
        ],
      );
    } catch (error) {
      Alert.alert(
        'Update failed',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#2463EB" />
        <Text style={styles.loadingText}>Loading your profile...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>

        <Text style={styles.brand}>TimeTap</Text>
        <Text style={styles.heading}>Edit Manager Profile</Text>
        <Text style={styles.subtitle}>
          Update your personal account information.
        </Text>

        <View style={styles.form}>
          <Text style={styles.label}>First name</Text>
          <TextInput
            style={styles.input}
            value={firstName}
            onChangeText={setFirstName}
            placeholder="Enter first name"
            editable={!saving}
          />

          <Text style={styles.label}>Last name</Text>
          <TextInput
            style={styles.input}
            value={lastName}
            onChangeText={setLastName}
            placeholder="Enter last name"
            editable={!saving}
          />

          <Text style={styles.label}>Email address</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Enter email"
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!saving}
          />

          <Text style={styles.label}>Phone number</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="Enter phone number"
            keyboardType="phone-pad"
            editable={!saving}
          />

          <Pressable
            style={[styles.saveButton, saving && styles.disabledButton]}
            onPress={saveProfile}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveText}>Save Changes</Text>
            )}
          </Pressable>

          <Pressable
            style={styles.cancelButton}
            onPress={() => router.back()}
            disabled={saving}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
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
  loadingText: {
    marginTop: 12,
    color: '#64748B',
  },
  container: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 30,
    paddingBottom: 40,
  },
  back: {
    color: '#2463EB',
    fontSize: 17,
    marginBottom: 24,
  },
  brand: {
    color: '#173D75',
    fontSize: 32,
    fontWeight: '800',
  },
  heading: {
    color: '#172033',
    fontSize: 26,
    fontWeight: '800',
    marginTop: 24,
  },
  subtitle: {
    color: '#64748B',
    fontSize: 15,
    marginTop: 8,
    marginBottom: 24,
  },
  form: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#DCE4F0',
  },
  label: {
    color: '#172033',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#D9E1EF',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#172033',
    marginBottom: 20,
  },
  saveButton: {
    backgroundColor: '#2463EB',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  saveText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  cancelButton: {
    padding: 15,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelText: {
    color: '#64748B',
    fontSize: 16,
    fontWeight: '600',
  },
});
