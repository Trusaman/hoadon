/**
 * Captcha API utilities for fetching captcha images from Vietnamese tax authority
 */

export interface CaptchaResponse {
    success: boolean;
    data?: {
        image: string; // base64 data URL
        contentType: string;
        size: number;
        timestamp: string;
        key?: string; // Key from Vietnamese tax authority response
        rawSvg?: string; // Raw SVG content for debugging
    };
    error?: string;
    type?: string;
    timestamp?: string;
}

export interface CaptchaSolverResult {
    success: boolean;
    solvedText?: string;
    processingTime?: number;
    error?: string;
    timestamp: string;
}

export interface CaptchaTokenResponse {
    success: boolean;
    key: string | null;
    content: string | null;
    timestamp: string;
    data?: any;
    error?: string;
    type?: string;
}

export interface AuthenticationRequest {
    ckey: string;
    cvalue: string;
    username: string;
    password: string;
}

export interface AuthenticationResponse {
    success: boolean;
    data?: any;
    token?: string;
    error?: string;
    status?: number;
    statusText?: string;
    details?: string;
    timestamp?: string;
    authPayload?: {
        ckey: string;
        cvalue: string;
        username: string;
    };
}

export interface InvoiceQueryRequest {
    token: string;
    status?: string; // Invoice status to determine which endpoint to use
    queryParams?: {
        sort?: string;
        size?: string;
        search?: string;
    };
}

export interface ExcelExportRequest {
    token: string;
    status?: string; // Invoice status to determine which endpoint to use
    queryParams?: {
        search?: string;
    };
}

export interface ExcelExportResponse {
    success: boolean;
    error?: string;
    status?: number;
    statusText?: string;
    details?: string;
    timestamp?: string;
}

export interface InvoiceQueryResponse {
    success: boolean;
    data?: any;
    error?: string;
    status?: number;
    statusText?: string;
    details?: string;
    timestamp?: string;
    queryParams?: any;
    url?: string;
    contentType?: string;
    combinedResults?: {
        status5?: any;
        status6?: any;
        status8?: any;
        totalCount?: number;
        endpoints?: string[];
    };
}

export interface CaptchaError {
    message: string;
    type: "network" | "server" | "parsing" | "unknown";
    status?: number;
    timestamp: string;
}

/**
 * Fetch captcha image from Vietnamese tax authority via our API proxy
 * @returns Promise<CaptchaResponse>
 */
export async function fetchCaptcha(): Promise<CaptchaResponse> {
    try {
        const response = await fetch("/api/captcha", {
            method: "GET",
            headers: {
                Accept: "application/json",
                "Cache-Control": "no-cache",
            },
            // Disable caching to always get fresh captcha
            cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.error || `HTTP ${response.status}: ${response.statusText}`
            );
        }

        return data;
    } catch (error) {
        console.error("Error fetching captcha:", error);

        // Create standardized error response
        const captchaError: CaptchaError = {
            message:
                error instanceof Error
                    ? error.message
                    : "Unknown error occurred",
            type: getErrorType(error),
            timestamp: new Date().toISOString(),
        };

        if (error instanceof TypeError && error.message.includes("fetch")) {
            captchaError.type = "network";
            captchaError.message = "Network error: Unable to connect to server";
        }

        return {
            success: false,
            error: captchaError.message,
            type: captchaError.type,
            timestamp: captchaError.timestamp,
        };
    }
}

/**
 * Determine error type based on error object
 * @param error - Error object
 * @returns Error type string
 */
function getErrorType(error: unknown): CaptchaError["type"] {
    if (error instanceof TypeError) {
        return "network";
    }
    if (error instanceof Error) {
        const message = error.message.toLowerCase();
        if (message.includes("network") || message.includes("fetch")) {
            return "network";
        }
        if (message.includes("parse") || message.includes("json")) {
            return "parsing";
        }
        if (message.includes("server") || message.includes("http")) {
            return "server";
        }
    }
    return "unknown";
}

/**
 * Validate if the response contains a valid image
 * @param response - Captcha response
 * @returns boolean
 */
export function isValidCaptchaResponse(response: CaptchaResponse): boolean {
    return (
        response.success &&
        response.data !== undefined &&
        typeof response.data.image === "string" &&
        response.data.image.startsWith("data:") &&
        response.data.size > 0
    );
}

/**
 * Get human-readable error message for display
 * @param error - Error type
 * @returns User-friendly error message
 */
export function getErrorMessage(error: string): string {
    switch (error) {
        case "network":
            return "Network error: Please check your internet connection and try again.";
        case "server":
            return "Server error: The captcha service is temporarily unavailable.";
        case "parsing":
            return "Data error: Unable to process the captcha response.";
        default:
            return "An unexpected error occurred. Please try again.";
    }
}

/**
 * Format file size for display
 * @param bytes - Size in bytes
 * @returns Formatted size string
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Format timestamp for display
 * @param timestamp - ISO timestamp string
 * @returns Formatted time string
 */
