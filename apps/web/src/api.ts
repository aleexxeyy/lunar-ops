export class ApiError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function request<T>(path: string, body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      ...(body === undefined
        ? {}
        : {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }),
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    throw new Error(
      "Немає зв’язку з центром керування. Спробуйте підключитися знову.",
    );
  }
  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as {
      message?: unknown;
    } | null;
    throw new ApiError(
      typeof error?.message === "string"
        ? error.message
        : "Сервер недоступний. Спробуйте підключитися знову.",
      response.status,
    );
  }
  try {
    return (await response.json()) as T;
  } catch {
    throw new Error(
      "Не вдалося прочитати відповідь центру керування. Спробуйте підключитися знову.",
    );
  }
}
