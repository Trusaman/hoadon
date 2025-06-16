import { NextRequest, NextResponse } from "next/server";
import https from "https";
import axios from "axios";

// Create a custom agent to bypass SSL certificate verification
const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
});

/**
 * API route to fetch captcha token from Vietnamese tax authority
 * This handles CORS issues by acting as a server-side proxy
 */
export async function GET(request: NextRequest) {
    const tokenUrl = "https://hoadondientu.gdt.gov.vn:30000/captcha";

    try {
        // Add timestamp to prevent caching and get fresh token
        const timestamp = Date.now();

        // Fetch captcha token from Vietnamese tax authority using axios
        const response = await axios.get(tokenUrl, {
            httpsAgent,
            params: {
                t: timestamp,
            },
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                Accept: "application/json",
                "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8",
                "Cache-Control": "no-cache",
                Pragma: "no-cache",
            },
        });

        // Get the content type from the response
        const contentType =
            response.headers["content-type"] || "application/json";

        if (contentType.includes("application/json")) {
            // Handle JSON response (should contain key and content fields)
            const jsonData = response.data;

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
            return NextResponse.json({
                success: true,
                key: null,
                content: response.data,
                timestamp: new Date().toISOString(),
                contentType,
            });
        }
    } catch (error) {
        console.error("Error fetching captcha token:", error);

        // Handle axios specific errors
        if (axios.isAxiosError(error)) {
            return NextResponse.json(
                {
                    error: "Failed to fetch captcha token",
                    status: error.response?.status || 500,
                    statusText: error.response?.statusText,
                    details: error.response?.data || error.message,
                    success: false,
                    timestamp: new Date().toISOString(),
                    key: null,
                    content: null,
                },
                { status: error.response?.status || 502 }
            );
        }

        // Handle other types of errors
        let errorMessage = "Unknown error occurred";
        let statusCode = 500;

        if (error instanceof Error) {
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
