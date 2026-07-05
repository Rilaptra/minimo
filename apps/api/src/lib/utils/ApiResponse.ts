// apps/api/src/lib/utils/ApiResponse.ts

/**
 * Standardized API Response structure.
 */
export interface IApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message: string;
  success: boolean;
}

/**
 * A utility object for creating standardized HTTP responses.
 * Mimics NextResponse behavior for consistent API output.
 */
export const ApiResponse = {
  /**
   * Creates a successful JSON response (HTTP 200).
   * @param {T} data - The payload to return.
   * @param {string} message - Success message.
   * @returns {Response} Standardized Response object.
   */
  success<T>(data: T, message: string = "Success"): Response {
    const body: IApiResponse<T> = { success: true, message, data };
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  },

  /**
   * Creates an error JSON response.
   * @param {string} message - Error message.
   * @param {number} status - HTTP status code (e.g., 400, 404, 500).
   * @returns {Response} Standardized Response object.
   */
  error(
    message: string = "Internal Server Error",
    status: number = 500,
  ): Response {
    const body: IApiResponse = { success: false, message, error: message };
    return new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  },

  /**
   * Creates a 404 Not Found response.
   * @param {string} resource - The name of the missing resource.
   * @returns {Response} Standardized Response object.
   */
  notFound(resource: string = "Resource"): Response {
    const message = `${resource} not found`;
    const body: IApiResponse = { success: false, message, error: message };
    return new Response(JSON.stringify(body), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  },
};
