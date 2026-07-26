# @slyxup/storage-client

HTTP client for the Slyxup Storage Service. Upload and manage files in Cloudflare R2.

## Installation

```bash
npm install @slyxup/storage-client
```

## Usage

```ts
import { createStorageClient } from "@slyxup/storage-client";

const storage = createStorageClient({
  baseUrl: "https://storage.slyxup.online",
  apiKey: "sk-...", // required
});

// Upload a file
const file = new File(["hello world"], "hello.txt", { type: "text/plain" });
const { key, url } = await storage.upload(file);
// key = "abc123.txt"
// url = "https://storage.slyxup.online/api/storage/download?key=abc123.txt"

// Upload with custom key
await storage.upload(file, "users/user_xyz/avatar.png");

// Get download URL (no API call)
const dlUrl = storage.getDownloadUrl("users/user_xyz/avatar.png");

// List files
const files = await storage.list("users/user_xyz/");
// files = [{ key, size, etag, uploaded }]
```

## API

### `createStorageClient(config)`

| Config    | Type     | Default                          | Description |
|-----------|----------|----------------------------------|-------------|
| `baseUrl` | `string` | `https://storage.slyxup.online`  | Storage service URL |
| `apiKey`  | `string` | —                                | Service API key |

### Methods

| Method | Parameters | Returns |
|--------|-----------|---------|
| `upload` | `file: File, key?: string` | `{ key, url }` |
| `getDownloadUrl` | `key: string` | `string` |
| `list` | `prefix?: string` | `FileItem[]` |
