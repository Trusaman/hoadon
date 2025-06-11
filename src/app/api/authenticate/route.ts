import { NextRequest, NextResponse } from "next/server";

/**
 * API route to authenticate with Vietnamese Tax Authority
 * Sends POST request to security-taxpayer/authenticate endpoint
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { ckey, cvalue, password, username } = body;

        // Validate required fields
        if (!ckey || !cvalue || !password || !username) {
            return NextResponse.json(
                {
                    error: "Missing required fields",
                    required: ["ckey", "cvalue", "password", "username"],
                    received: { ckey: !!ckey, cvalue: !!cvalue, password: !!password, username: !!username },
                    success: false,
                },
                { status: 400 }
            );
        }

        const authUrl = "https://hoadondientu.gdt.gov.vn:30000/security-taxpayer/authenticate";

        // Prepare authentication payload
        const authPayload = {
            ckey,
            cvalue,
            password,
            username,
        };

        console.log("Authenticating with Vietnamese Tax Authority:", {
            url: authUrl,
            payload: {
                ckey,
                cvalue: cvalue.substring(0, 3) + "***", // Mask captcha value in logs
                username,
                password: "***", // Mask password in logs
            },
        });

        // Send authentication request
        const response = await fetch(authUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                Accept: "application/json",
                "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8",
                "Cache-Control": "no-cache",
                Pragma: "no-cache",
            },
            body: JSON.stringify(authPayload),
        });

        console.log("Authentication response status:", response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(
                `Authentication failed: ${response.status} ${response.statusText}`,
                errorText
            );

            return NextResponse.json(
                {
                    error: "Authentication failed",
                    status: response.status,
                    statusText: response.statusText,
                    details: errorText,
                    success: false,
                    timestamp: new Date().toISOString(),
                },
                { status: response.status }
            );
        }

        // Get the content type from the response
        const contentType = response.headers.get("content-type") || "";

        let responseData;
        if (contentType.includes("application/json")) {
            responseData = await response.json();
        } else {
            responseData = await response.text();
        }

        console.log("Authentication successful:", {
            status: response.status,
            contentType,
            hasToken: !!(responseData?.token || responseData?.access_token),
        });

        // Return successful authentication response
        return NextResponse.json({
            success: true,
            data: responseData,
            token: responseData?.token || responseData?.access_token || null,
            status: response.status,
            contentType,
            timestamp: new Date().toISOString(),
            authPayload: {
                ckey,
                cvalue,
                username,
                // Don't return password in response
            },
        });

    } catch (error) {
        console.error("Authentication error:", error);

        // Determine error type for better user feedback
        let errorMessage = "Unknown error occurred";
        let statusCode = 500;

        if (error instanceof TypeError && error.message.includes("fetch")) {
            errorMessage = "Network error: Unable to connect to authentication service";
            statusCode = 503;
        } else if (error instanceof SyntaxError) {
            errorMessage = "Invalid JSON in request body";
            statusCode = 400;
        } else if (error instanceof Error) {
            errorMessage = error.message;
        }

        return NextResponse.json(
            {
                error: errorMessage,
                type: "authentication_error",
                timestamp: new Date().toISOString(),
                success: false,
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
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        },
    });
}
