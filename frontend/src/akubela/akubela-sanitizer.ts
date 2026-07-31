const sensitiveKeys = /(token|secret|senha|password|credential|mac|serial|device.?id|location.?id|project.?id)/i;

export function maskAkubelaIdentifier(value?: string) {
  if (!value) return "Não informado";
  if (value.length <= 6) return "••••••";
  return `${value.slice(0, 3)}••••${value.slice(-3)}`;
}

export function sanitizeAkubelaLog(value: unknown): string {
  return JSON.stringify(value, (key, item) => sensitiveKeys.test(key) ? "[REDACTED]" : item) ?? "";
}
