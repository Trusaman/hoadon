import { NextRequest, NextResponse } from "next/server";
import https from "https";
import axios from "axios";

// Create a custom agent to bypass SSL certificate verification
const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
});

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
                    received: {
                        ckey: !!ckey,
                        cvalue: !!cvalue,
                        password: !!password,
                        username: !!username,
                    },
                    success: false,
                },
                { status: 400 }
            );
        }

        const authUrl =
            "https://hoadondientu.gdt.gov.vn:30000/security-taxpayer/authenticate";

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

        // Send authentication request using axios
        const response = await axios.post(authUrl, authPayload, {
            httpsAgent,
            headers: {
                "Content-Type": "application/json",
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                Accept: "application/json",
                "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8",
                "Cache-Control": "no-cache",
                Pragma: "no-cache",
            },
        });

        console.log("Authentication successful:", {
            status: response.status,
            contentType: response.headers["content-type"],
            hasToken: !!(response.data?.token || response.data?.access_token),
        });

        // Return successful authentication response
        return NextResponse.json({
            success: true,
            data: response.data,
            token: response.data?.token || response.data?.access_token || null,
            status: response.status,
            contentType: response.headers["content-type"],
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

        // Handle axios specific errors
        if (axios.isAxiosError(error)) {
            return NextResponse.json(
                {
                    error: "Authentication failed",
                    status: error.response?.status || 500,
                    statusText: error.response?.statusText,
                    details: error.response?.data || error.message,
                    success: false,
                    timestamp: new Date().toISOString(),
                },
                { status: error.response?.status || 502 }
            );
        }

        // Handle other types of errors
        let errorMessage = "Unknown error occurred";
        let statusCode = 500;

        if (error instanceof SyntaxError) {
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
