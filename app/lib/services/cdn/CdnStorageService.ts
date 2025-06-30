/**
 * CDN Storage Service
 * Orchestrates multiple CDN providers with fallback support
 */

import type { 
  CdnStorageProvider, 
  CdnStorageConfig, 
  CdnUploadResult, 
  CdnUploadOptions 
} from './interfaces/CdnStorage';
import { CdnStorageError } from './interfaces/CdnStorage';

export class CdnStorageService {
  private readonly config: CdnStorageConfig;

  constructor(config: CdnStorageConfig) {
    this.config = config;
  }

  /**
   * Upload JSON data with automatic fallback support
   */
  async uploadJSON(
    data: object, 
    options: CdnUploadOptions = {}
  ): Promise<CdnUploadResult> {
    const mergedOptions = { ...this.config.defaultOptions, ...options };
    
    return this.executeWithFallback(
      (provider) => provider.uploadJSON(data, mergedOptions),
      'uploadJSON'
    );
  }

  /**
   * Upload binary data with automatic fallback support
   */
  async uploadBinary(
    data: Buffer | Uint8Array, 
    options: CdnUploadOptions = {}
  ): Promise<CdnUploadResult> {
    const mergedOptions = { ...this.config.defaultOptions, ...options };
    
    return this.executeWithFallback(
      (provider) => provider.uploadBinary(data, mergedOptions),
      'uploadBinary'
    );
  }

  /**
   * Upload text data with automatic fallback support
   */
  async uploadText(
    data: string, 
    options: CdnUploadOptions = {}
  ): Promise<CdnUploadResult> {
    const mergedOptions = { ...this.config.defaultOptions, ...options };
    
    return this.executeWithFallback(
      (provider) => provider.uploadText(data, mergedOptions),
      'uploadText'
    );
  }

  /**
   * Delete content from CDN
   */
  async delete(id: string): Promise<boolean> {
    const provider = this.getPrimaryProvider();
    
    if (!provider.delete) {
      throw new CdnStorageError(
        'Delete operation not supported by current provider',
        provider.name
      );
    }
    
    return provider.delete(id);
  }

  /**
   * Get content metadata
   */
  async getMetadata(id: string): Promise<CdnUploadResult | null> {
    const provider = this.getPrimaryProvider();
    
    if (!provider.getMetadata) {
      return null;
    }
    
    return provider.getMetadata(id);
  }

  /**
   * Get the primary configured provider
   */
  getPrimaryProvider(): CdnStorageProvider {
    return this.config.primary;
  }

  /**
   * Get all available providers
   */
  getAllProviders(): CdnStorageProvider[] {
    return [this.config.primary, ...(this.config.fallbacks || [])];
  }

  /**
   * Check if CDN storage is available
   */
  isAvailable(): boolean {
    return this.getAllProviders().some(provider => 
      provider.isConfigured()
    );
  }

  /**
   * Execute operation with automatic fallback
   */
  private async executeWithFallback<T>(
    operation: (provider: CdnStorageProvider) => Promise<T>,
    operationName: string
  ): Promise<T> {
    const providers = this.getAllProviders();
    const errors: Array<{ provider: string; error: Error }> = [];
    
    for (const provider of providers) {
      if (!provider.isConfigured()) {
        console.warn(`CDN provider ${provider.name} is not configured, skipping`);
        continue;
      }
      
      try {
        const result = await this.retryOperation(
          () => operation(provider),
          this.config.retry
        );
        
        // Log success if using fallback
        if (provider !== this.config.primary) {
          console.info(`CDN operation ${operationName} succeeded using fallback provider: ${provider.name}`);
        }
        
        return result;
      } catch (error) {
        console.warn(`CDN provider ${provider.name} failed for ${operationName}:`, error);
        errors.push({ 
          provider: provider.name, 
          error: error instanceof Error ? error : new Error(String(error))
        });
      }
    }
    
    // All providers failed
    const errorMessages = errors.map(e => `${e.provider}: ${e.error.message}`).join('; ');
    throw new CdnStorageError(
      `All CDN providers failed for ${operationName}. Errors: ${errorMessages}`,
      'all-providers'
    );
  }

  /**
   * Retry operation with configurable attempts and delay
   */
  private async retryOperation<T>(
    operation: () => Promise<T>,
    retryConfig?: { attempts: number; delay: number }
  ): Promise<T> {
    const config = retryConfig || { attempts: 3, delay: 1000 };
    let lastError: Error;
    
    for (let attempt = 1; attempt <= config.attempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt < config.attempts) {
          await this.delay(config.delay * attempt); // Exponential backoff
        }
      }
    }
    
    throw lastError!;
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}