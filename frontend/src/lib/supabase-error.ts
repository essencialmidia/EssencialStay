export type SupabaseRequestError = Error & {
  code?: string;
  details?: string;
  hint?: string;
  status?: number;
};

export function withSupabaseStatus(error: { message: string; code?: string; details?: string; hint?: string }, status?: number) {
  const requestError = new Error(error.message) as SupabaseRequestError;
  requestError.name = "SupabaseRequestError";
  requestError.code = error.code;
  requestError.details = error.details;
  requestError.hint = error.hint;
  requestError.status = status;
  return requestError;
}

export function getTechnicalError(error: unknown) {
  const candidate = error as (Partial<SupabaseRequestError> & { statusCode?: number | string }) | null;
  const status = candidate?.status ?? (candidate?.statusCode ? Number(candidate.statusCode) : undefined);
  return {
    message: candidate?.message ?? String(error),
    code: candidate?.code,
    details: candidate?.details,
    hint: candidate?.hint,
    status,
    error,
  };
}