export function formatTimestamp(timestamp: string): string {
    try {
        const date = new Date(timestamp);
        return date.toLocaleString("vi-VN", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });
    } catch {
        return timestamp;
    }
}

/**
 * Solve captcha using the integrated CaptchaSolver
 * @param svgContent - Raw SVG content to solve
 * @returns Promise<CaptchaSolverResult>
 */
export async function solveCaptcha(
    svgContent: string
): Promise<CaptchaSolverResult> {
    const startTime = performance.now();

    try {
        // Import the CaptchaSolver dynamically to avoid SSR issues
        const { CaptchaSolver } = await import(
            "@/app/captcha-solver/svg-captcha-solver"
        );

        // Solve the captcha
        const solvedText = CaptchaSolver.solve(svgContent);
        const processingTime = performance.now() - startTime;

        if (!solvedText || solvedText.length === 0) {
            return {
                success: false,
                error: "No characters could be recognized from the captcha",
                timestamp: new Date().toISOString(),
                processingTime,
            };
        }

        return {
            success: true,
            solvedText,
            processingTime,
            timestamp: new Date().toISOString(),
        };
    } catch (error) {
        const processingTime = performance.now() - startTime;
        console.error("Error solving captcha:", error);

        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Unknown error occurred while solving captcha",
            timestamp: new Date().toISOString(),
            processingTime,
        };
    }
}

/**
 * Fetch captcha token from Vietnamese tax authority via our API proxy
 * @returns Promise<CaptchaTokenResponse>
 */
export async function fetchCaptchaToken(): Promise<CaptchaTokenResponse> {
    try {
        const response = await fetch("/api/capcha-token", {
            method: "GET",
            headers: {
                Accept: "application/json",
                "Cache-Control": "no-cache",
            },
            // Disable caching to always get fresh token
            cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.error || `HTTP ${response.status}: ${response.statusText}`
            );
        }

        return data;
    } catch (error) {
        console.error("Error fetching captcha token:", error);

        // Create standardized error response
        const tokenError = {
            message:
                error instanceof Error
                    ? error.message
                    : "Unknown error occurred",
            type: getErrorType(error),
            timestamp: new Date().toISOString(),
        };

        if (error instanceof TypeError && error.message.includes("fetch")) {
            tokenError.type = "network";
            tokenError.message = "Network error: Unable to connect to server";
        }

        return {
            success: false,
            key: null,
            content: null,
            error: tokenError.message,
            type: tokenError.type,
            timestamp: tokenError.timestamp,
        };
    }
}

/**
 * Authenticate with Vietnamese Tax Authority
 * @param authRequest Authentication request with ckey, cvalue, username, password
 * @returns Promise<AuthenticationResponse>
 */
export async function authenticateWithTaxAuthority(
    authRequest: AuthenticationRequest
): Promise<AuthenticationResponse> {
    try {
        const response = await fetch("/api/authenticate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Cache-Control": "no-cache",
            },
            body: JSON.stringify(authRequest),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.error || `HTTP ${response.status}: ${response.statusText}`
            );
        }

        return data;
    } catch (error) {
        console.error("Error authenticating with tax authority:", error);

        // Create standardized error response
        const authError = {
            message:
                error instanceof Error
                    ? error.message
                    : "Unknown error occurred",
            type: getErrorType(error),
            timestamp: new Date().toISOString(),
        };

        if (error instanceof TypeError && error.message.includes("fetch")) {
            authError.type = "network";
            authError.message = "Network error: Unable to connect to server";
        }

        return {
            success: false,
            error: authError.message,
            timestamp: authError.timestamp,
        };
    }
}

/**
 * Query invoices from Vietnamese Tax Authority
 * @param queryRequest Invoice query request with token and optional query parameters
 * @returns Promise<InvoiceQueryResponse>
 */
export async function queryInvoices(
    queryRequest: InvoiceQueryRequest
): Promise<InvoiceQueryResponse> {
    try {
        const response = await fetch("/api/query-invoices", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Cache-Control": "no-cache",
            },
            body: JSON.stringify(queryRequest),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.error || `HTTP ${response.status}: ${response.statusText}`
            );
        }

        return data;
    } catch (error) {
        console.error("Error querying invoices:", error);

        // Create standardized error response
        const queryError = {
            message:
                error instanceof Error
                    ? error.message
                    : "Unknown error occurred",
            type: getErrorType(error),
            timestamp: new Date().toISOString(),
        };

        if (error instanceof TypeError && error.message.includes("fetch")) {
            queryError.type = "network";
            queryError.message = "Network error: Unable to connect to server";
        }

        return {
            success: false,
            data: null,
            error: queryError.message,
            timestamp: queryError.timestamp,
        };
    }
}

/**
 * Query invoices from all status endpoints (5, 6, 8) and combine results
 * @param queryRequest Invoice query request with token and optional query parameters
 * @returns Promise<InvoiceQueryResponse>
 */
