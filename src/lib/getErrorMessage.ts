import { AxiosError } from "axios";

interface ApiErrorBody {
  message?: string;
  errors?: Array<{ field: string; message: string }>;
}

/** Pull a human-readable message out of an Axios/API error. */
export function getErrorMessage(error: unknown, fallback = "Something went wrong"): string {
  if (error instanceof AxiosError) {
    const body = error.response?.data as ApiErrorBody | undefined;
    if (body?.errors?.length) return body.errors[0].message;
    if (body?.message) return body.message;
    if (error.message) return error.message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}
