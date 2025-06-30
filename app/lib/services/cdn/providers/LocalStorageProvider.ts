/**
 * Local Storage Provider (Fallback)
 * Provides local file storage as fallback when CDN is not available
 */

import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import type { 
  CdnStorageProvider, 
  CdnUploadResult, 
  CdnUploadOptions 
} from '../interfaces/CdnStorage';
import { CdnStorageError } from '../interfaces/CdnStorage';

export class LocalStorageProvider implements CdnStorageProvider {
  readonly name = 'local-storage';
  private readonly baseDir: string;
  private readonly baseUrl: string;

  constructor(
    baseDir: string = './public/cdn-storage',
    baseUrl: string = '/cdn-storage'
  ) {
    this.baseDir = baseDir;
    this.baseUrl = baseUrl;
  }

  isConfigured(): boolean {
    // Local storage is always available as fallback
    return true;
  }

  async uploadJSON(
    data: object, 
    options: CdnUploadOptions = {}
  ): Promise<CdnUploadResult> {
    const jsonString = JSON.stringify(data, null, 2);
    const filename = options.filename || `json-${this.generateId()}.json`;
    
    return this.writeFile(filename, jsonString, 'application/json');
  }

  async uploadBinary(
    data: Buffer | Uint8Array, 
    options: CdnUploadOptions = {}
  ): Promise<CdnUploadResult> {
    const filename = options.filename || `binary-${this.generateId()}.bin`;
    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
    
    return this.writeFile(
      filename, 
      buffer, 
      options.contentType || 'application/octet-stream'
    );
  }

  async uploadText(
    data: string, 
    options: CdnUploadOptions = {}
  ): Promise<CdnUploadResult> {
    const filename = options.filename || `text-${this.generateId()}.txt`;
    
    return this.writeFile(
      filename, 
      data, 
      options.contentType || 'text/plain'
    );
  }

  async delete(id: string): Promise<boolean> {
    try {
      const filePath = path.join(this.baseDir, id);
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      console.warn(`Failed to delete local file ${id}:`, error);
      return false;
    }
  }

  async getMetadata(id: string): Promise<CdnUploadResult | null> {
    try {
      const filePath = path.join(this.baseDir, id);
      const stats = await fs.stat(filePath);
      
      // Try to detect content type from extension
      const ext = path.extname(id).toLowerCase();
      let contentType = 'application/octet-stream';
      
      if (ext === '.json') contentType = 'application/json';
      else if (ext === '.txt') contentType = 'text/plain';
      else if (ext === '.html') contentType = 'text/html';
      else if (ext === '.css') contentType = 'text/css';
      else if (ext === '.js') contentType = 'application/javascript';
      
      return {
        url: `${this.baseUrl}/${id}`,
        id,
        size: stats.size,
        contentType,
        metadata: {
          createdAt: stats.birthtime,
          modifiedAt: stats.mtime,
          isLocal: true,
        }
      };
    } catch (error) {
      return null;
    }
  }

  private async writeFile(
    filename: string, 
    data: string | Buffer, 
    contentType: string
  ): Promise<CdnUploadResult> {
    try {
      // Ensure directory exists
      await fs.mkdir(this.baseDir, { recursive: true });
      
      const filePath = path.join(this.baseDir, filename);
      await fs.writeFile(filePath, data);
      
      const stats = await fs.stat(filePath);
      
      return {
        url: `${this.baseUrl}/${filename}`,
        id: filename,
        size: stats.size,
        contentType,
        metadata: {
          filePath,
          createdAt: stats.birthtime,
          isLocal: true,
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new CdnStorageError(
        `Failed to write local file: ${errorMessage}`,
        this.name,
        error instanceof Error ? error : undefined
      );
    }
  }

  private generateId(): string {
    return crypto.randomBytes(16).toString('hex');
  }
}