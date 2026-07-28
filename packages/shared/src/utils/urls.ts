export function validateRedirectUrl(url: string, allowedUrls: string[]): boolean {
  try {
    const parsed = new URL(url);
    return allowedUrls.some((allowed) => {
      const allowedParsed = new URL(allowed);
      return (
        parsed.protocol === allowedParsed.protocol &&
        parsed.hostname === allowedParsed.hostname &&
        parsed.port === allowedParsed.port
      );
    });
  } catch {
    return false;
  }
}

export function validateOrigin(origin: string, allowedOrigins: string[]): boolean {
  return allowedOrigins.some((allowed) => {
    if (allowed === "*") return true;
    try {
      const parsedOrigin = new URL(origin);
      const parsedAllowed = new URL(allowed);
      return parsedOrigin.origin === parsedAllowed.origin;
    } catch {
      return false;
    }
  });
}
