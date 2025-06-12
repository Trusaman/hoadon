import { NextRequest, NextResponse } from "next/server";

/**
 * API route to query invoices from Vietnamese Tax Authority
 * Routes to different endpoints based on invoice status:
 * - Status 6 or 8: sco-query/invoices endpoint
 * - Status 5: query/invoices/purchase endpoint
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

        // Determine the correct endpoint based on status
        let baseEndpoint: string;
        if (status === "6" || status === "8") {
            // For status 6 (Cục Thuế đã nhận không mã) or 8 (Cục Thuế đã nhận hóa đơn có mã khởi tạo từ máy tính tiền)
            baseEndpoint =
                "https://hoadondientu.gdt.gov.vn:30000/sco-query/invoices/purchase";
        } else {
            // For status 5 and other statuses, use the original endpoint
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

        // Send invoice query request (using GET method as required by Vietnamese Tax Authority)
        const response = await fetch(invoiceUrl, {
            method: "GET",
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

        console.log("Invoice query response status:", response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(
                `Invoice query failed: ${response.status} ${response.statusText}`,
                errorText
            );

            return NextResponse.json(
                {
                    error: "Invoice query failed",
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

        console.log("Invoice query successful:", {
            status: response.status,
            contentType,
            hasData: !!responseData,
            dataType: typeof responseData,
        });

        // Return successful invoice query response
        return NextResponse.json({
            success: true,
            data: responseData,
            status: response.status,
            contentType,
            timestamp: new Date().toISOString(),
            queryParams: finalParams,
            url: invoiceUrl,
        });
    } catch (error) {
        console.error("Invoice query error:", error);

        // Determine error type for better user feedback
        let errorMessage = "Unknown error occurred";
        let statusCode = 500;

        if (error instanceof TypeError && error.message.includes("fetch")) {
            errorMessage =
                "Network error: Unable to connect to invoice service";
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
                type: "invoice_query_error",
                timestamp: new Date().toISOString(),
                success: false,
            },
            { status: statusCode }
        );
    }
}
