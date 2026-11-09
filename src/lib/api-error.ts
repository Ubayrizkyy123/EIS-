import { Prisma } from "@/generated/prisma/client";
import { ZodError } from "zod";

export type ApiErrorDetails = unknown;

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: ApiErrorDetails;

  constructor(
    status: number,
    code: string,
    message: string,
    details?: ApiErrorDetails,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function prismaErrorResponse(error: Prisma.PrismaClientKnownRequestError) {
  if (error.code === "P2002") {
    return new ApiError(
      409,
      "CONFLICT",
      "Data dengan nilai unik tersebut sudah ada.",
      { fields: error.meta?.target },
    );
  }

  if (error.code === "P2003") {
    return new ApiError(
      409,
      "RELATION_CONFLICT",
      "Data masih digunakan oleh record lain.",
      { fields: error.meta?.field_name },
    );
  }

  if (error.code === "P2025") {
    return new ApiError(404, "NOT_FOUND", "Data tidak ditemukan.");
  }

  return null;
}

function isPrerenderSignal(error: unknown) {
  return (
    error instanceof Error &&
    (error.message.includes("During prerendering") ||
      (error as Error & { digest?: string }).digest ===
        "HANGING_PROMISE_REJECTION")
  );
}

export function toErrorResponse(error: unknown) {
  if (isPrerenderSignal(error)) {
    throw error;
  }

  let apiError: ApiError | null = null;

  if (error instanceof ApiError) {
    apiError = error;
  } else if (error instanceof ZodError) {
    apiError = new ApiError(422, "VALIDATION_ERROR", "Data tidak valid.", {
      issues: error.issues,
    });
  } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    apiError = prismaErrorResponse(error);
  }

  if (apiError) {
    return Response.json(
      {
        error: {
          code: apiError.code,
          message: apiError.message,
          details: apiError.details ?? null,
        },
      },
      { status: apiError.status },
    );
  }

  console.error("Unhandled API error", error);

  return Response.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: "Terjadi kesalahan pada server.",
        details: null,
      },
    },
    { status: 500 },
  );
}
