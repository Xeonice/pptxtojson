/**
 * Vercel Blob Storage Provider
 * Implements CDN storage using Vercel's Blob service
 */

import { put, del, head } from '@vercel/blob';
import type { 
  CdnStorageProvider, 
  CdnUploadResult, 
  CdnUploadOptions
} from '../interfaces/CdnStorage';
import { CdnStorageError } from '../interfaces/CdnStorage';

export class VercelBlobProvider implements CdnStorageProvider {
  readonly name = 'vercel-blob';

  isConfigured(): boolean {
    // Check if Vercel Blob token is available
    return !!(
      process.env.BLOB_READ_WRITE_TOKEN || 
      process.env.VERCEL_BLOB_READ_WRITE_TOKEN
    );
  }

  async uploadJSON(
    data: object, 
    options: CdnUploadOptions = {}
  ): Promise<CdnUploadResult> {
    const jsonString = JSON.stringify(data, null, 2);
    const filename = options.filename || `json-${Date.now()}.json`;
    
    try {
      const blob = await put(filename, jsonString, {
        access: (options.access || 'public') as 'public',
        contentType: options.contentType || 'application/json',
        cacheControlMaxAge: options.ttl || 3600, // 1 hour default
        addRandomSuffix: !options.filename, // Add random suffix if no custom filename
      });

      return {
        url: blob.url,
        id: this.extractIdFromUrl(blob.url),
        size: Buffer.byteLength(jsonString, 'utf8'),
        contentType: 'application/json',
        metadata: {
          downloadUrl: blob.downloadUrl,
          pathname: blob.pathname,
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new CdnStorageError(
        `Failed to upload JSON: ${errorMessage}`,
        this.name,
        error instanceof Error ? error : undefined
      );
    }
  }

  async uploadBinary(
    data: Buffer | Uint8Array, 
    options: CdnUploadOptions = {}
  ): Promise<CdnUploadResult> {
    const filename = options.filename || `binary-${Date.now()}.bin`;
    
    try {
      const blob = await put(filename, data, {
        access: (options.access || 'public') as 'public',
        contentType: options.contentType || 'application/octet-stream',
        cacheControlMaxAge: options.ttl || 86400, // 24 hours default for binaries
        addRandomSuffix: !options.filename,
      });

      return {
        url: blob.url,
        id: this.extractIdFromUrl(blob.url),
        size: data.length,
        contentType: options.contentType || 'application/octet-stream',
        metadata: {
          downloadUrl: blob.downloadUrl,
          pathname: blob.pathname,
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new CdnStorageError(
        `Failed to upload binary data: ${errorMessage}`,
        this.name,
        error instanceof Error ? error : undefined
      );
    }
  }

  async uploadText(
    data: string, 
    options: CdnUploadOptions = {}
  ): Promise<CdnUploadResult> {
    const filename = options.filename || `text-${Date.now()}.txt`;
    
    try {
      const blob = await put(filename, data, {
        access: (options.access || 'public') as 'public',
        contentType: options.contentType || 'text/plain',
        cacheControlMaxAge: options.ttl || 3600,
        addRandomSuffix: !options.filename,
      });

      return {
        url: blob.url,
        id: this.extractIdFromUrl(blob.url),
        size: Buffer.byteLength(data, 'utf8'),
        contentType: options.contentType || 'text/plain',
        metadata: {
          downloadUrl: blob.downloadUrl,
          pathname: blob.pathname,
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new CdnStorageError(
        `Failed to upload text: ${errorMessage}`,
        this.name,
        error instanceof Error ? error : undefined
      );
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await del(id);
      return true;
    } catch (error) {
      console.warn(`Failed to delete blob ${id}:`, error);
      return false;
    }
  }

  async getMetadata(id: string): Promise<CdnUploadResult | null> {
    try {
      const metadata = await head(id);
      
      return {
        url: metadata.url,
        id: this.extractIdFromUrl(metadata.url),
        size: metadata.size,
        contentType: metadata.contentType || 'application/octet-stream',
        metadata: {
          downloadUrl: metadata.downloadUrl,
          pathname: metadata.pathname,
          uploadedAt: metadata.uploadedAt,
        }
      };
    } catch (error) {
      console.warn(`Failed to get metadata for ${id}:`, error);
      return null;
    }
  }

  private extractIdFromUrl(url: string): string {
    // Extract blob ID from Vercel Blob URL
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      // Vercel blob URLs typically have the format: /path/to/blob-id
      return pathname.split('/').pop() || url;
    } catch {
      return url;
    }
  }
}

// Re-export the error class for convenience
export { CdnStorageError } from '../interfaces/CdnStorage';