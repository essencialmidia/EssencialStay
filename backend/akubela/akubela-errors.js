export class AkubelaError extends Error {
  constructor(code, message, details = {}, cause) {
    super(message, { cause });
    this.name = "AkubelaError";
    this.code = code;
    this.details = details;
  }
}

export const akubelaErrorCode = (error) => error instanceof AkubelaError ? error.code : "provider_unavailable";
