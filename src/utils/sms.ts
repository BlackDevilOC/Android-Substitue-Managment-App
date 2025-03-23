import { Capacitor } from '@capacitor/core';

interface CordovaSMSPlugin {
  hasPermission: (
    successCallback: (hasPermission: boolean) => void,
    errorCallback: (error: any) => void
  ) => void;
  requestPermission: (
    successCallback: (hasPermission: boolean) => void,
    errorCallback: (error: any) => void
  ) => void;
  send: (
    phoneNumber: string | string[],
    message: string,
    options: {
      replaceLineBreaks?: boolean;
      android?: {
        intent?: string;
      };
    },
    successCallback: () => void,
    errorCallback: (error: any) => void
  ) => void;
}

declare global {
  interface Window {
    cordova?: {
      plugins?: {
        sms?: CordovaSMSPlugin;
      };
    };
  }
}

/**
 * Send an SMS via Cordova SMS plugin
 * @param phoneNumber The recipient's phone number
 * @param message The message to send
 * @returns Promise<boolean> True if message was sent successfully
 */
export const sendSMS = async (phoneNumber: string, message: string): Promise<boolean> => {
  try {
    // Not available in web environment
    if (!Capacitor.isNativePlatform()) {
      console.log('[SMS] Not running on native platform, SMS not available');
      return false;
    }
    
    // Check if Cordova SMS plugin is available
    if (!window.cordova?.plugins?.sms) {
      console.error('[SMS] Cordova SMS plugin is not available');
      return false;
    }
    
    // Check permission
    const hasPermission = await checkSMSPermissions();
    if (!hasPermission) {
      console.log('[SMS] Requesting SMS permissions');
      const granted = await requestSMSPermissions();
      if (!granted) {
        console.error('[SMS] SMS permissions not granted');
        return false;
      }
    }
    
    // Send the SMS
    return new Promise((resolve) => {
      window.cordova!.plugins.sms!.send(
        phoneNumber,
        message,
        { replaceLineBreaks: true },
        () => {
          console.log('[SMS] Message sent successfully');
          resolve(true);
        },
        (error) => {
          console.error('[SMS] Error sending message:', error);
          resolve(false);
        }
      );
    });
  } catch (error) {
    console.error('[SMS] Error in sendSMS:', error);
    return false;
  }
};

/**
 * Check if the app has SMS permissions
 * @returns Promise<boolean> True if permissions are granted
 */
export const checkSMSPermissions = async (): Promise<boolean> => {
  try {
    // Not available in web environment
    if (!Capacitor.isNativePlatform()) {
      return false;
    }
    
    // Check if Cordova SMS plugin is available
    if (!window.cordova?.plugins?.sms) {
      return false;
    }
    
    return new Promise((resolve) => {
      window.cordova!.plugins.sms!.hasPermission(
        (hasPermission) => {
          resolve(hasPermission);
        },
        () => {
          resolve(false);
        }
      );
    });
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
    // Not available in web environment
    if (!Capacitor.isNativePlatform()) {
      return false;
    }
    
    // Check if Cordova SMS plugin is available
    if (!window.cordova?.plugins?.sms) {
      return false;
    }
    
    return new Promise((resolve) => {
      window.cordova!.plugins.sms!.requestPermission(
        (hasPermission) => {
          resolve(hasPermission);
        },
        () => {
          resolve(false);
        }
      );
    });
  } catch (error) {
    console.error('[SMS] Error requesting SMS permissions:', error);
    return false;
  }
};

/**
 * Generate a SMS link that can be used to open the default SMS app
 * @param phoneNumber The recipient's phone number
 * @param message The message to send
 * @returns The SMS link
 */
export const getSMSLink = (phoneNumber: string, message: string): string => {
  try {
    // URL encode the message
    const encodedMessage = encodeURIComponent(message);
    
    // iOS and Android use the same format
    return `sms:${phoneNumber}${encodedMessage ? `?body=${encodedMessage}` : ''}`;
  } catch (error) {
    console.error('[SMS] Error generating SMS link:', error);
    return `sms:${phoneNumber}`;
  }
};