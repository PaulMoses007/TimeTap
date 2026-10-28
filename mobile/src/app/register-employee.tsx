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
const ROLES = ['Server', 'Chef', 'DishWasher', 'Bartender', 'Cashier', 'Other'];

export default function RegisterEmployeeScreen() {
  const [invitationCode, setInvitationCode] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('Server');
  const [otherRole, setOtherRole] = useState('');
  const [password, setPassword] = useState('');
  const [scheduleType, setScheduleType] = useState<'Flexible' | 'Fixed'>('Flexible');
  const [shiftStart, setShiftStart] = useState('09:00');
  const [shiftEnd, setShiftEnd] = useState('17:00');
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!invitationCode.trim() || !firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim() || !password) {
      Alert.alert('Missing information', 'Please complete all required fields.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Password too short', 'Use at least 8 characters.');
      return;
    }
    if (scheduleType === 'Fixed' && (!shiftStart.trim() || !shiftEnd.trim() || shiftStart >= shiftEnd)) {
      Alert.alert('Invalid shift times', 'Enter valid times, with shift end later than shift start.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/register/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'Bypass-Tunnel-Reminder': 'true',
        },
        body: JSON.stringify({
          invitation_code: invitationCode.trim().toUpperCase(),
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          role: role === 'Other' ? otherRole.trim() : role,
          password,
          schedule_type: scheduleType,
          shift_start: scheduleType === 'Fixed' ? shiftStart.trim() : null,
          shift_end: scheduleType === 'Fixed' ? shiftEnd.trim() : null,
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
        'Registration submitted',
        `Your employee account has been created. Approval status: ${data.approval_status ?? 'Pending'}. You may need manager approval before signing in.`,
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
          <Text style={styles.heading}>Employee registration</Text>
          <Text style={styles.subtitle}>Use the invitation code supplied by your restaurant manager.</Text>

          <Field label="Restaurant invitation code" value={invitationCode} onChangeText={setInvitationCode} placeholder="Enter invitation code" autoCapitalize="characters" />
          <Field label="First name" value={firstName} onChangeText={setFirstName} placeholder="First name" />
          <Field label="Last name" value={lastName} onChangeText={setLastName} placeholder="Last name" />
          <Field label="Email address" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" />
          <Field label="Phone number" value={phone} onChangeText={setPhone} placeholder="Phone number" keyboardType="phone-pad" />
          <Text style={styles.label}>Job role</Text>
          <View style={styles.roleRow}>
            {ROLES.map((item) => (
              <Pressable key={item} style={[styles.roleChip, role === item && styles.roleChipSelected]} onPress={() => setRole(item)}>
                <Text style={[styles.roleText, role === item && styles.roleTextSelected]}>{item}</Text>
              </Pressable>
            ))}
          </View>
          {role === 'Other' && (
            <Field label="Your role" value={otherRole} onChangeText={setOtherRole} placeholder="Enter job role" />
          )}
          <Field label="Password (at least 8 characters)" value={password} onChangeText={setPassword} placeholder="Create a password" secureTextEntry />

          <Text style={styles.label}>Work schedule</Text>
          <View style={styles.roleRow}>
            {(['Flexible', 'Fixed'] as const).map((item) => (
              <Pressable key={item} style={[styles.scheduleButton, scheduleType === item && styles.roleChipSelected]} onPress={() => setScheduleType(item)}>
                <Text style={[styles.roleText, scheduleType === item && styles.roleTextSelected]}>{item}</Text>
              </Pressable>
            ))}
          </View>
          {scheduleType === 'Fixed' && (
            <View style={styles.timeRow}>
              <View style={styles.timeField}>
                <Field label="Shift start (HH:MM)" value={shiftStart} onChangeText={setShiftStart} placeholder="09:00" />
              </View>
              <View style={styles.timeField}>
                <Field label="Shift end (HH:MM)" value={shiftEnd} onChangeText={setShiftEnd} placeholder="17:00" />
              </View>
            </View>
          )}

          <Pressable style={[styles.button, loading && styles.disabled]} onPress={submit} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Create employee account</Text>}
          </Pressable>
          <Text style={styles.note}>New employee accounts may need manager approval before access is granted.</Text>
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
  container: { padding: 24, paddingBottom: 44 },
  back: { color: '#2463EB', fontSize: 16, marginBottom: 24 },
  brand: { color: '#173D75', fontSize: 30, fontWeight: '800' },
  heading: { color: '#172033', fontSize: 27, fontWeight: '800', marginTop: 20 },
  subtitle: { color: '#64748B', fontSize: 15, lineHeight: 21, marginTop: 8, marginBottom: 22 },
  label: { color: '#172033', fontSize: 14, fontWeight: '700', marginBottom: 7, marginTop: 5 },
  input: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D9E1EF', borderRadius: 12, padding: 14, fontSize: 16, color: '#172033', marginBottom: 14 },
  roleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  roleChip: { borderWidth: 1, borderColor: '#D9E1EF', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 9, backgroundColor: '#FFFFFF' },
  roleChipSelected: { backgroundColor: '#E8F1FF', borderColor: '#2463EB' },
  roleText: { color: '#475569', fontSize: 13, fontWeight: '600' },
  roleTextSelected: { color: '#173D75' },
  scheduleButton: { borderWidth: 1, borderColor: '#D9E1EF', borderRadius: 12, paddingHorizontal: 18, paddingVertical: 11, backgroundColor: '#FFFFFF' },
  timeRow: { flexDirection: 'row', gap: 12 },
  timeField: { flex: 1 },
  button: { backgroundColor: '#2463EB', padding: 16, borderRadius: 13, alignItems: 'center', marginTop: 12 },
  disabled: { opacity: 0.65 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  note: { color: '#64748B', fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 18 },
});
