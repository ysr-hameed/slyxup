# Storage Service — `storage.slyxup.in`

File upload/download via Cloudflare R2. No database.

## SDK Usage

```ts
import { createSlyxupClient } from "@slyxup/sdk";

const api = createSlyxupClient({ storageBaseUrl: "https://storage.slyxup.in" });

// Upload file
const { key, url } = await api.storage.upload(file, "avatars/user-123.jpg");

// Get download URL
const downloadUrl = api.storage.getDownloadUrl("avatars/user-123.jpg");

// List files
const files = await api.storage.list("avatars/");
```

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/storage/upload` | Upload file (multipart) |
| GET | `/api/storage/download?key=` | Download file |
| GET | `/api/storage/list` | List files |
| GET | `/api/storage/docs` | Swagger UI |
