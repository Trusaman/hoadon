import { NextRequest, NextResponse } from "next/server";

/**
 * API route to proxy captcha requests from Vietnamese tax authority
 * This handles CORS issues by acting as a server-side proxy
 */
export async function GET(request: NextRequest) {
    const captchaUrl = "https://hoadondientu.gdt.gov.vn:30000/captcha";

    try {
        // Add timestamp to prevent caching and get fresh captcha
        const timestamp = Date.now();
        const urlWithTimestamp = `${captchaUrl}?t=${timestamp}`;

        // Fetch captcha from Vietnamese tax authority
        const response = await fetch(urlWithTimestamp, {
            method: "GET",
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                Accept: "image/*,*/*",
                "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8",
                "Cache-Control": "no-cache",
                Pragma: "no-cache",
            },
            // Disable caching to always get fresh captcha
            cache: "no-store",
        });

        if (!response.ok) {
            console.error(
                `Captcha API error: ${response.status} ${response.statusText}`
            );
            return NextResponse.json(
                {
                    error: "Failed to fetch captcha",
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
            // Handle JSON response (contains SVG in content field)
            const jsonData = await response.json();

            if (jsonData.content && typeof jsonData.content === "string") {
                // The content field contains the SVG
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
                throw new Error(
                    "Invalid JSON response: missing or invalid content field"
                );
            }
        } else {
            // Handle binary image response (fallback)
            const imageBuffer = await response.arrayBuffer();
            const base64Image = Buffer.from(imageBuffer).toString("base64");

            return NextResponse.json({
                success: true,
                data: {
                    image: `data:${contentType};base64,${base64Image}`,
                    contentType,
                    size: imageBuffer.byteLength,
                    timestamp: new Date().toISOString(),
                },
            });
        }
    } catch (error) {
        console.error("Error fetching captcha:", error);

        // Determine error type for better user feedback
        let errorMessage = "Unknown error occurred";
        let statusCode = 500;

        if (error instanceof TypeError && error.message.includes("fetch")) {
            errorMessage =
                "Network error: Unable to connect to captcha service";
            statusCode = 503;
        } else if (error instanceof Error) {
            errorMessage = error.message;
        }

        return NextResponse.json(
            {
                error: errorMessage,
                type: "network_error",
                timestamp: new Date().toISOString(),
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
