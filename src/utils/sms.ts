import { Capacitor } from '@capacitor/core';

/**
 * Send an SMS via Cordova SMS plugin
 * @param phoneNumber The recipient's phone number
 * @param message The message to send
 * @returns Promise<boolean> True if message was sent successfully
 */
export const sendSMS = async (phoneNumber: string, message: string): Promise<boolean> => {
  try {
    // Only attempt to send SMS if running on a native platform
    if (!Capacitor.isNativePlatform()) {
      console.log(`[SMS] Not running on a native platform, would send message to ${phoneNumber}: ${message}`);
      return false;
    }

    // Ensure SMS permissions
    const hasPermission = await checkSMSPermissions();
    if (!hasPermission) {
      const granted = await requestSMSPermissions();
      if (!granted) {
        console.error('[SMS] SMS permissions not granted');
        return false;
      }
    }

    // Use Cordova plugin to send SMS
    // @ts-ignore - Access window object for Cordova plugin
    if (window.sms) {
      return new Promise((resolve) => {
        // @ts-ignore - Access window object for Cordova plugin
        window.sms.send(
          phoneNumber,
          message,
          { replaceLineBreaks: true },
          () => {
            console.log(`[SMS] Message sent to ${phoneNumber}`);
            resolve(true);
          },
          (error: any) => {
            console.error(`[SMS] Error sending message to ${phoneNumber}:`, error);
            resolve(false);
          }
        );
      });
    } else {
      console.error('[SMS] SMS plugin not available');
      return false;
    }
  } catch (error) {
    console.error('[SMS] Error sending SMS:', error);
    return false;
  }
};

/**
 * Check if the app has SMS permissions
 * @returns Promise<boolean> True if permissions are granted
 */
export const checkSMSPermissions = async (): Promise<boolean> => {
  try {
    if (!Capacitor.isNativePlatform()) {
      return false;
    }

    // For Android, we need to check permissions
    // @ts-ignore - Access window object for Cordova plugin
    if (window.sms && window.sms.hasPermission) {
      return new Promise((resolve) => {
        // @ts-ignore - Access window object for Cordova plugin
        window.sms.hasPermission(
          (hasPermission: boolean) => {
            resolve(hasPermission);
          },
          () => {
            resolve(false);
          }
        );
      });
    }

    // iOS doesn't need explicit SMS permissions
    return true;
  } catch (error) {
    console.error('[SMS] Error checking SMS permissions:', error);
    return false;
  }
};

/**
 * Request SMS permissions from the user
 * @returns Promise<boolean> True if permissions are granted
 */
export const requestSMSPermissions = async (): Promise<boolean> => {
  try {
    if (!Capacitor.isNativePlatform()) {
      return false;
    }

    // For Android, we need to request permissions
    // @ts-ignore - Access window object for Cordova plugin
    if (window.sms && window.sms.requestPermission) {
      return new Promise((resolve) => {
        // @ts-ignore - Access window object for Cordova plugin
        window.sms.requestPermission(
          (granted: boolean) => {
            resolve(granted);
          },
          () => {
            resolve(false);
          }
        );
      });
    }

    // iOS doesn't need explicit SMS permissions
    return true;
  } catch (error) {
    console.error('[SMS] Error requesting SMS permissions:', error);
    return false;
  }
};