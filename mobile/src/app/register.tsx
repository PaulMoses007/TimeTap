import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

export default function RegisterChoiceScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>‹ Back to login</Text>
        </Pressable>

        <Text style={styles.brand}>TimeTap</Text>
        <Text style={styles.heading}>Create an account</Text>
        <Text style={styles.subtitle}>Choose the type of account you need.</Text>

        <Pressable style={styles.card} onPress={() => router.push('/register-manager')}>
          <Text style={styles.cardTitle}>Register as Manager</Text>
          <Text style={styles.cardDescription}>
            Create a manager account to manage a restaurant and its team.
          </Text>
          <Text style={styles.link}>Continue as Manager →</Text>
        </Pressable>

        <Pressable style={styles.card} onPress={() => router.push('/register-employee')}>
          <Text style={styles.cardTitle}>Register as Employee</Text>
          <Text style={styles.cardDescription}>
            Join a restaurant using its invitation code. Manager approval may be required.
          </Text>
          <Text style={styles.link}>Continue as Employee →</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F8FC' },
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  back: { color: '#2463EB', fontSize: 16, marginBottom: 28 },
  brand: { color: '#173D75', fontSize: 32, fontWeight: '800' },
  heading: { color: '#172033', fontSize: 28, fontWeight: '800', marginTop: 24 },
  subtitle: { color: '#64748B', fontSize: 16, marginTop: 8, marginBottom: 26 },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D9E1EF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  cardTitle: { color: '#172033', fontSize: 20, fontWeight: '800' },
  cardDescription: { color: '#64748B', fontSize: 15, lineHeight: 22, marginTop: 10 },
  link: { color: '#2463EB', fontSize: 16, fontWeight: '700', marginTop: 18 },
});
