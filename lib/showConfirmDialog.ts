import { Alert, Platform } from 'react-native';

type ConfirmDialogOptions = {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
};

export const showConfirmDialog = async (
  options: ConfirmDialogOptions
): Promise<boolean> => {
  const {
    title = 'Confirm',
    message,
    confirmText = 'OK',
    cancelText = 'Cancel',
    destructive = false,
  } = options;

  // Web version
  if (Platform.OS === 'web') {
    return window.confirm(message);
  }

  // Native version
  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        {
          text: cancelText,
          style: 'cancel',
          onPress: () => resolve(false),
        },
        {
          text: confirmText,
          style: destructive ? 'destructive' : 'default',
          onPress: () => resolve(true),
        },
      ],
      { cancelable: true }
    );
  });
};
