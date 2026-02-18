// services/native/camera.service.ts
import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';

export interface PhotoResult {
  base64Data: string;
  mimeType: string;
  fileName?: string;
}

class CameraService {
  async capturePhoto(): Promise<PhotoResult> {
    if (!Capacitor.isNativePlatform()) {
      return this.capturePhotoFromBrowser();
    }

    const photo = await Camera.getPhoto({
      quality: 85,
      resultType: CameraResultType.Base64,
      source: CameraSource.Camera,
      correctOrientation: true,
      width: 1920,
      height: 1080,
    });

    return {
      base64Data: photo.base64String!,
      mimeType: `image/${photo.format}`,
    };
  }

  async pickFromGallery(): Promise<PhotoResult> {
    if (!Capacitor.isNativePlatform()) {
      return this.capturePhotoFromBrowser();
    }

    const photo = await Camera.getPhoto({
      quality: 90,
      resultType: CameraResultType.Base64,
      source: CameraSource.Photos,
    });

    return {
      base64Data: photo.base64String!,
      mimeType: `image/${photo.format}`,
    };
  }

  private async capturePhotoFromBrowser(): Promise<PhotoResult> {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment';

      input.onchange = () => {
        const file = input.files?.[0];
        if (!file) return reject(new Error('No file selected'));

        const reader = new FileReader();
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve({ 
            base64Data: base64, 
            mimeType: file.type, 
            fileName: file.name 
          });
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      };

      input.click();
    });
  }
}

export const cameraService = new CameraService();
