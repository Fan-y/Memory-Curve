export type ApiResult<T> = {
  data: T | null;
  error: string | null;
};

export function apiSuccess<T>(data: T): ApiResult<T> {
  return {
    data,
    error: null,
  };
}

export function apiFailure<T = never>(error: string): ApiResult<T> {
  return {
    data: null,
    error,
  };
}

export function normalizeApiError(error: unknown): string {
  if (typeof error === "string") {
    return error;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }

  return "请求失败，请稍后重试。";
}
