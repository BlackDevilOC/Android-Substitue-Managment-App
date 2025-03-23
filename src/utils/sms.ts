/**
 * SMS utility functions for mobile devices
 * Uses Cordova SMS plugin for sending messages
 */

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

// Add the cordova plugins property to the Window interface
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
  return new Promise((resolve, reject) => {
    if (!window.cordova || !window.cordova.plugins || !window.cordova.plugins.sms) {
      console.warn('[SMS] Cordova SMS plugin not available');
      resolve(false);
      return;
    }

    const smsPlugin = window.cordova.plugins.sms;
    
    smsPlugin.send(
      phoneNumber,
      message,
      { replaceLineBreaks: false, android: { intent: '' } },
      () => {
        console.log(`[SMS] Message sent to ${phoneNumber}`);
        resolve(true);
      },
      (error: any) => {
        console.error(`[SMS] Failed to send message to ${phoneNumber}:`, error);
        resolve(false);
      }
    );
  });
};

/**
 * Check if the app has SMS permissions
 * @returns Promise<boolean> True if permissions are granted
 */
export const checkSMSPermissions = async (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (!window.cordova || !window.cordova.plugins || !window.cordova.plugins.sms) {
      console.warn('[SMS] Cordova SMS plugin not available');
      resolve(false);
      return;
    }

    const smsPlugin = window.cordova.plugins.sms;
    
    smsPlugin.hasPermission(
      (hasPermission: boolean) => {
        console.log(`[SMS] Has permission: ${hasPermission}`);
        resolve(hasPermission);
      },
      (error: any) => {
        console.error('[SMS] Error checking permission:', error);
        resolve(false);
      }
    );
  });
};

/**
 * Request SMS permissions from the user
 * @returns Promise<boolean> True if permissions are granted
 */
export const requestSMSPermissions = async (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (!window.cordova || !window.cordova.plugins || !window.cordova.plugins.sms) {
      console.warn('[SMS] Cordova SMS plugin not available');
      resolve(false);
      return;
    }

    const smsPlugin = window.cordova.plugins.sms;
    
    smsPlugin.requestPermission(
      (hasPermission: boolean) => {
        console.log(`[SMS] Permission request result: ${hasPermission}`);
        resolve(hasPermission);
      },
      (error: any) => {
        console.error('[SMS] Error requesting permission:', error);
        resolve(false);
      }
    );
  });
};

/**
 * Generate a SMS link that can be used to open the default SMS app
 * @param phoneNumber The recipient's phone number
 * @param message The message to send
 * @returns The SMS link
 */
export const getSMSLink = (phoneNumber: string, message: string): string => {
  const encodedMessage = encodeURIComponent(message);
  return `sms:${phoneNumber}${message ? `?body=${encodedMessage}` : ''}`;
};