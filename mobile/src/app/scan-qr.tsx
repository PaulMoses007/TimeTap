
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = 'https://dry-clouds-thank.loca.lt';

type EmployeeProfile = {
  id?: number;
  restaurant_id?: number | null;
};

type AttendanceRecord = {
  check_in: string | null;
  check_out: string | null;
};

export default function ScanQRScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  async function handleBarCodeScanned({
    data,
  }: {
    data: string;
  }) {
    if (scanned || processing) return;

    setScanned(true);
    setProcessing(true);

    try {
      const match = data.match(/restaurant_id\s*=\s*(\d+)/i);

      if (!match) {
        throw new Error(
          'This QR code is not a valid TimeTap restaurant QR code.',
        );
      }

      const restaurantId = Number(match[1]);
      const token = await SecureStore.getItemAsync(
        'timetap_access_token',
      );

      if (!token) {
        throw new Error('Please log in again.');
      }

      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      const profileResponse = await fetch(
        `${API_BASE_URL}/employees/me`,
        { headers },
      );

      if (!profileResponse.ok) {
        throw new Error('Could not load your employee profile.');
      }

      const profile: EmployeeProfile = await profileResponse.json();

      if (
        profile.restaurant_id == null ||
        Number(profile.restaurant_id) !== restaurantId
      ) {
        throw new Error(
          'This QR code does not belong to your registered restaurant.',
        );
      }

      const historyResponse = await fetch(
        `${API_BASE_URL}/attendance/my`,
        { headers },
      );

      if (!historyResponse.ok) {
        throw new Error('Could not check your attendance status.');
      }

      const history: AttendanceRecord[] =
        await historyResponse.json();

      const isCheckedIn = history.some(
        (record) => record.check_out == null,
      );

      const action = isCheckedIn ? 'check-out' : 'check-in';

      const attendanceResponse = await fetch(
        `${API_BASE_URL}/attendance/${action}`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            restaurant_id: restaurantId,
          }),
        },
      );

      const result = await attendanceResponse.json().catch(() => null);

      if (!attendanceResponse.ok) {
        throw new Error(
          result?.detail ||
            `Could not record ${action.replace('-', ' ')}.`,
        );
      }

      Alert.alert(
        'Success',
        isCheckedIn
          ? 'Check-out recorded successfully!'
          : 'Check-in recorded successfully!',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/employee-dashboard'),
          },
        ],
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Something went wrong.';

      Alert.alert('QR Scan Failed', message, [
        {
          text: 'Try Again',
          onPress: () => {
            setScanned(false);
            setProcessing(false);
          },
        },
        {
          text: 'Back',
          onPress: () => router.back(),
        },
      ]);
    } finally {
      setProcessing(false);
    }
  }

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Checking camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Camera Permission Required</Text>
        <Text style={styles.description}>
          Allow camera access to scan your restaurant QR code.
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={requestPermission}
        >
          <Text style={styles.buttonText}>Allow Camera</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
        onBarcodeScanned={
          scanned || processing ? undefined : handleBarCodeScanned
        }
      />

      <View style={styles.overlay}>
        <Text style={styles.title}>Scan Restaurant QR</Text>
        <Text style={styles.description}>
          Point your camera at your restaurant's TimeTap QR code.
        </Text>

        <View style={styles.scanFrame} />

        {processing && (
          <View style={styles.processing}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.processingText}>
              Recording attendance...
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.back()}
        >
          <Text style={styles.buttonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
    backgroundColor: '#FFFFFF',
  },
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-around',
    padding: 24,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  processing: {
    alignItems: 'center',
    gap: 12,
  },
  processingText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backText: {
    color: '#2563EB',
    fontSize: 16,
  },
});