import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  label: string;
  // How long the person must keep pressing, in seconds
  seconds?: number;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary';
  onComplete: () => void;
};

const TICK_MS = 100;

/**
 * A button that only fires after being held down for `seconds`.
 * Releasing early cancels and resets the progress bar.
 */
export default function HoldButton({
  label,
  seconds = 15,
  disabled = false,
  loading = false,
  variant = 'primary',
  onComplete,
}: Props) {
  const [elapsed, setElapsed] = useState(0);
  const [holding, setHolding] = useState(false);
  const [tooShort, setTooShort] = useState(false);

  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAt = useRef(0);
  const fired = useRef(false);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const stop = () => {
    if (timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }
  };

  // never leave a timer running after leaving the screen
  useEffect(() => stop, []);

  const start = () => {
    if (disabled || loading) return;

    fired.current = false;
    startedAt.current = Date.now();

    setTooShort(false);
    setHolding(true);
    setElapsed(0);

    stop();
    timer.current = setInterval(() => {
      const seconds_held = (Date.now() - startedAt.current) / 1000;

      if (seconds_held >= seconds) {
        stop();
        setElapsed(seconds);
        setHolding(false);

        if (!fired.current) {
          fired.current = true;
          onCompleteRef.current();
        }
        return;
      }

      setElapsed(seconds_held);
    }, TICK_MS);
  };

  const release = () => {
    if (fired.current || !timer.current) return;

    stop();
    setHolding(false);
    setElapsed(0);
    setTooShort(true);
  };

  const remaining = Math.max(0, Math.ceil(seconds - elapsed));
  const progress = Math.min(1, elapsed / seconds);
  const isPrimary = variant === 'primary';

  return (
    <View style={styles.wrapper}>
      <Pressable
        onPressIn={start}
        onPressOut={release}
        // be forgiving if the finger slides a little while holding
        pressRetentionOffset={{ top: 300, bottom: 300, left: 300, right: 300 }}
        disabled={disabled || loading}
        style={[
          styles.button,
          isPrimary ? styles.primary : styles.secondary,
          (disabled || loading) && styles.disabled,
        ]}
        accessibilityRole="button"
        accessibilityLabel={`${label}. Press and hold for ${seconds} seconds.`}
      >
        {/* progress fill */}
        <View
          pointerEvents="none"
          style={[
            styles.fill,
            isPrimary ? styles.fillPrimary : styles.fillSecondary,
            { width: `${progress * 100}%` },
          ]}
        />

        {loading ? (
          <ActivityIndicator color={isPrimary ? '#FFFFFF' : '#2463EB'} />
        ) : (
          <Text style={[styles.text, isPrimary ? styles.textPrimary : styles.textSecondary]}>
            {holding ? `Keep holding… ${remaining}s` : label}
          </Text>
        )}
      </Pressable>

      {!disabled && !loading && (
        <Text style={[styles.hint, tooShort && styles.hintWarning]}>
          {tooShort
            ? `Released too early - hold for ${seconds} seconds`
            : `Press and hold for ${seconds} seconds`}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginTop: 14 },
  button: {
    minHeight: 56,
    borderRadius: 14,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  primary: { backgroundColor: '#2463EB' },
  secondary: { backgroundColor: '#E7F0FF' },
  disabled: { opacity: 0.5 },
  fill: { position: 'absolute', left: 0, top: 0, bottom: 0 },
  fillPrimary: { backgroundColor: '#173D75' },
  fillSecondary: { backgroundColor: '#B6D0FF' },
  text: { fontSize: 17, fontWeight: '700' },
  textPrimary: { color: '#FFFFFF' },
  textSecondary: { color: '#2463EB' },
  hint: { color: '#64748B', fontSize: 13, marginTop: 6, textAlign: 'center' },
  hintWarning: { color: '#B45309' },
});
