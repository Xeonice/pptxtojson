/**
 * CDN Storage Interface for JSON and Binary Data
 * Provides abstraction for different CDN providers
 */

export interface CdnUploadResult {
  /** Public URL to access the uploaded content */
  url: string;
  /** Unique identifier for the uploaded content */
  id: string;
  /** Size of uploaded content in bytes */
  size: number;
  /** MIME type of the content */
  contentType: string;
  /** Additional metadata from the CDN provider */
  metadata?: Record<string, any>;
}

export interface CdnUploadOptions {
  /** Custom filename (optional) */
  filename?: string;
  /** Content type override */
  contentType?: string;
  /** Access control settings */
  access?: 'public' | 'private';
  /** Cache control headers */
  cacheControl?: string;
  /** Custom metadata */
  metadata?: Record<string, any>;
  /** TTL in seconds */
  ttl?: number;
}

export interface CdnStorageProvider {
  /** Provider name for identification */
  readonly name: string;
  
  /** Check if the provider is properly configured */
  isConfigured(): boolean;
  
  /** Upload JSON data to CDN */
  uploadJSON(
    data: object, 
    options?: CdnUploadOptions
  ): Promise<CdnUploadResult>;
  
  /** Upload binary data to CDN */
  uploadBinary(
    data: Buffer | Uint8Array, 
    options?: CdnUploadOptions
  ): Promise<CdnUploadResult>;
  
  /** Upload text data to CDN */
  uploadText(
    data: string, 
    options?: CdnUploadOptions
  ): Promise<CdnUploadResult>;
  
  /** Delete content from CDN (optional) */
  delete?(id: string): Promise<boolean>;
  
  /** Get content metadata (optional) */
  getMetadata?(id: string): Promise<CdnUploadResult | null>;
}

export interface CdnStorageConfig {
  /** Primary CDN provider to use */
  primary: CdnStorageProvider;
  
  /** Fallback providers in order of preference */
  fallbacks?: CdnStorageProvider[];
  
  /** Default upload options */
  defaultOptions?: CdnUploadOptions;
  
  /** Retry configuration */
  retry?: {
    attempts: number;
    delay: number;
  };
}

export class CdnStorageError extends Error {
  constructor(
    message: string,
    public provider: string,
    public originalError?: Error
  ) {
    super(`CDN Storage Error (${provider}): ${message}`);
    this.name = 'CdnStorageError';
  }
}