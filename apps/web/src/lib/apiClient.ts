// apps/web/src/lib/ApiClient.ts

/**
 * Configuration for API Client requests.
 */
export interface RequestConfig {
  /** Request body (for POST, PUT, PATCH) */
  body?: unknown;
  /** Request headers */
  headers?: Record<string, string>;
  /** URL path parameters (e.g., { id: 1 } for /api/items/:id) */
  params?: Record<string, string | number>;
  /** URL query parameters (e.g., { page: 1, limit: 10 }) */
  query?: Record<string, string | number | boolean>;
}

/**
 * A flexible and robust HTTP client for frontend applications.
 * Supports dynamic path parameters, query strings, and type-safe responses.
 */
export class ApiClient {
  private baseURL: string;

  /**
   * Initializes the client with a base URL.
   * @param {string} baseURL - The root URL for API requests.
   */
  constructor(baseURL: string = "") {
    this.baseURL = baseURL;
  }

  /**
   * Constructs the final URL with path and query parameters.
   * @param {string} endpoint - The API endpoint (e.g., "/api/houses/:id")
   * @param {RequestConfig} [config] - Request configuration containing params and query.
   * @returns {string} The fully constructed URL.
   */
  private buildUrl(endpoint: string, config?: RequestConfig): string {
    let url = `${this.baseURL}${endpoint}`;

    // Replace path parameters (e.g., :id)
    if (config?.params) {
      for (const [key, value] of Object.entries(config.params)) {
        url = url.replace(`:${key}`, encodeURIComponent(String(value)));
      }
    }

    // Append query parameters
    if (config?.query) {
      const queryString = new URLSearchParams(
        Object.entries(config.query).map(([k, v]) => [k, String(v)]),
      ).toString();
      url += `?${queryString}`;
    }

    return url;
  }

  /**
   * Core request method.
   * @param {string} method - HTTP method (GET, POST, PUT, DELETE, etc.)
   * @param {string} endpoint - API endpoint.
   * @param {RequestConfig} [config] - Request configuration.
   * @returns {Promise<T>} The parsed JSON response.
   * @throws {Error} If the network request fails or response is not ok.
   */
  private async request<T>(
    method: string,
    endpoint: string,
    config?: RequestConfig,
  ): Promise<T> {
    const url = this.buildUrl(endpoint, config);

    const fetchOptions: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
        ...config?.headers,
      },
    };

    if (config?.body && method !== "GET") {
      fetchOptions.body = JSON.stringify(config.body);
    }

    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: "Network response was not ok" }));
      throw new Error(errorData.message || `HTTP Error ${response.status}`);
    }

    return response.json() as Promise<T>;
  }

  /** Performs a GET request. */
  public get<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>("GET", endpoint, config);
  }

  /** Performs a POST request. */
  public post<T>(
    endpoint: string,
    body: unknown,
    config?: RequestConfig,
  ): Promise<T> {
    return this.request<T>("POST", endpoint, { ...config, body });
  }

  /** Performs a PUT request. */
  public put<T>(
    endpoint: string,
    body: unknown,
    config?: RequestConfig,
  ): Promise<T> {
    return this.request<T>("PUT", endpoint, { ...config, body });
  }

  /** Performs a PATCH request. */
  public patch<T>(
    endpoint: string,
    body: unknown,
    config?: RequestConfig,
  ): Promise<T> {
    return this.request<T>("PATCH", endpoint, { ...config, body });
  }

  /** Performs a DELETE request. */
  public delete<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>("DELETE", endpoint, config);
  }
}

// Export a singleton instance for global usage
export const apiClient = new ApiClient();
