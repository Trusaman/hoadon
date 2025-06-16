import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import https from "https";
import axios from "axios";

// Create a custom agent to bypass SSL certificate verification
const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
});

interface CombineExcelRequest {
    token: string;
    queryParams: {
        search: string;
    };
    dateRange?: {
        startDate: string;
        endDate: string;
    };
}

interface ExcelFileData {
    status: string;
    buffer: ArrayBuffer;
    filename: string;
}

/**
 * Download Excel file from a specific status endpoint
 */
async function downloadExcelForStatus(
    token: string,
    status: string,
    queryParams: { search?: string }
): Promise<{ success: boolean; buffer?: ArrayBuffer; error?: string }> {
    try {
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

        const urlParams = new URLSearchParams();
        urlParams.append("sort", "tdlap:desc,khmshdon:asc,shdon:desc");
        urlParams.append("type", "purchase");

        if (queryParams?.search) {
            urlParams.append("search", queryParams.search);
        } else {
            urlParams.append("search", "");
        }

        const exportUrl = `${baseEndpoint}?${urlParams.toString()}`;

        console.log(`Downloading Excel for status ${status}:`, {
            url: exportUrl,
            baseEndpoint,
            status,
            hasToken: !!token,
        });

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

        return { success: true, buffer: response.data };
    } catch (error) {
        console.error(`Error downloading Excel for status ${status}:`, error);

        if (axios.isAxiosError(error)) {
            return {
                success: false,
                error: `Status ${error.response?.status}: ${
                    error.response?.statusText || error.message
                }`,
            };
        }

        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

/**
 * Combine multiple Excel files into a single workbook with separate worksheets
 */
function combineExcelFiles(excelFiles: ExcelFileData[]): ArrayBuffer {
    // Create a new workbook
    const combinedWorkbook = XLSX.utils.book_new();

    excelFiles.forEach((fileData) => {
        try {
            // Read the Excel file
            const workbook = XLSX.read(fileData.buffer, { type: "array" });

            // Get the first worksheet from each file
            const firstSheetName = workbook.SheetNames[0];
            if (firstSheetName) {
                const worksheet = workbook.Sheets[firstSheetName];

                let worksheetName = "";
                //  if status is 5, worksheet name should be "Co ma", if status is 6, worksheet name should be "Khong ma", if status is 8, worksheet name should be "May tinh tien"
                if (fileData.status === "5") {
                    worksheetName = "Co ma";
                } else if (fileData.status === "6") {
                    worksheetName = "Khong ma";
                } else if (fileData.status === "8") {
                    worksheetName = "May tinh tien";
                } else {
                    worksheetName = `Status ${fileData.status}`;
                }

                // Add the worksheet to the combined workbook
                XLSX.utils.book_append_sheet(
                    combinedWorkbook,
                    worksheet,
                    worksheetName
                );

                console.log(
                    `Added worksheet "${worksheetName}" from status ${fileData.status}`
                );
            }
        } catch (error) {
            console.error(
                `Error processing Excel file for status ${fileData.status}:`,
                error
            );
        }
    });

    // Generate the combined Excel file
    const combinedBuffer = XLSX.write(combinedWorkbook, {
        type: "array",
        bookType: "xlsx",
    });

    return combinedBuffer;
}

/**
 * Generate a descriptive filename for the combined Excel file
 */
function generateCombinedFilename(dateRange?: {
    startDate: string;
    endDate: string;
}): string {
    const timestamp = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format

    if (dateRange?.startDate && dateRange?.endDate) {
        // Format dates for filename (remove time part if present)
        const startDate = dateRange.startDate.split("T")[0];
        const endDate = dateRange.endDate.split("T")[0];
        return `Combined_Invoice_Report_${startDate}_to_${endDate}.xlsx`;
    }

    return `Combined_Invoice_Report_${timestamp}.xlsx`;
}

/**
 * API route to combine Excel files from all invoice statuses (5, 6, 8)
 * Downloads files from each status endpoint and combines them into a single workbook
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { token, queryParams, dateRange }: CombineExcelRequest = body;

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

        console.log("Combining Excel files from all statuses:", {
            hasToken: !!token,
            tokenLength: token.length,
            queryParams,
            dateRange,
        });

        // Download Excel files from all status endpoints
        const statuses = ["5", "6", "8"];
        const downloadPromises = statuses.map(async (status) => {
            const result = await downloadExcelForStatus(
                token,
                status,
                queryParams
            );

            if (result.success && result.buffer) {
                return {
                    status,
                    buffer: result.buffer,
                    filename: `invoices_status_${status}.xlsx`,
                    success: true,
                };
            } else {
                return {
                    status,
                    success: false,
                    error: result.error,
                };
            }
        });

        const results = await Promise.allSettled(downloadPromises);
        const successfulDownloads: ExcelFileData[] = results
            .filter(
                (
                    result
                ): result is PromiseFulfilledResult<
                    ExcelFileData & { success: true }
                > => result.status === "fulfilled" && result.value.success
            )
            .map((result) => result.value);

        if (successfulDownloads.length === 0) {
            return NextResponse.json(
                {
                    error: "Failed to download any Excel files",
                    success: false,
                    timestamp: new Date().toISOString(),
                },
                { status: 500 }
            );
        }

        console.log(
            `Successfully downloaded ${successfulDownloads.length} Excel files`
        );

        // Combine the Excel files into a single workbook
        const combinedBuffer = combineExcelFiles(successfulDownloads);

        // Generate descriptive filename
        const filename = generateCombinedFilename(dateRange);

        console.log(`Generated combined Excel file: ${filename}`);

        // Return the combined Excel file
        return new NextResponse(combinedBuffer, {
            status: 200,
            headers: {
                "Content-Type":
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "Content-Disposition": `attachment; filename="${filename}"`,
                "Content-Length": combinedBuffer.byteLength.toString(),
            },
        });
    } catch (error) {
        console.error("Combined Excel export error:", error);

        return NextResponse.json(
            {
                error: "Internal server error during combined Excel export",
                details:
                    error instanceof Error ? error.message : "Unknown error",
                success: false,
                timestamp: new Date().toISOString(),
            },
            { status: 500 }
        );
    }
}
