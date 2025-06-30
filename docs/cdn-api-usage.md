# CDN API Usage Guide

The system now supports full CDN integration for both PPTX input and JSON output, with client-side direct uploads to avoid Vercel's payload size limits.

## API Endpoints

### 1. CDN Upload Token
`POST /api/cdn-upload-token`

Generates secure upload tokens for client-side direct uploads to CDN. This endpoint uses Vercel Blob's secure client upload mechanism.

### 2. Parse PPTX
`POST /api/parse-pptx`

Parses PPTX files from direct upload or CDN URL.

## Request Parameters

### CDN Upload Token (`/api/cdn-upload-token`)

This endpoint follows Vercel Blob's client upload protocol. The request is handled automatically by the `@vercel/blob/client` library.

**Features:**
- Client-side unique filename generation (timestamp + random suffix)
- Server-side addRandomSuffix protection as backup
- File type validation (only .pptx and .json files allowed)  
- File size limit: 50MB maximum
- Public access for uploaded files

**Filename Format:** `original-name-{timestamp}-{random}.pptx`

### Parse PPTX (`/api/parse-pptx`)

**Form Data Fields:**
- `file` (File, optional): The PPTX file to upload directly
- `cdnUrl` (string, optional): URL of the PPTX file stored on CDN
- `format` (string, optional): Output format - "pptist" or "legacy" (default: "legacy")
- `useCdn` (boolean, optional): Whether to upload the parsed JSON result to CDN (default: false)
- `cdnFilename` (string, optional): Custom filename for CDN upload

**Note**: Either `file` or `cdnUrl` must be provided, but not both.

## Usage Examples

### 1. Client-Side Direct CDN Upload Workflow

**Step 1: Upload PPTX directly to CDN from browser**
```javascript
import { upload } from '@vercel/blob/client';

// Upload file directly from browser to CDN
const blob = await upload(file.name, file, {
  access: 'public',
  handleUploadUrl: '/api/cdn-upload-token',
});

console.log('File uploaded to:', blob.url);
// Returns: { url: "https://...vercel-storage.com/...", ... }
```

**Step 2: Parse from CDN URL**
```javascript
const parseFormData = new FormData();
parseFormData.append('cdnUrl', blob.url);
parseFormData.append('format', 'pptist');
parseFormData.append('useCdn', 'true'); // Also upload JSON result to CDN

const parseResponse = await fetch('/api/parse-pptx', {
  method: 'POST',
  body: parseFormData
});

const parseResult = await parseResponse.json();
```

### 2. Direct Parse from CDN URL
```javascript
const formData = new FormData();
formData.append('cdnUrl', 'https://cdn.example.com/presentation.pptx');
formData.append('format', 'pptist');
formData.append('useCdn', 'true');

const response = await fetch('/api/parse-pptx', {
  method: 'POST',
  body: formData
});

const result = await response.json();
```

### 3. Direct File Upload (existing functionality)
```javascript
const formData = new FormData();
formData.append('file', pptxFile);
formData.append('format', 'pptist');
formData.append('useCdn', 'true');

const response = await fetch('/api/parse-pptx', {
  method: 'POST',
  body: formData
});

const result = await response.json();
```

## Response Formats

### Client Upload Response (from @vercel/blob/client):
```json
{
  "pathname": "my-presentation.pptx",
  "contentType": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "contentDisposition": "attachment; filename=\"my-presentation.pptx\"",
  "url": "https://xxxxxx.public.blob.vercel-storage.com/my-presentation-xxxxxx.pptx",
  "downloadUrl": "https://xxxxxx.public.blob.vercel-storage.com/my-presentation-xxxxxx.pptx?download=1",
  "size": 54321
}
```

### Parse PPTX - When JSON CDN upload is successful:
```json
{
  "success": true,
  "cdnUrl": "https://cdn.example.com/pptx-result-1234567890.json",
  "cdnId": "unique-cdn-id",
  "filename": "presentation.pptx",
  "size": 12345,
  "contentType": "application/json",
  "metadata": {
    "originalFilename": "presentation.pptx",
    "uploadedAt": "2024-01-01T00:00:00.000Z",
    "format": "pptist"
  },
  "debug": {
    "fileSize": 54321,
    "cdnProvider": "vercel-blob",
    "uploadedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Parse PPTX - When JSON CDN upload is disabled or fails:
```json
{
  "success": true,
  "data": { /* parsed JSON data */ },
  "filename": "presentation.pptx",
  "debug": {
    "fileSize": 54321,
    "resultType": "object",
    "resultKeys": ["slides", "size", "fonts"],
    "hasData": true
  }
}
```

## Key Benefits

### 1. No Payload Size Limits
- **Problem**: Vercel has a 4.5MB request body limit
- **Solution**: Client uploads directly to CDN, bypassing the server

### 2. Better Performance
- **Direct Upload**: Files go straight to CDN without server processing
- **Parallel Processing**: Upload and parsing can happen concurrently

### 3. Improved Reliability
- **Reduced Server Load**: No large file handling on server
- **CDN Benefits**: Better global distribution and caching
- **Automatic Retry**: Built-in timeout handling and retry mechanism for CDN access

### 4. Robust Error Handling
- **30-second timeout** per request with automatic retry
- **3 retry attempts** with exponential backoff (1s, 2s, 4s delays)
- **Manual retry button** for failed CDN loads
- **Clear error messages** and recovery instructions

## Error Handling

### CDN Upload Error:
```json
{
  "error": "Failed to download file from CDN",
  "details": "Failed to download from CDN: 404 Not Found"
}
```

### No Input Provided:
```json
{
  "error": "No file uploaded or CDN URL provided"
}
```