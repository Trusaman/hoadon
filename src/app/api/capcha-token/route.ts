import { NextRequest, NextResponse } from "next/server";

/**
 * API route to fetch captcha token from Vietnamese tax authority
 * This handles CORS issues by acting as a server-side proxy
 */
export async function GET(request: NextRequest) {
    const tokenUrl = "https://hoadondientu.gdt.gov.vn:30000/captcha";

    try {
        // Add timestamp to prevent caching and get fresh token
        const timestamp = Date.now();
        const urlWithTimestamp = `${tokenUrl}?t=${timestamp}`;

        // Fetch captcha token from Vietnamese tax authority
        const response = await fetch(urlWithTimestamp, {
            method: "GET",
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                Accept: "application/json",
                "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8",
                "Cache-Control": "no-cache",
                Pragma: "no-cache",
            },
            // Disable caching to always get fresh token
            cache: "no-store",
        });

        if (!response.ok) {
            console.error(
                `Captcha Token API error: ${response.status} ${response.statusText}`
            );
            return NextResponse.json(
                {
                    error: "Failed to fetch captcha token",
                    status: response.status,
                    statusText: response.statusText,
                },
                { status: response.status }
            );
        }

        // Get the content type from the response
        const contentType =
            response.headers.get("content-type") || "application/json";

        if (contentType.includes("application/json")) {
            // Handle JSON response (should contain key and content fields)
            const jsonData = await response.json();

            // Return the JSON response with key and content fields
            return NextResponse.json({
                success: true,
                key: jsonData.key || null,
                content: jsonData.content || null,
                timestamp: new Date().toISOString(),
                data: jsonData, // Include full response for debugging
            });
        } else {
            // Handle non-JSON response
            const textData = await response.text();

            return NextResponse.json({
                success: true,
                key: null,
                content: textData,
                timestamp: new Date().toISOString(),
                contentType,
            });
        }
    } catch (error) {
        console.error("Error fetching captcha token:", error);

        // Determine error type for better user feedback
        let errorMessage = "Unknown error occurred";
        let statusCode = 500;

        if (error instanceof TypeError && error.message.includes("fetch")) {
            errorMessage =
                "Network error: Unable to connect to captcha token service";
            statusCode = 503;
        } else if (error instanceof Error) {
            errorMessage = error.message;
        }

        return NextResponse.json(
            {
                error: errorMessage,
                type: "network_error",
                timestamp: new Date().toISOString(),
                success: false,
                key: null,
                content: null,
            },
            { status: statusCode }
        );
    }
}

/**
 * Handle OPTIONS request for CORS preflight
 */
export async function OPTIONS(request: NextRequest) {
    return new NextResponse(null, {
        status: 200,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        },
    });
}
