
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="manager-dashboard" />
        <Stack.Screen name="attendance" />
        <Stack.Screen name="team" />
        <Stack.Screen name="explore" />
      </Stack>
    </>
  );
}
