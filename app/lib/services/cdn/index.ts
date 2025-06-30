/**
 * CDN Storage Module Exports
 * Centralized exports for all CDN storage functionality
 */

// Core interfaces and types
export type {
  CdnStorageProvider,
  CdnUploadResult,
  CdnUploadOptions,
  CdnStorageConfig,
} from "./interfaces/CdnStorage";

export { CdnStorageError } from "./interfaces/CdnStorage";

// Service
export { CdnStorageService } from "./CdnStorageService";

// Providers
export { VercelBlobProvider } from "./providers/VercelBlobProvider";
export { LocalStorageProvider } from "./providers/LocalStorageProvider";

// Factory function for easy configuration
export function createCdnStorageService() {
  const { VercelBlobProvider } = require("./providers/VercelBlobProvider");
  const { LocalStorageProvider } = require("./providers/LocalStorageProvider");
  const { CdnStorageService } = require("./CdnStorageService");

  const vercelProvider = new VercelBlobProvider();
  const localProvider = new LocalStorageProvider();

  const config = {
    primary: vercelProvider.isConfigured() ? vercelProvider : localProvider,
    fallbacks: vercelProvider.isConfigured() ? [localProvider] : [],
    defaultOptions: {
      access: "public" as const,
      cacheControl: "public, max-age=3600",
      ttl: 3600, // 1 hour
    },
    retry: {
      attempts: 3,
      delay: 1000,
    },
  };

  return new CdnStorageService(config);
}
