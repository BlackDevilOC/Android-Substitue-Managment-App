declare const window: any;

export const sendSMS = async (phoneNumber: string, message: string): Promise<boolean> => {
  try {
    if (window.Android) {
      // Use native Android SMS functionality
      window.Android.sendSMS(phoneNumber, message);
      return true;
    } else {
      console.error('Native SMS functionality not available');
      return false;
    }
  } catch (error) {
    console.error('Error sending SMS:', error);
    return false;
  }
};

export const checkSMSPermissions = async (): Promise<boolean> => {
  try {
    if (window.Android) {
      // In Android, permissions are handled by the native code
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error checking SMS permissions:', error);
    return false;
  }
};

export const requestSMSPermissions = async (): Promise<boolean> => {
  try {
    if (window.Android) {
      // In Android, permissions are handled by the native code
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error requesting SMS permissions:', error);
    return false;
  }
}; 