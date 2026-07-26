const configuredOrigin = import.meta.env.VITE_DEMO_PUBLIC_ORIGIN?.trim();

export function getDemoPublicUrl(path: string) {
  const origin = configuredOrigin || window.location.origin;
  return `${origin.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}
