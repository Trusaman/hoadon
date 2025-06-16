import { NextRequest, NextResponse } from "next/server";
import https from "https";
import axios from "axios";

// Create a custom agent to bypass SSL certificate verification
const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
});

/**
 * API route to query invoices from Vietnamese Tax Authority
 * Routes to different endpoints based on invoice status:
 * - Status 5 and 6: query/invoices/purchase endpoint
 * - Status 8: sco-query/invoices/purchase endpoint
 * - Other statuses: query/invoices/purchase endpoint
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { token, queryParams, status } = body;

        // Validate required fields
        if (!token) {
            return NextResponse.json(
                {
                    error: "Missing authentication token",
                    required: ["token"],
                    success: false,
                },
                { status: 400 }
            );
        }

        // Default query parameters for invoice search
        const defaultParams = {
            sort: "tdlap:desc,khmshdon:asc,shdon:desc",
            size: "15",
            search: "tdlap=ge=06/01/2025T00:00:00;tdlap=le=06/01/2025T23:59:59;ttxly==5",
        };

        // Merge with provided query parameters
        const finalParams = { ...defaultParams, ...queryParams };

        // If a specific status is provided, ensure it's included in the search query
        if (status && finalParams.search) {
            // Check if the search query already contains a status filter (ttxly)
            const searchParts = finalParams.search.split(";");
            const hasStatusFilter = searchParts.some((part: string) =>
                part.includes("ttxly==")
            );

            if (!hasStatusFilter) {
                // Add the status filter to the search query
                finalParams.search = `${finalParams.search};ttxly==${status}`;
            } else {
                // Replace existing status filter with the provided status
                finalParams.search = searchParts
                    .map((part: string) =>
                        part.includes("ttxly==") ? `ttxly==${status}` : part
                    )
                    .join(";");
            }
        }

        // Determine the correct endpoint based on status
        let baseEndpoint: string;
        if (status === "8") {
            // For status 8 (Cục Thuế đã nhận hóa đơn có mã khởi tạo từ máy tính tiền)
            baseEndpoint =
                "https://hoadondientu.gdt.gov.vn:30000/sco-query/invoices/purchase";
        } else if (status === "5" || status === "6") {
            // For status 5 and 6 (Đã cấp mã hóa đơn), use the query/invoices/purchase endpoint
            baseEndpoint =
                "https://hoadondientu.gdt.gov.vn:30000/query/invoices/purchase";
        } else {
            // For other statuses or undefined status, use the query/invoices/purchase endpoint
            baseEndpoint =
                "https://hoadondientu.gdt.gov.vn:30000/query/invoices/purchase";
        }

        // Build query string
        const queryString = new URLSearchParams(finalParams).toString();
        const invoiceUrl = `${baseEndpoint}?${queryString}`;

        console.log("Querying invoices from Vietnamese Tax Authority:", {
            url: invoiceUrl,
            baseEndpoint,
            status,
            hasToken: !!token,
            tokenLength: token.length,
            queryParams: finalParams,
        });

        // Send invoice query request using axios
        const response = await axios.get(invoiceUrl, {
            httpsAgent,
            headers: {
                Authorization: `Bearer ${token}`,
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                Accept: "application/json",
                "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8",
                "Cache-Control": "no-cache",
                Pragma: "no-cache",
            },
        });

        console.log("Invoice query successful:", {
            status: response.status,
            contentType: response.headers["content-type"],
            hasData: !!response.data,
            dataType: typeof response.data,
        });

        // Return successful invoice query response
        return NextResponse.json({
            success: true,
            data: response.data,
            status: response.status,
            contentType: response.headers["content-type"],
            timestamp: new Date().toISOString(),
            queryParams: finalParams,
            url: invoiceUrl,
        });
    } catch (error) {
        console.error("Invoice query error:", error);

        // Handle axios specific errors
        if (axios.isAxiosError(error)) {
            return NextResponse.json(
                {
                    error: "Invoice query failed",
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
                type: "invoice_query_error",
                timestamp: new Date().toISOString(),
                success: false,
            },
            { status: statusCode }
        );
    }
}
