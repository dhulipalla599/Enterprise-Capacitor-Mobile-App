// services/native/biometrics.service.ts
import { Capacitor } from '@capacitor/core';
import { BiometricAuth, BiometryType, BiometryError, BiometryErrorType } from '@aparajita/capacitor-biometric-auth';

export interface BiometricCapabilities {
  isAvailable: boolean;
  biometryType: BiometryType;
  hasEnrollment: boolean;
  strongBiometryIsAvailable: boolean;
}

export class BiometricsService {
  private isInitialized = false;
  private capabilities: BiometricCapabilities | null = null;

  /**
   * Check device biometric capabilities
   */
  async checkCapabilities(): Promise<BiometricCapabilities> {
    if (!Capacitor.isNativePlatform()) {
      // Browser fallback — always returns false
      return {
        isAvailable: false,
        biometryType: BiometryType.none,
        hasEnrollment: false,
        strongBiometryIsAvailable: false,
      };
    }

    try {
      const result = await BiometricAuth.checkBiometry();
      this.capabilities = result;
      this.isInitialized = true;
      return result;
    } catch (error) {
      console.error('Failed to check biometric capabilities:', error);
      throw new Error('Unable to check biometric availability');
    }
  }

  /**
   * Authenticate user with biometrics
   * @param reason - Reason shown to user (iOS) or title (Android)
   * @param options - Additional authentication options
   */
  async authenticate(
    reason: string,
    options?: {
      allowDeviceCredential?: boolean;
      cancelTitle?: string;
      subtitle?: string;
      confirmationRequired?: boolean;
    }
  ): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      // Browser fallback — simulate successful auth in dev
      console.log('[DEV] Biometric auth bypassed in browser');
      return true;
    }

    if (!this.isInitialized) {
      await this.checkCapabilities();
    }

    if (!this.capabilities?.isAvailable) {
      throw new Error('Biometric authentication not available on this device');
    }

    if (!this.capabilities.hasEnrollment) {
      throw new Error('No biometric credentials enrolled. Please set up Touch ID, Face ID, or fingerprint.');
    }

    try {
      await BiometricAuth.authenticate({
        reason,
        cancelTitle: options?.cancelTitle || 'Cancel',
        allowDeviceCredential: options?.allowDeviceCredential ?? true,
        iosFallbackTitle: 'Use Passcode',
        androidTitle: reason,
        androidSubtitle: options?.subtitle,
        androidConfirmationRequired: options?.confirmationRequired ?? false,
        androidBiometryStrength: 'strong', // Require Class 3 biometrics
      });

      return true;
    } catch (error) {
      return this.handleBiometricError(error as BiometryError);
    }
  }

  /**
   * Handle biometric authentication errors
   */
  private handleBiometricError(error: BiometryError): boolean {
    switch (error.code) {
      case BiometryErrorType.userCancel:
      case BiometryErrorType.systemCancel:
      case BiometryErrorType.appCancel:
        // User deliberately cancelled — not an error
        console.log('Biometric authentication cancelled');
        return false;

      case BiometryErrorType.biometryLockout:
        throw new Error(
          'Too many failed biometric attempts. Please use your device passcode or try again later.'
        );

      case BiometryErrorType.biometryNotAvailable:
        throw new Error('Biometric authentication is not available on this device.');

      case BiometryErrorType.biometryNotEnrolled:
        throw new Error('No biometric credentials enrolled. Please set up Touch ID, Face ID, or fingerprint.');

      case BiometryErrorType.noDeviceCredential:
        throw new Error('No device credential (PIN/password) set. Please set up device security.');

      case BiometryErrorType.passcodeNotSet:
        throw new Error('Device passcode not set. Biometric authentication requires a passcode fallback.');

      case BiometryErrorType.authenticationFailed:
        throw new Error('Biometric authentication failed. Please try again.');

      default:
        console.error('Biometric error:', error);
        throw new Error(`Biometric authentication error: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Get biometry type for display purposes
   */
  getBiometryTypeName(): string {
    if (!this.capabilities) {
      return 'Biometrics';
    }

    switch (this.capabilities.biometryType) {
      case BiometryType.fingerprintAuthentication:
        return 'Fingerprint';
      case BiometryType.faceAuthentication:
        return 'Face ID';
      case BiometryType.irisAuthentication:
        return 'Iris';
      case BiometryType.touchId:
        return 'Touch ID';
      case BiometryType.faceId:
        return 'Face ID';
      default:
        return 'Biometrics';
    }
  }

  /**
   * Check if device has strong biometry (Class 3)
   */
  hasStrongBiometry(): boolean {
    return this.capabilities?.strongBiometryIsAvailable ?? false;
  }

  /**
   * Prompt user to enroll biometrics (iOS only)
   */
  async promptEnrollment(): Promise<void> {
    if (Capacitor.getPlatform() === 'ios') {
      // On iOS, we can't programmatically open Settings, but we can show a helpful message
      throw new Error(
        'Please enable Touch ID or Face ID in Settings > Face ID & Passcode'
      );
    } else if (Capacitor.getPlatform() === 'android') {
      // Android: Guide user to Settings
      throw new Error(
        'Please enable fingerprint authentication in Settings > Security > Fingerprint'
      );
    }
  }
}

// Singleton export
export const biometricsService = new BiometricsService();
