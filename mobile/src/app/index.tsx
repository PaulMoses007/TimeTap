
import { StyleSheet, Text, View, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.brand}>TimeTap</Text>
        <Text style={styles.tagline}>RESTAURANT ATTENDANCE</Text>

        <View style={styles.hero}>
          <Text style={styles.hello}>Welcome to TimeTap</Text>
          <Text style={styles.subtitle}>
            Simple attendance management for every restaurant.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Get started</Text>

        <Pressable
          style={styles.primaryButton}
          onPress={() => {}}
          accessibilityRole="button"
        >
          <Text style={styles.primaryButtonText}>Log in</Text>
        </Pressable>

        <Pressable
          style={styles.secondaryButton}
          onPress={() => {}}
          accessibilityRole="button"
        >
          <Text style={styles.secondaryButtonText}>Create an account</Text>
        </Pressable>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Your workday, in one place</Text>
          <Text style={styles.infoText}>
            Check in, check out, and track working hours with your restaurant team.
          </Text>
        </View>

        <Text style={styles.footer}>TIMETAP · ATTENDANCE MANAGEMENT</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F8FC',
  },
  container: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 20,
  },
  brand: {
    fontSize: 32,
    fontWeight: '800',
    color: '#173D75',
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 2,
    marginTop: 4,
  },
  hero: {
    backgroundColor: '#173D75',
    borderRadius: 24,
    padding: 24,
    marginTop: 32,
    marginBottom: 32,
  },
  hello: {
    color: '#FFFFFF',
    fontSize: 27,
    fontWeight: '800',
    marginBottom: 12,
  },
  subtitle: {
    color: '#E0EAFA',
    fontSize: 16,
    lineHeight: 24,
  },
  sectionTitle: {
    color: '#172033',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: '#2463EB',
    padding: 17,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    padding: 17,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D9E1EF',
  },
  secondaryButtonText: {
    color: '#173D75',
    fontSize: 16,
    fontWeight: '700',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    marginTop: 28,
    borderWidth: 1,
    borderColor: '#E5EAF2',
  },
  infoTitle: {
    color: '#172033',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 8,
  },
  infoText: {
    color: '#64748B',
    fontSize: 14,
    lineHeight: 22,
  },
  footer: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
    textAlign: 'center',
    marginTop: 32,
    marginBottom: 16,
  },
});
