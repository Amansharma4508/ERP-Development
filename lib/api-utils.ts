export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode: number;
}

export function successResponse<T>(
  data: T,
  statusCode: number = 200
): ApiResponse<T> {
  return {
    success: true,
    data,
    statusCode,
  };
}

export function errorResponse(
  error: string,
  statusCode: number = 400
): ApiResponse {
  return {
    success: false,
    error,
    statusCode,
  };
}

export function toJson<T>(response: ApiResponse<T>) {
  return Response.json(response, { status: response.statusCode });
}

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
