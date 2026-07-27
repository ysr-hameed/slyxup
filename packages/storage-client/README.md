# @slyxup/storage-client

HTTP client for the Slyxup Storage Service. Upload, download, and list files in Cloudflare R2. No database.

## Installation

```bash
npm install @slyxup/storage-client
```

## Usage

```ts
import { createStorageClient } from "@slyxup/storage-client";

const storage = createStorageClient({
  baseUrl: "https://storage.slyxup.online",
  apiKey: "sk-...", // required for server-side use
});
```

### Upload

```ts
// Upload with auto-generated key
const file = new File(["hello world"], "hello.txt", { type: "text/plain" });
const result = await storage.upload(file);
// → { key: "a1b2c3.txt", url: "https://storage.slyxup.online/api/storage/download?key=a1b2c3.txt" }

// Upload with custom key
await storage.upload(file, "users/user_xyz/avatar.png");
// → { key: "users/user_xyz/avatar.png", url: "..." }
```

### Download URL

```ts
// Get download URL (no API call — constructs URL locally)
const dlUrl = storage.getDownloadUrl("users/user_xyz/avatar.png");
// → "https://storage.slyxup.online/api/storage/download?key=users%2Fuser_xyz%2Favatar.png"
```

### List files

```ts
const files = await storage.list("users/user_xyz/");
// → [{ key: "users/user_xyz/avatar.png", size: 1234, etag: "...", uploaded: "2026-07-27T..." }]

const allFiles = await storage.list();
// → all files
```

`FileItem` fields:

| Field | Type | Description |
|-------|------|-------------|
| `key` | `string` | Object key (path) in R2 |
| `size` | `number` | File size in bytes |
| `etag` | `string` | R2 object ETag |
| `uploaded` | `string` | ISO 8601 upload timestamp |

## API

### `createStorageClient(config)`

| Config | Type | Default | Description |
|--------|------|---------|-------------|
| `baseUrl` | `string` | `https://storage.slyxup.online` | Storage service URL |
| `apiKey` | `string` | — | Service API key (sent as `X-API-Key` header) |

### Methods

| Method | Parameters | Returns |
|--------|-----------|---------|
| `upload` | `file: File, key?: string` | `UploadResult` |
| `getDownloadUrl` | `key: string` | `string` |
| `list` | `prefix?: string` | `FileItem[]` |

### Types

```ts
interface UploadResult {
  key: string;
  url: string;    // download URL
}
```

## Error handling

```ts
try {
  await storage.upload(new File([], "")); // empty file
} catch (err) {
  console.error(err.message);
}
```
