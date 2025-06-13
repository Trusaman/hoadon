import { NextRequest, NextResponse } from "next/server";

/**
 * API route to export invoices to Excel from Vietnamese Tax Authority
 * Routes to different endpoints based on invoice status:
 * - Status 8: sco-query/invoices/export-excel-sold endpoint
 * - Status 5 and 6: query/invoices/export-excel-sold endpoint
 * - Other statuses: query/invoices/export-excel-sold endpoint
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

        console.log("Excel export request:", {
            hasToken: !!token,
            tokenLength: token?.length,
            queryParams,
            status,
        });

        // Determine the correct endpoint based on status
        let baseEndpoint: string;
        if (status === "8") {
            // For status 8 (Cục Thuế đã nhận hóa đơn có mã khởi tạo từ máy tính tiền)
            baseEndpoint =
                "https://hoadondientu.gdt.gov.vn:30000/sco-query/invoices/export-excel-sold";
        } else if (status === "5" || status === "6") {
            // For status 5 and 6 (Đã cấp mã hóa đơn), use the query/invoices/export-excel-sold endpoint
            baseEndpoint =
                "https://hoadondientu.gdt.gov.vn:30000/query/invoices/export-excel-sold";
        } else {
            // For other statuses or undefined status, use the query/invoices/export-excel-sold endpoint
            baseEndpoint =
                "https://hoadondientu.gdt.gov.vn:30000/query/invoices/export-excel-sold";
        }
        const urlParams = new URLSearchParams();

        // Add required parameters
        urlParams.append("sort", "tdlap:desc,khmshdon:asc,shdon:desc");
        urlParams.append("type", "purchase");

        // Add search parameter if provided
        if (queryParams?.search) {
            urlParams.append("search", queryParams.search);
        } else {
            // Default empty search parameter
            urlParams.append("search", "");
        }

        const exportUrl = `${baseEndpoint}?${urlParams.toString()}`;

        console.log(
            "Exporting invoices to Excel from Vietnamese Tax Authority:",
            {
                url: exportUrl,
                baseEndpoint,
                status,
                hasToken: !!token,
                tokenLength: token.length,
                queryParams: urlParams.toString(),
            }
        );

        // Send export request to Vietnamese Tax Authority
        const response = await fetch(exportUrl, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                Accept: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,*/*",
                "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8",
                "Cache-Control": "no-cache",
                Pragma: "no-cache",
            },
        });

        console.log("Excel export response status:", response.status);
        console.log(
            "Excel export response headers:",
            Object.fromEntries(response.headers.entries())
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error(
                `Excel export failed: ${response.status} ${response.statusText}`,
                errorText
            );

            return NextResponse.json(
                {
                    error: "Excel export failed",
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
        const contentDisposition =
            response.headers.get("content-disposition") || "";

        console.log("Excel export successful:", {
            contentType,
            contentDisposition,
            status: response.status,
        });

        // Get the file data as array buffer
        const fileBuffer = await response.arrayBuffer();

        // Create response with the Excel file
        const fileResponse = new NextResponse(fileBuffer, {
            status: 200,
            headers: {
                "Content-Type":
                    contentType ||
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "Content-Disposition":
                    contentDisposition ||
                    'attachment; filename="invoices.xlsx"',
                "Content-Length": fileBuffer.byteLength.toString(),
            },
        });

        return fileResponse;
    } catch (error) {
        console.error("Excel export error:", error);

        return NextResponse.json(
            {
                error: "Internal server error during Excel export",
                details:
                    error instanceof Error ? error.message : "Unknown error",
                success: false,
                timestamp: new Date().toISOString(),
            },
            { status: 500 }
        );
    }
}
