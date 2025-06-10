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