export async function queryAllStatusInvoices(
    queryRequest: InvoiceQueryRequest
): Promise<InvoiceQueryResponse> {
    try {
        const statuses = ["5", "6", "8"];
        const promises = statuses.map((status) =>
            queryInvoices({
                ...queryRequest,
                status,
            })
        );

        const results = await Promise.allSettled(promises);
        const combinedData: any = {
            status5: null,
            status6: null,
            status8: null,
            totalCount: 0,
            endpoints: [],
        };

        let hasSuccessfulResult = false;
        const errors: string[] = [];

        results.forEach((result, index) => {
            const status = statuses[index];
            if (result.status === "fulfilled" && result.value.success) {
                hasSuccessfulResult = true;
                combinedData[`status${status}` as keyof typeof combinedData] =
                    result.value.data;
                combinedData.endpoints.push(
                    result.value.url || `status-${status}-endpoint`
                );

                // Count items if data is an array or has a count property
                if (Array.isArray(result.value.data)) {
                    combinedData.totalCount += result.value.data.length;
                } else if (
                    result.value.data?.content &&
                    Array.isArray(result.value.data.content)
                ) {
                    combinedData.totalCount += result.value.data.content.length;
                } else if (result.value.data?.totalElements) {
                    combinedData.totalCount += result.value.data.totalElements;
                }
            } else if (result.status === "fulfilled" && !result.value.success) {
                errors.push(`Status ${status}: ${result.value.error}`);
            } else if (result.status === "rejected") {
                errors.push(`Status ${status}: ${result.reason}`);
            }
        });

        if (!hasSuccessfulResult) {
            return {
                success: false,
                error: `All status queries failed: ${errors.join("; ")}`,
                timestamp: new Date().toISOString(),
            };
        }

        return {
            success: true,
            data: combinedData,
            combinedResults: combinedData,
            timestamp: new Date().toISOString(),
            status: 200,
        };
    } catch (error) {
        console.error("Error querying all status invoices:", error);

        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Unknown error occurred",
            timestamp: new Date().toISOString(),
        };
    }
}

/**
 * Export invoices to Excel from Vietnamese Tax Authority
 * @param exportRequest Excel export request with token and optional query parameters
 * @returns Promise<Blob> - Excel file as blob for download
 */
export async function exportInvoicesToExcel(
    exportRequest: ExcelExportRequest
): Promise<{
    success: boolean;
    blob?: Blob;
    error?: string;
    filename?: string;
}> {
    try {
        const response = await fetch("/api/export-excel", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Cache-Control": "no-cache",
            },
            body: JSON.stringify(exportRequest),
        });

        if (!response.ok) {
            // Try to get error details from response
            const errorData = await response.json().catch(() => null);
            throw new Error(
                errorData?.error ||
                    `HTTP ${response.status}: ${response.statusText}`
            );
        }

        // Get the filename from Content-Disposition header if available
        const contentDisposition = response.headers.get("content-disposition");
        let filename = "invoices.xlsx";
        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(
                /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
            );
            if (filenameMatch && filenameMatch[1]) {
                filename = filenameMatch[1].replace(/['"]/g, "");
            }
        }

        // Get the file as blob
        const blob = await response.blob();

        return {
            success: true,
            blob,
            filename,
        };
    } catch (error) {
        console.error("Error exporting invoices to Excel:", error);

        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Unknown error occurred",
        };
    }
}

/**
 * Export invoices from all status endpoints (5, 6, 8) to Excel files
 * @param exportRequest Excel export request with token and optional query parameters
 * @returns Promise with results for all status exports
 */
export async function exportAllStatusesToExcel(
    exportRequest: ExcelExportRequest
): Promise<{
    success: boolean;
    results: Array<{
        status: string;
        success: boolean;
        blob?: Blob;
        filename?: string;
        error?: string;
    }>;
    error?: string;
}> {
    try {
        const statuses = ["5", "6", "8"];
        const exportPromises = statuses.map(async (status) => {
            const statusExportRequest = {
                ...exportRequest,
                status,
            };

            const result = await exportInvoicesToExcel(statusExportRequest);

            return {
                status,
                success: result.success,
                blob: result.blob,
                filename: result.filename
                    ? result.filename.replace(".xlsx", `_status_${status}.xlsx`)
                    : `invoices_status_${status}.xlsx`,
                error: result.error,
            };
        });

        const results = await Promise.allSettled(exportPromises);
        const exportResults = results.map((result, index) => {
            if (result.status === "fulfilled") {
                return result.value;
            } else {
                return {
                    status: statuses[index],
                    success: false,
                    error:
                        result.reason instanceof Error
                            ? result.reason.message
                            : "Unknown error",
                };
            }
        });

        const successfulExports = exportResults.filter(
            (result) => result.success
        );

        return {
            success: successfulExports.length > 0,
            results: exportResults,
            error:
                successfulExports.length === 0
                    ? "All export requests failed"
                    : undefined,
        };
    } catch (error) {
        console.error("Error exporting all statuses to Excel:", error);

        return {
            success: false,
            results: [],
            error:
                error instanceof Error
                    ? error.message
                    : "Unknown error occurred",
        };
    }
}
