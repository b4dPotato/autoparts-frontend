export function parseAllowedTrackingOrigins(
  nodeEnvironment: string | undefined,
  configuredOrigins: string | undefined
) {
  const configured = (configuredOrigins ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .flatMap((item) => {
      try {
        const url = new URL(item);
        if (
          !['http:', 'https:'].includes(url.protocol) ||
          url.username ||
          url.password ||
          url.pathname !== '/' ||
          url.search ||
          url.hash
        ) return [];
        return [url.origin];
      } catch {
        return [];
      }
    });
  return new Set(
    nodeEnvironment === 'production'
      ? configured
      : [...configured, 'http://localhost:3000']
  );
}
