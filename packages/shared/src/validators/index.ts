export const createAppSchema = {
  name: (value: string) => {
    if (!value || value.length < 2) return "Name must be at least 2 characters";
    if (value.length > 64) return "Name must be at most 64 characters";
    return null;
  },
  slug: (value: string) => {
    if (!value) return "Slug is required";
    if (!/^[a-z0-9-]+$/.test(value)) return "Slug must contain only lowercase letters, numbers, and hyphens";
    if (value.length < 2) return "Slug must be at least 2 characters";
    return null;
  },
  domain: (value: string | undefined | null) => {
    if (!value) return null;
    try {
      new URL(value);
      return null;
    } catch {
      return "Invalid URL";
    }
  },
};
