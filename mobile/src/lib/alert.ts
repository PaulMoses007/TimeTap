import { Alert as NativeAlert, Platform } from 'react-native';

// react-native-web's Alert.alert() does nothing, so in a browser every
// message, error and "are you sure?" box would be silently dropped.
// This wrapper keeps the normal Alert on phones and uses the browser's
// own dialogs on the web.

type AlertButton = {
  text?: string;
  onPress?: () => void | Promise<void>;
  style?: 'default' | 'cancel' | 'destructive';
};

function webAlert(title: string, message?: string, buttons?: AlertButton[]) {
  const text = message ? `${title}\n\n${message}` : title;

  // Just a message
  if (!buttons || buttons.length <= 1) {
    window.alert(text);
    void buttons?.[0]?.onPress?.();
    return;
  }

  const cancel = buttons.find((button) => button.style === 'cancel');
  const actions = buttons.filter((button) => button !== cancel);

  // "Cancel" + one action  ->  OK / Cancel
  if (cancel && actions.length === 1) {
    if (window.confirm(text)) {
      void actions[0].onPress?.();
    } else {
      void cancel.onPress?.();
    }
    return;
  }

  // Two choices without a cancel button, e.g. "Try Again" / "Back"
  const first = actions[0];
  const second = actions[1] ?? cancel;

  const ok = window.confirm(
    `${text}\n\nOK = ${first?.text ?? 'OK'}\nCancel = ${second?.text ?? 'Cancel'}`,
  );

  void (ok ? first : second)?.onPress?.();
}

export const Alert = {
  alert(title: string, message?: string, buttons?: AlertButton[]) {
    if (Platform.OS === 'web') {
      webAlert(title, message, buttons);
      return;
    }

    NativeAlert.alert(title, message, buttons);
  },
};
