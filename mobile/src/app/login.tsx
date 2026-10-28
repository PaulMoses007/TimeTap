import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = 'https://dry-clouds-thank.loca.lt';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password) {
      Alert.alert('Missing information', 'Enter your email and password.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'Bypass-Tunnel-Reminder': 'true',
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const responseText = await response.text();
      let data: any;

      try {
        data = JSON.parse(responseText);
      } catch {
        Alert.alert(
          'Server response error',
          `The server returned an unexpected response (HTTP ${response.status}).`,
        );
        return;
      }

      if (!response.ok) {
        Alert.alert(
          'Login failed',
          typeof data.detail === 'string'
            ? data.detail
            : `Login failed (HTTP ${response.status}).`,
        );
        return;
      }

      if (!data.access_token) {
        Alert.alert('Login error', 'No access token was returned.');
        return;
      }

      await SecureStore.setItemAsync('timetap_access_token', data.access_token);

      const profileResponse = await fetch(`${API_BASE_URL}/employees/me`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${data.access_token}`,
          'Bypass-Tunnel-Reminder': 'true',
        },
      });

      const profileText = await profileResponse.text();
      let profile: any;

      try {
        profile = JSON.parse(profileText);
      } catch {
        await SecureStore.deleteItemAsync('timetap_access_token');
        Alert.alert('Profile error', 'The server returned an invalid profile response.');
        return;
      }

      if (!profileResponse.ok) {
        await SecureStore.deleteItemAsync('timetap_access_token');
        Alert.alert(
          'Profile error',
          typeof profile.detail === 'string'
            ? profile.detail
            : 'Could not load your account details.',
        );
        return;
      }

      const role = String(profile.role ?? '').trim().toLowerCase();

      if (role === 'manager') {
        router.replace('/manager-dashboard');
      } else {
        router.replace('/employee-dashboard');
      }
    } catch (error) {
      console.error('TimeTap login error:', error);
      Alert.alert(
        'Connection error',
        'Cannot reach TimeTap. Check that the backend and LocalTunnel are running and the tunnel URL is current.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => router.back()} accessibilityRole="button">
            <Text style={styles.back}>‹ Back</Text>
          </Pressable>

          <Text style={styles.brand}>TimeTap</Text>
          <Text style={styles.heading}>Welcome back</Text>
          <Text style={styles.subtitle}>Log in to your restaurant account.</Text>

          <Text style={styles.label}>Email address</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor="#94A3B8"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="emailAddress"
            editable={!loading}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            placeholderTextColor="#94A3B8"
            secureTextEntry
            textContentType="password"
            editable={!loading}
          />

          <Pressable
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            accessibilityRole="button"
          >
            {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Log in</Text>}
          </Pressable>

          <Text style={styles.note}>Managers and employees use the same login screen.</Text>

          <View style={styles.registerPanel}>
            <Text style={styles.registerHeading}>New to TimeTap?</Text>
            <Text style={styles.registerDescription}>Create an account to get started.</Text>

            <Pressable
              style={styles.secondaryButton}
              onPress={() => router.push('/register')}
              accessibilityRole="button"
            >
              <Text style={styles.secondaryButtonText}>Create an account</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7F8FC' },
  keyboard: { flex: 1 },
  container: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  back: { color: '#2463EB', fontSize: 17, marginBottom: 32 },
  brand: { color: '#173D75', fontSize: 32, fontWeight: '800' },
  heading: { color: '#172033', fontSize: 28, fontWeight: '800', marginTop: 24 },
  subtitle: { color: '#64748B', fontSize: 16, marginTop: 8, marginBottom: 32 },
  label: { color: '#172033', fontSize: 14, fontWeight: '700', marginBottom: 8 },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D9E1EF',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: '#172033',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#2463EB',
    padding: 17,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.65 },
  buttonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  note: { color: '#64748B', fontSize: 13, textAlign: 'center', marginTop: 24 },
  registerPanel: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D9E1EF',
    borderRadius: 16,
    padding: 18,
    marginTop: 26,
  },
  registerHeading: { color: '#172033', fontSize: 18, fontWeight: '800' },
  registerDescription: { color: '#64748B', fontSize: 14, marginTop: 6, marginBottom: 14 },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#2463EB',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  secondaryButtonText: { color: '#2463EB', fontSize: 16, fontWeight: '700' },
});
