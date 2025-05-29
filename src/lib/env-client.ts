/**
 * Client-side environment variables accessor functions
 */

export function getApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
}

export function getMockEnabled(): boolean {
  return process.env.NEXT_PUBLIC_MOCK_ENABLED === 'true';
}

export function getCldCloudName(): string | undefined {
  return process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
}

export function getCldUploadPreset(): string | undefined {
  return process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
} 