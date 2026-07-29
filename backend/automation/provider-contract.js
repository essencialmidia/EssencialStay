export const unsupported = (reason = "not_supported_by_provider") => ({
  supported: false,
  reason,
});

export const PROVIDER_OPERATIONS = Object.freeze([
  "health",
  "listLocations",
  "listSpaces",
  "listDevices",
  "getDevice",
  "getStatus",
  "getCapabilities",
]);

export function assertProviderContract(provider) {
  for (const operation of PROVIDER_OPERATIONS) {
    if (typeof provider?.[operation] !== "function") {
      throw new TypeError(`Provider sem a operação obrigatória: ${operation}`);
    }
  }
  return provider;
}
