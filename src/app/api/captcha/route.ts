import { NextRequest, NextResponse } from "next/server";
import https from "https";
import axios from "axios"; // Using axios for reliable request control

// Create a custom agent to bypass SSL certificate verification.
// This is the key to fixing the UNABLE_TO_VERIFY_LEAF_SIGNATURE error.
const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
});

/**
 * API route to proxy captcha requests from Vietnamese tax authority.
 * This handles CORS issues and SSL certificate errors by using a server-side proxy.
 */
export async function GET(request: NextRequest) {
    const captchaUrl = "https://hoadondientu.gdt.gov.vn:30000/captcha";

    try {
        // Add timestamp to prevent caching and get a fresh captcha
        const timestamp = Date.now();

        // Use axios to fetch the captcha.
        // It reliably uses the custom httpsAgent to bypass SSL verification.
        const response = await axios.get(captchaUrl, {
            params: {
                t: timestamp, // axios adds this as a query string: ?t=...
            },
            httpsAgent: httpsAgent, // This is the crucial setting for axios
            // The API returns JSON, so we set the responseType accordingly.
            // If it could return a direct image, we'd use 'arraybuffer'.
            responseType: "json",
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                // Explicitly accept JSON, as that's what the API provides
                Accept: "application/json, text/plain, */*",
                "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8",
                "Cache-Control": "no-cache",
                Pragma: "no-cache",
            },
        });

        // With axios, the response data is directly available in `response.data`
        const jsonData = response.data;

        // The API returns JSON with an SVG string in the 'content' field.
        if (
            jsonData &&
            jsonData.content &&
            typeof jsonData.content === "string"
        ) {
            const svgContent = jsonData.content;
            const svgBase64 = Buffer.from(svgContent).toString("base64");

            return NextResponse.json({
                success: true,
                data: {
                    image: `data:image/svg+xml;base64,${svgBase64}`,
                    contentType: "image/svg+xml",
                    size: svgContent.length,
                    timestamp: new Date().toISOString(),
                    key: jsonData.key, // Include the key from the response
                    rawSvg: svgContent, // Include raw SVG for debugging
                },
            });
        } else {
            // This case handles if the JSON response is not in the expected format.
            throw new Error(
                "Invalid JSON response from captcha service: missing or invalid 'content' field"
            );
        }
    } catch (error) {
        console.error("Error fetching captcha:", error);

        // Axios provides detailed error objects, which we can use for better logging
        if (axios.isAxiosError(error)) {
            // This will catch network errors, SSL errors, and non-2xx status codes
            return NextResponse.json(
                {
                    error: "Failed to fetch captcha from external service.",
                    details: error.message,
                    // Provide status from the remote server if available
                    status: error.response?.status || 500,
                },
                { status: error.response?.status || 502 } // 502 Bad Gateway is appropriate
            );
        }

        // Fallback for any other unexpected errors
        return NextResponse.json(
            {
                error: "An unknown error occurred while fetching the captcha.",
                details: error instanceof Error ? error.message : "Unknown",
            },
            { status: 500 }
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
