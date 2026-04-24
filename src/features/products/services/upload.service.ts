import { axiosClient } from '@/config/axios';
import type { UploadResponse } from '../types';

const UPLOAD_ENDPOINT = '/upload';

export const UPLOAD_FOLDERS = {
  products: 'Products',
  productsGift: 'Products/Gift',
  brandsLogos: 'Brands/Logos',
  brandsBanners: 'Brands/Banners',
  banners: 'Banners',
  avatars: 'Avatars',
} as const;

export type UploadFolder = (typeof UPLOAD_FOLDERS)[keyof typeof UPLOAD_FOLDERS];

export const uploadService = {
  async upload(
    file: File,
    folder: UploadFolder,
    onProgress?: (percent: number) => void,
  ): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    const response = await axiosClient.post<UploadResponse>(UPLOAD_ENDPOINT, formData, {
      onUploadProgress: (event) => {
        if (onProgress && event.total) {
          onProgress(Math.round((event.loaded / event.total) * 100));
        }
      },
    });

    if (!response.data.signedUrl) {
      throw new Error('Upload response missing signedUrl');
    }

    return response.data.signedUrl;
  },
};
