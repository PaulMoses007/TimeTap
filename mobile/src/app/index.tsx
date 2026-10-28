
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = 'https://dry-clouds-thank.loca.lt';

export default function HomeScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { height } = useWindowDimensions();
  const compact = height < 800;

  async function handleLogin() {
    if (!email.trim() || !password) {
      Alert.alert(
        'Missing information',
        'Please enter your email address and password.',
      );
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
          'Server error',
          'The server returned an unexpected response.',
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

      await SecureStore.setItemAsync(
        'timetap_access_token',
        data.access_token,
      );

      const profileResponse = await fetch(
        `${API_BASE_URL}/employees/me`,
        {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${data.access_token}`,
            'Bypass-Tunnel-Reminder': 'true',
          },
        },
      );

      const profileText = await profileResponse.text();
      let profile: any;

      try {
        profile = JSON.parse(profileText);
      } catch {
        await SecureStore.deleteItemAsync('timetap_access_token');
        Alert.alert(
          'Profile error',
          'Invalid account information received.',
        );
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
        'Cannot connect to TimeTap. Check that the backend and LocalTunnel are running and that the tunnel URL is current.',
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
        <ScrollView
          contentContainerStyle={[
            styles.container,
            compact && styles.compactContainer,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* BRAND */}
          <View
            style={[
              styles.brandSection,
              compact && styles.compactBrandSection,
            ]}
          >
            <Text style={[styles.brand, compact && styles.compactBrand]}>
              TimeTap
            </Text>
            <Text style={styles.tagline}>
              RESTAURANT ATTENDANCE
            </Text>
          </View>

          {/* WELCOME PANEL */}
          <View style={[styles.hero, compact && styles.compactHero]}>
            <Text
              style={[styles.heroTitle, compact && styles.compactHeroTitle]}
            >
              Welcome to TimeTap
            </Text>
            <Text
              style={[
                styles.heroSubtitle,
                compact && styles.compactHeroSubtitle,
              ]}
            >
              Simple attendance management for every restaurant.
            </Text>
          </View>

          {/* LOGIN */}
          <Text style={[styles.sectionTitle, compact && styles.compactTitle]}>
            Log in
          </Text>
          <Text
            style={[
              styles.description,
              compact && styles.compactDescription,
            ]}
          >
            Log in to your restaurant account.
          </Text>

          <View style={styles.form}>
            <Text style={[styles.label, compact && styles.compactLabel]}>
              Email address
            </Text>
            <TextInput
              style={[styles.input, compact && styles.compactInput]}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor="#94A3B8"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="emailAddress"
              editable={!loading}
              returnKeyType="next"
            />

            <Text style={[styles.label, compact && styles.compactLabel]}>
              Password
            </Text>
            <TextInput
              style={[styles.input, compact && styles.compactInput]}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              placeholderTextColor="#94A3B8"
              secureTextEntry
              textContentType="password"
              editable={!loading}
              onSubmitEditing={handleLogin}
              returnKeyType="go"
            />

            <Pressable
              style={[
                styles.primaryButton,
                compact && styles.compactButton,
                loading && styles.disabledButton,
              ]}
              onPress={handleLogin}
              disabled={loading}
              accessibilityRole="button"
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Log in</Text>
              )}
            </Pressable>

            <Text
              style={[
                styles.loginNote,
                compact && styles.compactLoginNote,
              ]}
            >
              Managers and employees use the same login screen.
            </Text>
          </View>

          {/* REGISTRATION */}
          <View
            style={[
              styles.registerCard,
              compact && styles.compactRegisterCard,
            ]}
          >
            <Text
              style={[
                styles.registerTitle,
                compact && styles.compactRegisterTitle,
              ]}
            >
              New to TimeTap?
            </Text>
            <Text
              style={[
                styles.registerDescription,
                compact && styles.compactRegisterDescription,
              ]}
            >
              Create an account to get started.
            </Text>

            <Pressable
              style={[
                styles.secondaryButton,
                compact && styles.compactButton,
              ]}
              onPress={() => router.push('/register')}
              accessibilityRole="button"
            >
              <Text style={styles.secondaryButtonText}>
                Create an account
              </Text>
            </Pressable>
          </View>

          <Text style={styles.footer}>
            TIMETAP · ATTENDANCE MANAGEMENT
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F8FC',
  },
  keyboard: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 16,
    justifyContent: 'center',
  },
  compactContainer: {
    paddingHorizontal: 20,
    paddingTop: 5,
    paddingBottom: 7,
  },
  brandSection: {
    marginBottom: 22,
  },
  compactBrandSection: {
    marginBottom: 12,
  },
  brand: {
    color: '#173D75',
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1.5,
  },
  compactBrand: {
    fontSize: 31,
  },
  tagline: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.8,
    marginTop: 3,
  },
  hero: {
    backgroundColor: '#173D75',
    borderRadius: 22,
    padding: 21,
    marginBottom: 24,
  },
  compactHero: {
    borderRadius: 18,
    padding: 15,
    marginBottom: 14,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 27,
    fontWeight: '800',
    marginBottom: 9,
  },
  compactHeroTitle: {
    fontSize: 22,
    marginBottom: 5,
  },
  heroSubtitle: {
    color: '#E0EAFA',
    fontSize: 16,
    lineHeight: 23,
  },
  compactHeroSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  sectionTitle: {
    color: '#172033',
    fontSize: 24,
    fontWeight: '800',
  },
  compactTitle: {
    fontSize: 20,
  },
  description: {
    color: '#64748B',
    fontSize: 15,
    marginTop: 4,
    marginBottom: 18,
  },
  compactDescription: {
    fontSize: 12,
    marginTop: 2,
    marginBottom: 10,
  },
  form: {
    width: '100%',
  },
  label: {
    color: '#172033',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 7,
  },
  compactLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.3,
    borderColor: '#D9E1EF',
    borderRadius: 13,
    paddingHorizontal: 15,
    paddingVertical: 13,
    fontSize: 16,
    color: '#172033',
    marginBottom: 16,
  },
  compactInput: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    marginBottom: 10,
  },
  primaryButton: {
    backgroundColor: '#2463EB',
    minHeight: 54,
    padding: 15,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactButton: {
    minHeight: 42,
    padding: 9,
    borderRadius: 10,
  },
  disabledButton: {
    opacity: 0.65,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  loginNote: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: 14,
    marginBottom: 18,
  },
  compactLoginNote: {
    fontSize: 10,
    lineHeight: 13,
    marginTop: 7,
    marginBottom: 9,
  },
  registerCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.3,
    borderColor: '#D9E1EF',
    borderRadius: 18,
    padding: 18,
  },
  compactRegisterCard: {
    borderRadius: 14,
    padding: 12,
  },
  registerTitle: {
    color: '#172033',
    fontSize: 21,
    fontWeight: '800',
  },
  compactRegisterTitle: {
    fontSize: 17,
  },
  registerDescription: {
    color: '#64748B',
    fontSize: 14,
    marginTop: 5,
    marginBottom: 15,
  },
  compactRegisterDescription: {
    fontSize: 12,
    marginTop: 3,
    marginBottom: 8,
  },
  secondaryButton: {
    borderWidth: 1.5,
    borderColor: '#2463EB',
    backgroundColor: '#FFFFFF',
    minHeight: 51,
    padding: 13,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#2463EB',
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.7,
    textAlign: 'center',
    marginTop: 13,
  },
});
