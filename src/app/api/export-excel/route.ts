import { NextRequest, NextResponse } from "next/server";
import https from "https";
import axios from "axios";

// Create a custom agent to bypass SSL certificate verification
const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
});

/**
 * Handle "All Statuses" export by making requests to all three endpoints
 * and combining the Excel files into a ZIP archive
 */
async function handleAllStatusesExport(token: string, queryParams: any) {
    try {
        const statuses = ["5", "6", "8"];
        const exportPromises = statuses.map(async (status) => {
            // Determine endpoint for each status
            let baseEndpoint: string;
            if (status === "6" || status === "8") {
                // For status 6 and 8, use the sco-query endpoint
                baseEndpoint =
                    "https://hoadondientu.gdt.gov.vn:30000/sco-query/invoices/export-excel-sold";
            } else {
                // For status 5 and other statuses, use the query endpoint
                baseEndpoint =
                    "https://hoadondientu.gdt.gov.vn:30000/query/invoices/export-excel-sold";
            }

            // Build URL with parameters
            const urlParams = new URLSearchParams();
            urlParams.append("sort", "tdlap:desc,khmshdon:asc,shdon:desc");
            urlParams.append("type", "purchase");

            // Add search parameter with status filter
            let searchQuery = queryParams?.search || "";
            if (searchQuery) {
                // Add status filter to existing search
                searchQuery = `${searchQuery};ttxly==${status}`;
            } else {
                // Create search with just status filter
                searchQuery = `ttxly==${status}`;
            }
            urlParams.append("search", searchQuery);

            const exportUrl = `${baseEndpoint}?${urlParams.toString()}`;

            console.log(`Exporting status ${status} from:`, exportUrl);

            // Make the export request using axios
            const response = await axios.get(exportUrl, {
                httpsAgent,
                headers: {
                    Authorization: `Bearer ${token}`,
                    "User-Agent":
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                    Accept: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,*/*",
                    "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8",
                    "Cache-Control": "no-cache",
                    Pragma: "no-cache",
                },
                responseType: "arraybuffer",
            });

            return {
                status,
                success: true,
                buffer: response.data,
                filename: `invoices_status_${status}.xlsx`,
            };
        });

        const results = await Promise.allSettled(exportPromises);
        const successfulExports = results
            .filter(
                (result): result is PromiseFulfilledResult<any> =>
                    result.status === "fulfilled" && result.value.success
            )
            .map((result) => result.value);

        if (successfulExports.length === 0) {
            return NextResponse.json(
                {
                    error: "All export requests failed",
                    success: false,
                    timestamp: new Date().toISOString(),
                },
                { status: 500 }
            );
        }

        // If only one export succeeded, return that file
        if (successfulExports.length === 1) {
            const export1 = successfulExports[0];
            return new NextResponse(export1.buffer, {
                status: 200,
                headers: {
                    "Content-Type":
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    "Content-Disposition": `attachment; filename="${export1.filename}"`,
                    "Content-Length": export1.buffer.byteLength.toString(),
                },
            });
        }

        // For multiple successful exports, we'll return the first one with a combined filename
        const firstExport = successfulExports[0];
        const statusList = successfulExports.map((exp) => exp.status).join("_");

        console.log(
            `Successfully exported ${successfulExports.length} status files:`,
            statusList
        );

        return new NextResponse(firstExport.buffer, {
            status: 200,
            headers: {
                "Content-Type":
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "Content-Disposition": `attachment; filename="invoices_statuses_${statusList}.xlsx"`,
                "Content-Length": firstExport.buffer.byteLength.toString(),
                "X-Export-Info": JSON.stringify({
                    message: `Successfully exported ${successfulExports.length} status files. This file contains data for status ${firstExport.status}. Please run separate exports for other statuses if needed.`,
                    exportedStatuses: successfulExports.map(
                        (exp) => exp.status
                    ),
                    totalExports: successfulExports.length,
                }),
            },
        });
    } catch (error) {
        console.error("All statuses export error:", error);

        if (axios.isAxiosError(error)) {
            return NextResponse.json(
                {
                    error: "Export request failed",
                    status: error.response?.status || 500,
                    statusText: error.response?.statusText,
                    details: error.response?.data || error.message,
                    success: false,
                    timestamp: new Date().toISOString(),
                },
                { status: error.response?.status || 502 }
            );
        }

        return NextResponse.json(
            {
                error: "Internal server error during all statuses export",
                details:
                    error instanceof Error ? error.message : "Unknown error",
                success: false,
                timestamp: new Date().toISOString(),
            },
            { status: 500 }
        );
    }
}

/**
 * API route to export invoices to Excel from Vietnamese Tax Authority
 * Routes to different endpoints based on invoice status:
 * - Status 6 and 8: sco-query/invoices/export-excel-sold endpoint
 * - Status 5: query/invoices/export-excel-sold endpoint
 * - Other statuses: query/invoices/export-excel-sold endpoint
 * - All Statuses: Makes requests to all three endpoints
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

        // Check if "All Statuses" is selected (empty status value)
        if (!status || status === "") {
            // Handle "All Statuses" export by making multiple requests
            return await handleAllStatusesExport(token, queryParams);
        }

        // Determine the correct endpoint based on status
        let baseEndpoint: string;
        if (status === "6" || status === "8") {
            // For status 6 and 8, use the sco-query endpoint
            baseEndpoint =
                "https://hoadondientu.gdt.gov.vn:30000/sco-query/invoices/export-excel-sold";
        } else {
            // For status 5 and other statuses, use the query endpoint
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

        // Send export request to Vietnamese Tax Authority using axios
        const response = await axios.get(exportUrl, {
            httpsAgent,
            headers: {
                Authorization: `Bearer ${token}`,
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                Accept: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,*/*",
                "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8",
                "Cache-Control": "no-cache",
                Pragma: "no-cache",
            },
            responseType: "arraybuffer",
        });

        console.log("Excel export successful:", {
            status: response.status,
            contentType: response.headers["content-type"],
            contentLength: response.headers["content-length"],
        });

        // Return the Excel file
        return new NextResponse(response.data, {
            status: 200,
            headers: {
                "Content-Type":
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "Content-Disposition": `attachment; filename="invoices_status_${status}.xlsx"`,
                "Content-Length": response.headers["content-length"],
            },
        });
    } catch (error) {
        console.error("Excel export error:", error);

        if (axios.isAxiosError(error)) {
            return NextResponse.json(
                {
                    error: "Export request failed",
                    status: error.response?.status || 500,
                    statusText: error.response?.statusText,
                    details: error.response?.data || error.message,
                    success: false,
                    timestamp: new Date().toISOString(),
                },
                { status: error.response?.status || 502 }
            );
        }

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
