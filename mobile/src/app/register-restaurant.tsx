
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = 'https://dry-clouds-thank.loca.lt';

export default function RegisterRestaurantScreen() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [invitationCode, setInvitationCode] = useState('');

  const registerRestaurant = async () => {
    if (!name.trim() || !address.trim() ||
        !phone.trim() || !email.trim()) {
      Alert.alert('Missing details', 'Please fill in all four fields.');
      return;
    }

    setLoading(true);

    try {
      const token = await SecureStore.getItemAsync(
        'timetap_access_token'
      );

      if (!token) {
        Alert.alert(
          'Login required',
          'Please log in with your manager account first.'
        );
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/restaurants/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
            'Bypass-Tunnel-Reminder': 'true',
          },
          body: JSON.stringify({
            name: name.trim(),
            address: address.trim(),
            phone: phone.trim(),
            email: email.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || 'Could not register the restaurant.'
        );
      }

      setInvitationCode(data.invitation_code || '');

      Alert.alert(
        'Restaurant registered!',
        `Your restaurant "${data.name}" has been created.${
          data.invitation_code
            ? `\n\nEmployee invitation code: ${data.invitation_code}`
            : ''
        }`,
        [
          {
            text: 'Continue',
            onPress: () => router.replace('/manager-dashboard'),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert(
        'Registration failed',
        error.message || 'Please check your connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.brand}>TimeTap</Text>
      <Text style={styles.title}>Register Your Restaurant</Text>
      <Text style={styles.subtitle}>
        Add your restaurant to start managing employee attendance.
      </Text>

      <Text style={styles.label}>Restaurant name</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter restaurant name"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
      />

      <Text style={styles.label}>Address</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter restaurant address"
        value={address}
        onChangeText={setAddress}
        autoCapitalize="words"
      />

      <Text style={styles.label}>Phone number</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter phone number"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />

      <Text style={styles.label}>Email address</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter restaurant email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.disabled]}
        onPress={registerRestaurant}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>Register Restaurant</Text>
        )}
      </TouchableOpacity>

      {invitationCode ? (
        <View style={styles.codeBox}>
          <Text style={styles.codeLabel}>
            Employee Invitation Code
          </Text>
          <Text style={styles.code}>{invitationCode}</Text>
        </View>
      ) : null}

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Text style={styles.backText}>Go Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7FC',
  },
  content: {
    padding: 24,
    paddingTop: 48,
    paddingBottom: 40,
  },
  brand: {
    color: '#173B75',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 20,
  },
  title: {
    fontSize: 25,
    fontWeight: '800',
    color: '#14233B',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748B',
    lineHeight: 22,
    marginBottom: 28,
  },
  label: {
    color: '#24344D',
    fontWeight: '600',
    marginBottom: 7,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D9E2EF',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 14,
    fontSize: 16,
    color: '#14233B',
  },
  button: {
    backgroundColor: '#173B75',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 28,
  },
  disabled: {
    opacity: 0.65,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  codeBox: {
    marginTop: 22,
    backgroundColor: '#E5F5EA',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  codeLabel: {
    color: '#235B39',
    fontWeight: '600',
  },
  code: {
    fontSize: 25,
    fontWeight: '800',
    color: '#235B39',
    marginTop: 8,
    letterSpacing: 2,
  },
  backButton: {
    alignItems: 'center',
    padding: 15,
    marginTop: 8,
  },
  backText: {
    color: '#173B75',
    fontWeight: '600',
  },
});
