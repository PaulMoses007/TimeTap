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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

const API_BASE_URL = 'https://dry-clouds-thank.loca.lt';

export default function RegisterManagerScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim() || !password) {
      Alert.alert('Missing information', 'Please complete every field.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Password too short', 'Use at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/register/manager`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'Bypass-Tunnel-Reminder': 'true',
        },
        body: JSON.stringify({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          password,
        }),
      });

      const text = await response.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`Unexpected server response (HTTP ${response.status}).`);
      }

      if (!response.ok) {
        throw new Error(typeof data.detail === 'string' ? data.detail : `Registration failed (HTTP ${response.status}).`);
      }

      Alert.alert(
        'Manager account created',
        'Your manager account has been created. You can now log in. Your restaurant may need to be created or assigned before you can manage employees.',
        [{ text: 'Go to login', onPress: () => router.replace('/login') }],
      );
    } catch (error) {
      Alert.alert(
        'Registration failed',
        error instanceof Error ? error.message : 'Please check your connection and try again.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => router.back()}>
            <Text style={styles.back}>‹ Back</Text>
          </Pressable>
          <Text style={styles.brand}>TimeTap</Text>
          <Text style={styles.heading}>Manager registration</Text>
          <Text style={styles.subtitle}>Create your manager account.</Text>

          <Field label="First name" value={firstName} onChangeText={setFirstName} placeholder="First name" />
          <Field label="Last name" value={lastName} onChangeText={setLastName} placeholder="Last name" />
          <Field label="Email address" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" />
          <Field label="Phone number" value={phone} onChangeText={setPhone} placeholder="Phone number" keyboardType="phone-pad" />
          <Field label="Password (at least 8 characters)" value={password} onChangeText={setPassword} placeholder="Create a password" secureTextEntry />

          <Pressable style={[styles.button, loading && styles.disabled]} onPress={submit} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Create manager account</Text>}
          </Pressable>
          <Text style={styles.note}>
            Registration creates the manager account. Restaurant setup is a separate step in the current backend.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  secureTextEntry?: boolean;
}) {
  return (
    <View>
      <Text style={styles.label}>{props.label}</Text>
      <TextInput
        style={styles.input}
        value={props.value}
        onChangeText={props.onChangeText}
        placeholder={props.placeholder}
        placeholderTextColor="#94A3B8"
        keyboardType={props.keyboardType ?? 'default'}
        autoCapitalize={props.autoCapitalize ?? 'words'}
        autoCorrect={false}
        secureTextEntry={props.secureTextEntry}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F8FC' },
  keyboard: { flex: 1 },
  container: { padding: 24, paddingBottom: 40 },
  back: { color: '#2463EB', fontSize: 16, marginBottom: 24 },
  brand: { color: '#173D75', fontSize: 30, fontWeight: '800' },
  heading: { color: '#172033', fontSize: 27, fontWeight: '800', marginTop: 20 },
  subtitle: { color: '#64748B', fontSize: 15, marginTop: 8, marginBottom: 24 },
  label: { color: '#172033', fontSize: 14, fontWeight: '700', marginBottom: 7, marginTop: 5 },
  input: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D9E1EF', borderRadius: 12, padding: 14, fontSize: 16, color: '#172033', marginBottom: 14 },
  button: { backgroundColor: '#2463EB', padding: 16, borderRadius: 13, alignItems: 'center', marginTop: 12 },
  disabled: { opacity: 0.65 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  note: { color: '#64748B', fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 18 },
});
