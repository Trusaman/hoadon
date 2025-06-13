"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
    fetchCaptcha,
    solveCaptcha,
    isValidCaptchaResponse,
    queryInvoices,
    queryAllStatusInvoices,
    exportInvoicesToExcel,
    exportAllStatusesToExcel,
    exportCombinedExcelWorkbook,
    type CaptchaResponse,
    type CaptchaSolverResult,
    type InvoiceQueryResponse,
    type ExcelExportRequest,
} from "@/lib/captcha-api";
import sampleResult from "../../../sample-result.json";
import { DateRangePicker } from "@/components/ui/date-picker";

interface AuthenticationResponse {
    success: boolean;
    data?: any;
    token?: string;
    error?: string;
    status?: number;
    statusText?: string;
    details?: string;
    timestamp?: string;
    authPayload?: {
        ckey: string;
        cvalue: string;
        username: string;
    };
}

export default function AuthenticatePage() {
    // Form state
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    // Captcha state
    const [captchaData, setCaptchaData] = useState<CaptchaResponse | null>(
        null
    );
    const [captchaLoading, setCaptchaLoading] = useState(false);
    const [captchaError, setCaptchaError] = useState<string | null>(null);

    // Solver state
    const [solving, setSolving] = useState(false);
    const [solverResult, setSolverResult] =
        useState<CaptchaSolverResult | null>(null);
    const [solverError, setSolverError] = useState<string | null>(null);

    // Authentication state
    const [authenticating, setAuthenticating] = useState(false);
    const [authResult, setAuthResult] = useState<AuthenticationResponse | null>(
        null
    );
    const [authError, setAuthError] = useState<string | null>(null);

    // Invoice query state
    const [queryingInvoices, setQueryingInvoices] = useState(false);
    const [invoiceResult, setInvoiceResult] =
        useState<InvoiceQueryResponse | null>(null);
    const [invoiceError, setInvoiceError] = useState<string | null>(null);
    const [useSampleData, setUseSampleData] = useState(false);

    // Excel export state
    const [downloadingExcel, setDownloadingExcel] = useState(false);
    const [downloadError, setDownloadError] = useState<string | null>(null);

    // Search parameters state
    const [searchParams, setSearchParams] = useState(() => {
        const today = new Date();
        return {
            startDate: today,
            endDate: today,
            status: "5",
            invoiceNumber: "",
            sellerTaxId: "",
            minAmount: "",
            maxAmount: "",
        };
    });

    // Fetch captcha
    const handleFetchCaptcha = async () => {
        setCaptchaLoading(true);
        setCaptchaError(null);
        setSolverResult(null);
        setSolverError(null);

        try {
            const response = await fetchCaptcha();

            if (response.success && isValidCaptchaResponse(response)) {
                setCaptchaData(response);
                // Auto-solve the captcha
                handleSolveCaptcha(response.data?.rawSvg);
            } else {
                setCaptchaError(response.error || "Failed to fetch captcha");
            }
        } catch (error) {
            setCaptchaError(
                error instanceof Error
                    ? error.message
                    : "Unknown error occurred"
            );
        } finally {
            setCaptchaLoading(false);
        }
    };

    // Solve captcha
    const handleSolveCaptcha = async (svgContent?: string) => {
        const svg = svgContent || captchaData?.data?.rawSvg;
        if (!svg) {
            setSolverError("No SVG content available to solve");
            return;
        }

        setSolving(true);
        setSolverError(null);

        try {
            const result = await solveCaptcha(svg);
            setSolverResult(result);

            if (!result.success && result.error) {
                setSolverError(result.error);
            }
        } catch (error) {
            setSolverError(
                error instanceof Error
                    ? error.message
                    : "Unknown error occurred while solving"
            );
        } finally {
            setSolving(false);
        }
    };

    // Authenticate
    const handleAuthenticate = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!captchaData?.data?.key || !solverResult?.solvedText) {
            setAuthError("Please fetch and solve captcha first");
            return;
        }

        if (!username || !password) {
            setAuthError("Please enter username and password");
            return;
        }

        setAuthenticating(true);
        setAuthError(null);
        setAuthResult(null);

        try {
            const response = await fetch("/api/authenticate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ckey: captchaData.data.key,
                    cvalue: solverResult.solvedText,
                    username,
                    password,
                }),
            });

            const data = await response.json();
            setAuthResult(data);

            if (!data.success) {
                setAuthError(data.error || "Authentication failed");
            }
        } catch (error) {
            setAuthError(
                error instanceof Error
                    ? error.message
                    : "Unknown error occurred"
            );
        } finally {
            setAuthenticating(false);
        }
    };

    // Query invoices
    const handleQueryInvoices = async () => {
        if (!useSampleData && !authResult?.token) {
            setInvoiceError("No authentication token available");
            return;
        }

        setQueryingInvoices(true);
        setInvoiceError(null);
        setInvoiceResult(null);

        try {
            if (useSampleData) {
                // Simulate API delay
                await new Promise((resolve) => setTimeout(resolve, 1000));

                // Use sample data
                const response: InvoiceQueryResponse = {
                    success: true,
                    data: sampleResult.data,
                    status: sampleResult.status,
                    timestamp: sampleResult.timestamp,
                    queryParams: sampleResult.queryParams,
                    url: sampleResult.url,
                };

                setInvoiceResult(response);
            } else {
                const searchQuery = buildSearchQuery();

                // Check if "All Statuses" is selected (empty status value)
                if (!searchParams.status || searchParams.status === "") {
                    // Query all status endpoints (5, 6, 8) and combine results
                    const response = await queryAllStatusInvoices({
                        token: authResult!.token!,
                        queryParams: {
                            sort: "tdlap:desc,khmshdon:asc,shdon:desc",
                            size: "15",
                            search: searchQuery,
                        },
                    });

                    setInvoiceResult(response);

                    if (!response.success) {
                        setInvoiceError(
                            response.error ||
                                "Failed to query invoices from all status endpoints"
                        );
                    }
                } else {
                    // Query specific status endpoint
                    const response = await queryInvoices({
                        token: authResult!.token!,
                        status: searchParams.status, // Pass the current status to determine endpoint
                        queryParams: {
                            sort: "tdlap:desc,khmshdon:asc,shdon:desc",
                            size: "15",
                            search: searchQuery,
                        },
                    });

                    setInvoiceResult(response);

                    if (!response.success) {
                        setInvoiceError(
                            response.error || "Invoice query failed"
                        );
                    }
                }
            }
        } catch (error) {
            setInvoiceError(
                error instanceof Error
                    ? error.message
                    : "Unknown error occurred"
            );
        } finally {
            setQueryingInvoices(false);
        }
    };

    // Download Excel export (separate files)
    const handleDownloadExcel = async () => {
        if (!useSampleData && !authResult?.token) {
            setDownloadError("No authentication token available");
            return;
        }

        if (useSampleData) {
            setDownloadError(
                "Excel export is not available for sample data. Please switch to Live API mode."
            );
            return;
        }

        setDownloadingExcel(true);
        setDownloadError(null);

        try {
            const searchQuery = buildSearchQuery();

            // Check if "All Statuses" is selected (empty status value)
            if (!searchParams.status || searchParams.status === "") {
                // Export from all status endpoints (5, 6, 8)
                const exportRequest: ExcelExportRequest = {
                    token: authResult!.token!,
                    queryParams: {
                        search: searchQuery,
                    },
                };

                const result = await exportAllStatusesToExcel(exportRequest);

                if (result.success && result.results.length > 0) {
                    const successfulExports = result.results.filter(
                        (r) => r.success
                    );

                    if (successfulExports.length === 0) {
                        setDownloadError("All export requests failed");
                        return;
                    }

                    // Download all successful exports
                    successfulExports.forEach((exportResult, index) => {
                        if (exportResult.blob) {
                            setTimeout(() => {
                                const url = window.URL.createObjectURL(
                                    exportResult.blob!
                                );
                                const link = document.createElement("a");
                                link.href = url;
                                link.download =
                                    exportResult.filename ||
                                    `invoices_status_${exportResult.status}.xlsx`;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                                window.URL.revokeObjectURL(url);
                            }, index * 500); // Stagger downloads by 500ms
                        }
                    });

                    // Show success message with details
                    const failedExports = result.results.filter(
                        (r) => !r.success
                    );
                    if (failedExports.length > 0) {
                        const failedStatuses = failedExports
                            .map((r) => r.status)
                            .join(", ");
                        setDownloadError(
                            `Downloaded ${successfulExports.length} files successfully. Failed to export statuses: ${failedStatuses}`
                        );
                    }
                } else {
                    setDownloadError(
                        result.error || "Failed to download Excel files"
                    );
                }
            } else {
                // Export specific status endpoint
                const exportRequest: ExcelExportRequest = {
                    token: authResult!.token!,
                    status: searchParams.status, // Pass the current status to determine endpoint
                    queryParams: {
                        search: searchQuery,
                    },
                };

                const result = await exportInvoicesToExcel(exportRequest);

                if (result.success && result.blob) {
                    // Create download link and trigger download
                    const url = window.URL.createObjectURL(result.blob);
                    const link = document.createElement("a");
                    link.href = url;
                    link.download = result.filename || "invoices.xlsx";
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                } else {
                    setDownloadError(
                        result.error || "Failed to download Excel file"
                    );
                }
            }
        } catch (error) {
            setDownloadError(
                error instanceof Error
                    ? error.message
                    : "Unknown error occurred during download"
            );
        } finally {
            setDownloadingExcel(false);
        }
    };

    // Download combined Excel workbook
    const handleDownloadCombinedExcel = async () => {
        if (!useSampleData && !authResult?.token) {
            setDownloadError("No authentication token available");
            return;
        }

        if (useSampleData) {
            setDownloadError(
                "Excel export is not available for sample data. Please switch to Live API mode."
            );
            return;
        }

        setDownloadingExcel(true);
        setDownloadError(null);

        try {
            const searchQuery = buildSearchQuery();

            // Prepare date range for descriptive filename
            const dateRange = {
                startDate: searchParams.startDate?.toISOString() || "",
                endDate: searchParams.endDate?.toISOString() || "",
            };

            const exportRequest: ExcelExportRequest = {
                token: authResult!.token!,
                queryParams: {
                    search: searchQuery,
                },
            };

            const result = await exportCombinedExcelWorkbook(
                exportRequest,
                dateRange
            );

            if (result.success && result.blob) {
                // Create download link and trigger download
                const url = window.URL.createObjectURL(result.blob);
                const link = document.createElement("a");
                link.href = url;
                link.download =
                    result.filename || "Combined_Invoice_Report.xlsx";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            } else {
                setDownloadError(
                    result.error || "Failed to download combined Excel file"
                );
            }
        } catch (error) {
            setDownloadError(
                error instanceof Error
                    ? error.message
                    : "Unknown error occurred during download"
            );
        } finally {
            setDownloadingExcel(false);
        }
    };

    // Auto-fetch captcha on load
    useEffect(() => {
        handleFetchCaptcha();
    }, []);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    // Helper function to convert Date to DD/MM/YYYY format
    const formatDateForAPI = (date: Date | string) => {
        if (!date) return "";

        let dateObj: Date;
        if (typeof date === "string") {
            dateObj = new Date(date);
        } else {
            dateObj = date;
        }

        const day = dateObj.getDate().toString().padStart(2, "0");
        const month = (dateObj.getMonth() + 1).toString().padStart(2, "0");
        const year = dateObj.getFullYear();
        return `${day}/${month}/${year}`;
    };

    // Helper function to build search query string
    const buildSearchQuery = () => {
        const searchParts: string[] = [];

        // Date range - Vietnamese Tax Authority expects DD/MM/YYYY format
        if (searchParams.startDate) {
            const formattedDate = formatDateForAPI(searchParams.startDate);
            searchParts.push(`tdlap=ge=${formattedDate}T00:00:00`);
        }
        if (searchParams.endDate) {
            const formattedDate = formatDateForAPI(searchParams.endDate);
            searchParts.push(`tdlap=le=${formattedDate}T23:59:59`);
        }

        // Status filter - only add if a specific status is selected (not "All Statuses")
        if (searchParams.status && searchParams.status !== "") {
            searchParts.push(`ttxly==${searchParams.status}`);
        }

        // Invoice number
        if (searchParams.invoiceNumber) {
            searchParts.push(`shdon==${searchParams.invoiceNumber}`);
        }

        // Seller tax ID
        if (searchParams.sellerTaxId) {
            searchParts.push(`nbmst==${searchParams.sellerTaxId}`);
        }

        // Amount range
        if (searchParams.minAmount) {
            searchParts.push(`tgtttbso=ge=${searchParams.minAmount}`);
        }
        if (searchParams.maxAmount) {
            searchParts.push(`tgtttbso=le=${searchParams.maxAmount}`);
        }

        return searchParts.join(";");
    };

    // Helper function to reset search parameters
    const resetSearchParams = () => {
        const today = new Date();
        setSearchParams({
            startDate: today,
            endDate: today,
            status: "5",
            invoiceNumber: "",
            sellerTaxId: "",
            minAmount: "",
            maxAmount: "",
        });
    };

    // Helper function to get all invoices from combined results
    const getAllInvoicesFromCombined = (combinedResults: any) => {
        const allInvoices: any[] = [];

        // Add invoices from status 5
        if (combinedResults.status5?.datas) {
            combinedResults.status5.datas.forEach((invoice: any) => {
                allInvoices.push({ ...invoice, sourceStatus: "5" });
            });
        }

        // Add invoices from status 6
        if (combinedResults.status6?.datas) {
            combinedResults.status6.datas.forEach((invoice: any) => {
                allInvoices.push({ ...invoice, sourceStatus: "6" });
            });
        }

        // Add invoices from status 8
        if (combinedResults.status8?.datas) {
            combinedResults.status8.datas.forEach((invoice: any) => {
                allInvoices.push({ ...invoice, sourceStatus: "8" });
            });
        }

        return allInvoices;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                                🔐 Vietnamese Tax Authority Authentication
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 mt-2">
                                Authenticate with the Vietnamese Tax Authority
                                using captcha verification
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={handleFetchCaptcha}
                                disabled={captchaLoading}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {captchaLoading
                                    ? "🔄 Loading..."
                                    : "🔄 New Captcha"}
                            </button>
                            <Link
                                href="/dashboard"
                                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                            >
                                ← Back to Dashboard
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Authentication Form */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                        🎯 Authentication Form
                    </h2>

                    <form onSubmit={handleAuthenticate} className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Left Column - Form Fields */}
                            <div className="space-y-4">
                                <div>
                                    <label
                                        htmlFor="username"
                                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                                    >
                                        Username
                                    </label>
                                    <input
                                        id="username"
                                        type="text"
                                        value={username}
                                        onChange={(e) =>
                                            setUsername(e.target.value)
                                        }
                                        placeholder="Enter your username"
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                                        required
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="password"
                                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                                    >
                                        Password
                                    </label>
                                    <input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) =>
                                            setPassword(e.target.value)
                                        }
                                        placeholder="Enter your password"
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Captcha Key
                                    </label>
                                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                                        <code className="text-sm font-mono break-all">
                                            {captchaData?.data?.key ||
                                                "Loading..."}
                                        </code>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Solved Captcha
                                    </label>
                                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                                        {solving ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                                <span className="text-blue-600 dark:text-blue-400 text-sm">
                                                    Solving...
                                                </span>
                                            </div>
                                        ) : solverResult?.success ? (
                                            <code className="text-lg font-mono font-bold text-green-600 dark:text-green-400">
                                                {solverResult.solvedText}
                                            </code>
                                        ) : (
                                            <span className="text-gray-500 dark:text-gray-400 text-sm">
                                                {solverError ||
                                                    "Waiting for captcha..."}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Right Column - Captcha Display */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Captcha Image
                                </label>
                                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center min-h-[200px] flex items-center justify-center bg-white dark:bg-gray-700">
                                    {captchaLoading ? (
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                            <p className="text-gray-600 dark:text-gray-400">
                                                Loading captcha...
                                            </p>
                                        </div>
                                    ) : captchaError ? (
                                        <div className="text-center">
                                            <div className="text-red-500 text-4xl mb-2">
                                                ⚠️
                                            </div>
                                            <p className="text-red-600 dark:text-red-400 font-medium mb-2">
                                                Error
                                            </p>
                                            <p className="text-gray-600 dark:text-gray-400 text-sm">
                                                {captchaError}
                                            </p>
                                        </div>
                                    ) : captchaData?.data ? (
                                        <img
                                            src={captchaData.data.image}
                                            alt="Vietnamese Tax Authority Captcha"
                                            className="max-w-full h-auto border border-gray-200 dark:border-gray-600 rounded [image-rendering:pixelated]"
                                        />
                                    ) : (
                                        <div className="text-center">
                                            <div className="text-gray-400 text-4xl mb-2">
                                                🖼️
                                            </div>
                                            <p className="text-gray-600 dark:text-gray-400">
                                                Click "New Captcha" to load
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={
                                    authenticating ||
                                    !captchaData?.data?.key ||
                                    !solverResult?.success
                                }
                                className={cn(
                                    "w-full py-3 px-4 rounded-lg font-medium transition-all duration-200",
                                    "focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2",
                                    authenticating ||
                                        !captchaData?.data?.key ||
                                        !solverResult?.success
                                        ? "bg-gray-400 cursor-not-allowed text-white"
                                        : "bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg"
                                )}
                            >
                                {authenticating ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Authenticating...
                                    </div>
                                ) : (
                                    "🔐 Authenticate with Tax Authority"
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Authentication Error */}
                {authError && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 mb-6">
                        <div className="flex items-center">
                            <div className="text-red-600 dark:text-red-400 text-xl mr-3">
                                ❌
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">
                                    Authentication Error
                                </h3>
                                <p className="text-red-600 dark:text-red-400 mt-1">
                                    {authError}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Authentication Results */}
                {authResult && (
                    <div className="space-y-6">
                        {/* Success/Failure Status */}
                        <div
                            className={cn(
                                "rounded-xl p-6 border",
                                authResult.success
                                    ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                                    : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                            )}
                        >
                            <div className="flex items-center">
                                <div
                                    className={cn(
                                        "text-xl mr-3",
                                        authResult.success
                                            ? "text-green-600 dark:text-green-400"
                                            : "text-red-600 dark:text-red-400"
                                    )}
                                >
                                    {authResult.success ? "✅" : "❌"}
                                </div>
                                <div>
                                    <h3
                                        className={cn(
                                            "text-lg font-semibold",
                                            authResult.success
                                                ? "text-green-800 dark:text-green-200"
                                                : "text-red-800 dark:text-red-200"
                                        )}
                                    >
                                        {authResult.success
                                            ? "Authentication Successful!"
                                            : "Authentication Failed"}
                                    </h3>
                                    <p
                                        className={cn(
                                            "mt-1",
                                            authResult.success
                                                ? "text-green-600 dark:text-green-400"
                                                : "text-red-600 dark:text-red-400"
                                        )}
                                    >
                                        {authResult.success
                                            ? "Successfully authenticated with Vietnamese Tax Authority"
                                            : authResult.error ||
                                              "Authentication request failed"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Token Display */}
                        {authResult.success && authResult.token && (
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                                    🎫 Authentication Token
                                    <span className="ml-2 px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 text-sm rounded-full">
                                        ✅ Active
                                    </span>
                                </h2>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Access Token
                                        </label>
                                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 flex items-center gap-2">
                                            <code className="text-sm font-mono break-all flex-1 text-green-600 dark:text-green-400 font-semibold">
                                                {authResult.token}
                                            </code>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    copyToClipboard(
                                                        authResult.token || ""
                                                    )
                                                }
                                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                                                title="Copy token to clipboard"
                                            >
                                                📋
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                                            <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                                                Status
                                            </div>
                                            <div className="text-blue-800 dark:text-blue-200 font-semibold">
                                                {authResult.status || "Success"}
                                            </div>
                                        </div>
                                        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
                                            <div className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                                                Timestamp
                                            </div>
                                            <div className="text-purple-800 dark:text-purple-200 font-mono text-xs">
                                                {authResult.timestamp
                                                    ? new Date(
                                                          authResult.timestamp
                                                      ).toLocaleString()
                                                    : "N/A"}
                                            </div>
                                        </div>
                                        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                                            <div className="text-sm text-green-600 dark:text-green-400 font-medium">
                                                Username
                                            </div>
                                            <div className="text-green-800 dark:text-green-200 font-semibold">
                                                {authResult.authPayload
                                                    ?.username || "N/A"}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Invoice Query Section */}
                {(useSampleData ||
                    (authResult?.success && authResult?.token)) && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                            📄 Query Invoices
                            <span className="ml-2 px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 text-sm rounded-full">
                                Vietnamese Tax Portal
                            </span>
                        </h2>

                        <div className="space-y-4">
                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                                <p className="text-blue-800 dark:text-blue-200 text-sm">
                                    Query invoices from the Vietnamese Tax
                                    Authority using your authenticated token.
                                    Configure the search parameters below to
                                    filter invoices by date range, status,
                                    invoice number, seller tax ID, and amount
                                    range.
                                </p>
                            </div>

                            {/* Data Source Toggle */}
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="text-yellow-800 dark:text-yellow-200 font-medium">
                                            📊 Data Source
                                        </h4>
                                        <p className="text-yellow-700 dark:text-yellow-300 text-sm mt-1">
                                            {useSampleData
                                                ? "Using sample data from sample-result.json"
                                                : "Using live API data from Vietnamese Tax Authority"}
                                        </p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={useSampleData}
                                            onChange={(e) =>
                                                setUseSampleData(
                                                    e.target.checked
                                                )
                                            }
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                        <span className="ml-3 text-sm font-medium text-yellow-800 dark:text-yellow-200">
                                            {useSampleData
                                                ? "Sample Data"
                                                : "Live API"}
                                        </span>
                                    </label>
                                </div>
                            </div>

                            {/* Search Parameters */}
                            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-gray-800 dark:text-gray-200 font-medium">
                                        🔍 Search Parameters
                                    </h4>
                                    <button
                                        type="button"
                                        onClick={resetSearchParams}
                                        className="text-sm px-3 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                                    >
                                        Reset
                                    </button>
                                </div>

                                {useSampleData && (
                                    <div className="bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-lg p-3 mb-4">
                                        <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                                            ⚠️ Note: Search filters don't affect
                                            sample data results. Switch to "Live
                                            API" to use custom search
                                            parameters.
                                        </p>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {/* Date Range */}
                                    <div className="md:col-span-2 lg:col-span-3">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            📅 Date Range
                                        </label>
                                        <DateRangePicker
                                            startDate={searchParams.startDate}
                                            endDate={searchParams.endDate}
                                            onStartDateSelect={(date) =>
                                                setSearchParams((prev) => ({
                                                    ...prev,
                                                    startDate:
                                                        date || new Date(),
                                                }))
                                            }
                                            onEndDateSelect={(date) =>
                                                setSearchParams((prev) => ({
                                                    ...prev,
                                                    endDate: date || new Date(),
                                                }))
                                            }
                                            startPlaceholder="Select start date"
                                            endPlaceholder="Select end date"
                                            disabled={useSampleData}
                                        />
                                    </div>

                                    {/* Status Filter */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Status
                                        </label>
                                        <select
                                            aria-label="Invoice Status"
                                            value={searchParams.status}
                                            onChange={(e) =>
                                                setSearchParams((prev) => ({
                                                    ...prev,
                                                    status: e.target.value,
                                                }))
                                            }
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
                                        >
                                            <option value="">
                                                All Statuses
                                            </option>
                                            <option value="1">Draft (1)</option>
                                            <option value="2">
                                                Pending (2)
                                            </option>
                                            <option value="3">
                                                Approved (3)
                                            </option>
                                            <option value="4">
                                                Rejected (4)
                                            </option>
                                            <option value="5">
                                                Đã cấp mã hóa đơn (5)
                                            </option>
                                            <option value="6">
                                                Cục Thuế đã nhận không mã (6)
                                            </option>
                                            <option value="8">
                                                Cục Thuế đã nhận hóa đơn có mã
                                                khởi tạo từ máy tính tiền (8)
                                            </option>
                                        </select>
                                    </div>

                                    {/* Invoice Number */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Invoice Number
                                        </label>
                                        <input
                                            type="text"
                                            value={searchParams.invoiceNumber}
                                            onChange={(e) =>
                                                setSearchParams((prev) => ({
                                                    ...prev,
                                                    invoiceNumber:
                                                        e.target.value,
                                                }))
                                            }
                                            placeholder="e.g., 267806"
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
                                        />
                                    </div>

                                    {/* Seller Tax ID */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Seller Tax ID (MST)
                                        </label>
                                        <input
                                            type="text"
                                            value={searchParams.sellerTaxId}
                                            onChange={(e) =>
                                                setSearchParams((prev) => ({
                                                    ...prev,
                                                    sellerTaxId: e.target.value,
                                                }))
                                            }
                                            placeholder="e.g., 0108930466"
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
                                        />
                                    </div>

                                    {/* Amount Range */}
                                    <div className="md:col-span-2 lg:col-span-3">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Amount Range (VND)
                                        </label>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                                                    Minimum Amount
                                                </label>
                                                <input
                                                    type="number"
                                                    value={
                                                        searchParams.minAmount
                                                    }
                                                    onChange={(e) =>
                                                        setSearchParams(
                                                            (prev) => ({
                                                                ...prev,
                                                                minAmount:
                                                                    e.target
                                                                        .value,
                                                            })
                                                        )
                                                    }
                                                    placeholder="e.g., 100000"
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                                                    Maximum Amount
                                                </label>
                                                <input
                                                    type="number"
                                                    value={
                                                        searchParams.maxAmount
                                                    }
                                                    onChange={(e) =>
                                                        setSearchParams(
                                                            (prev) => ({
                                                                ...prev,
                                                                maxAmount:
                                                                    e.target
                                                                        .value,
                                                            })
                                                        )
                                                    }
                                                    placeholder="e.g., 10000000"
                                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white text-sm"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Current Search Query Preview */}
                                {!useSampleData && (
                                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                        <label className="block text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">
                                            Generated Search Query:
                                        </label>
                                        <code className="text-xs text-blue-800 dark:text-blue-200 break-all">
                                            {buildSearchQuery() ||
                                                "No search parameters set"}
                                        </code>
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={handleQueryInvoices}
                                    disabled={queryingInvoices}
                                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                                >
                                    {queryingInvoices ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                            Querying Invoices...
                                        </>
                                    ) : (
                                        <>📄 Query Invoices</>
                                    )}
                                </button>

                                {/* Download Options - Show different buttons based on status selection */}
                                {!searchParams.status ||
                                searchParams.status === "" ? (
                                    // All Statuses selected - show both options
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <button
                                            type="button"
                                            onClick={handleDownloadExcel}
                                            disabled={
                                                downloadingExcel ||
                                                useSampleData ||
                                                !authResult?.token
                                            }
                                            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                                            title={
                                                useSampleData
                                                    ? "Excel export is not available for sample data"
                                                    : !authResult?.token
                                                    ? "Authentication required"
                                                    : "Download separate Excel files for each status"
                                            }
                                        >
                                            {downloadingExcel ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                                    Downloading...
                                                </>
                                            ) : (
                                                <>📊 Download Separate Files</>
                                            )}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={
                                                handleDownloadCombinedExcel
                                            }
                                            disabled={
                                                downloadingExcel ||
                                                useSampleData ||
                                                !authResult?.token
                                            }
                                            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                                            title={
                                                useSampleData
                                                    ? "Excel export is not available for sample data"
                                                    : !authResult?.token
                                                    ? "Authentication required"
                                                    : "Download combined Excel workbook with separate worksheets for each status"
                                            }
                                        >
                                            {downloadingExcel ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                                    Downloading...
                                                </>
                                            ) : (
                                                <>
                                                    📋 Download Combined
                                                    Workbook
                                                </>
                                            )}
                                        </button>
                                    </div>
                                ) : (
                                    // Specific status selected - show single download option
                                    <button
                                        type="button"
                                        onClick={handleDownloadExcel}
                                        disabled={
                                            downloadingExcel ||
                                            useSampleData ||
                                            !authResult?.token
                                        }
                                        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                                        title={
                                            useSampleData
                                                ? "Excel export is not available for sample data"
                                                : !authResult?.token
                                                ? "Authentication required"
                                                : "Download invoices as Excel file"
                                        }
                                    >
                                        {downloadingExcel ? (
                                            <>
                                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                                Downloading...
                                            </>
                                        ) : (
                                            <>📊 Download to XLSX</>
                                        )}
                                    </button>
                                )}
                            </div>

                            {/* Error Displays */}
                            {invoiceError && (
                                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                                    <div className="flex items-center">
                                        <span className="text-red-600 dark:text-red-400 text-xl mr-3">
                                            ❌
                                        </span>
                                        <div>
                                            <h3 className="text-red-800 dark:text-red-200 font-semibold">
                                                Invoice Query Failed
                                            </h3>
                                            <p className="text-red-600 dark:text-red-400 mt-1">
                                                {invoiceError}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {downloadError && (
                                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                                    <div className="flex items-center">
                                        <span className="text-red-600 dark:text-red-400 text-xl mr-3">
                                            ❌
                                        </span>
                                        <div>
                                            <h3 className="text-red-800 dark:text-red-200 font-semibold">
                                                Excel Download Failed
                                            </h3>
                                            <p className="text-red-600 dark:text-red-400 mt-1">
                                                {downloadError}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Invoice Results Display */}
                            {invoiceResult && (
                                <div className="space-y-4">
                                    <div
                                        className={cn(
                                            "rounded-lg p-4 border",
                                            invoiceResult.success
                                                ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                                                : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                                        )}
                                    >
                                        <div className="flex items-center">
                                            <span
                                                className={cn(
                                                    "text-xl mr-3",
                                                    invoiceResult.success
                                                        ? "text-green-600 dark:text-green-400"
                                                        : "text-red-600 dark:text-red-400"
                                                )}
                                            >
                                                {invoiceResult.success
                                                    ? "✅"
                                                    : "❌"}
                                            </span>
                                            <div>
                                                <h3
                                                    className={cn(
                                                        "font-semibold",
                                                        invoiceResult.success
                                                            ? "text-green-800 dark:text-green-200"
                                                            : "text-red-800 dark:text-red-200"
                                                    )}
                                                >
                                                    {invoiceResult.success
                                                        ? "Invoice Query Successful!"
                                                        : "Invoice Query Failed"}
                                                </h3>
                                                <p
                                                    className={cn(
                                                        "text-sm mt-1",
                                                        invoiceResult.success
                                                            ? "text-green-600 dark:text-green-400"
                                                            : "text-red-600 dark:text-red-400"
                                                    )}
                                                >
                                                    {invoiceResult.success
                                                        ? "Successfully retrieved invoice data from Vietnamese Tax Authority"
                                                        : invoiceResult.error ||
                                                          "Invoice query request failed"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Invoice Data Display */}
                                    {invoiceResult.success &&
                                        invoiceResult.data && (
                                            <div className="space-y-4">
                                                {/* Invoice Summary */}
                                                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                                    <h4 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-3">
                                                        📊 Invoice Summary
                                                    </h4>

                                                    {/* Check if this is a combined result from all statuses */}
                                                    {invoiceResult.combinedResults ? (
                                                        <div className="space-y-4">
                                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                                <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                                                                    <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                                                                        Total
                                                                        Invoices
                                                                        (All
                                                                        Statuses)
                                                                    </div>
                                                                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                                                        {invoiceResult
                                                                            .combinedResults
                                                                            .totalCount ||
                                                                            0}
                                                                    </div>
                                                                </div>
                                                                <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                                                                    <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                                                                        Endpoints
                                                                        Queried
                                                                    </div>
                                                                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                                                        {invoiceResult
                                                                            .combinedResults
                                                                            .endpoints
                                                                            ?.length ||
                                                                            0}
                                                                    </div>
                                                                </div>
                                                                <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                                                                    <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                                                                        Data
                                                                        Source
                                                                    </div>
                                                                    <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                                                                        Combined
                                                                        API
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Status breakdown */}
                                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                                                                    <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                                                                        Status 5
                                                                        (Đã cấp
                                                                        mã)
                                                                    </div>
                                                                    <div className="text-lg font-bold text-blue-800 dark:text-blue-200">
                                                                        {invoiceResult
                                                                            .combinedResults
                                                                            .status5
                                                                            ? Array.isArray(
                                                                                  invoiceResult
                                                                                      .combinedResults
                                                                                      .status5
                                                                              )
                                                                                ? invoiceResult
                                                                                      .combinedResults
                                                                                      .status5
                                                                                      .length
                                                                                : invoiceResult
                                                                                      .combinedResults
                                                                                      .status5
                                                                                      .datas
                                                                                      ?.length ||
                                                                                  0
                                                                            : 0}{" "}
                                                                        invoices
                                                                    </div>
                                                                </div>
                                                                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                                                                    <div className="text-sm text-green-600 dark:text-green-400 font-medium">
                                                                        Status 6
                                                                        (Không
                                                                        mã)
                                                                    </div>
                                                                    <div className="text-lg font-bold text-green-800 dark:text-green-200">
                                                                        {invoiceResult
                                                                            .combinedResults
                                                                            .status6
                                                                            ? Array.isArray(
                                                                                  invoiceResult
                                                                                      .combinedResults
                                                                                      .status6
                                                                              )
                                                                                ? invoiceResult
                                                                                      .combinedResults
                                                                                      .status6
                                                                                      .length
                                                                                : invoiceResult
                                                                                      .combinedResults
                                                                                      .status6
                                                                                      .datas
                                                                                      ?.length ||
                                                                                  0
                                                                            : 0}{" "}
                                                                        invoices
                                                                    </div>
                                                                </div>
                                                                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3">
                                                                    <div className="text-sm text-orange-600 dark:text-orange-400 font-medium">
                                                                        Status 8
                                                                        (Có mã
                                                                        từ TCT)
                                                                    </div>
                                                                    <div className="text-lg font-bold text-orange-800 dark:text-orange-200">
                                                                        {invoiceResult
                                                                            .combinedResults
                                                                            .status8
                                                                            ? Array.isArray(
                                                                                  invoiceResult
                                                                                      .combinedResults
                                                                                      .status8
                                                                              )
                                                                                ? invoiceResult
                                                                                      .combinedResults
                                                                                      .status8
                                                                                      .length
                                                                                : invoiceResult
                                                                                      .combinedResults
                                                                                      .status8
                                                                                      .datas
                                                                                      ?.length ||
                                                                                  0
                                                                            : 0}{" "}
                                                                        invoices
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                            <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                                                                <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                                                                    Total
                                                                    Invoices
                                                                </div>
                                                                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                                                    {invoiceResult
                                                                        .data
                                                                        .total ||
                                                                        invoiceResult
                                                                            .data
                                                                            .datas
                                                                            ?.length ||
                                                                        0}
                                                                </div>
                                                            </div>
                                                            <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                                                                <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                                                                    Query Time
                                                                </div>
                                                                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                                                    {invoiceResult
                                                                        .data
                                                                        .time ||
                                                                        0}
                                                                    ms
                                                                </div>
                                                            </div>
                                                            <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                                                                <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                                                                    Data Source
                                                                </div>
                                                                <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                                                                    {useSampleData
                                                                        ? "Sample"
                                                                        : "Live API"}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Invoice Table */}
                                                {(() => {
                                                    // Determine which invoices to display
                                                    let invoicesToDisplay: any[] =
                                                        [];

                                                    if (
                                                        invoiceResult.combinedResults
                                                    ) {
                                                        // Combined results from all statuses
                                                        invoicesToDisplay =
                                                            getAllInvoicesFromCombined(
                                                                invoiceResult.combinedResults
                                                            );
                                                    } else if (
                                                        invoiceResult.data.datas
                                                    ) {
                                                        // Single status results
                                                        invoicesToDisplay =
                                                            invoiceResult.data
                                                                .datas;
                                                    }

                                                    return (
                                                        invoicesToDisplay.length >
                                                            0 && (
                                                            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                                                <h4 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-3">
                                                                    📋 Invoice
                                                                    Details
                                                                    {invoiceResult.combinedResults && (
                                                                        <span className="ml-2 text-sm text-blue-600 dark:text-blue-400">
                                                                            (Combined
                                                                            from
                                                                            all
                                                                            statuses)
                                                                        </span>
                                                                    )}
                                                                </h4>
                                                                <div className="overflow-x-auto">
                                                                    <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
                                                                        <thead className="bg-gray-100 dark:bg-gray-900">
                                                                            <tr>
                                                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                                                    Invoice
                                                                                    No.
                                                                                </th>
                                                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                                                    Seller
                                                                                </th>
                                                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                                                    Date
                                                                                </th>
                                                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                                                    Amount
                                                                                </th>
                                                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                                                    Tax
                                                                                </th>
                                                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                                                    Total
                                                                                </th>
                                                                                {invoiceResult.combinedResults && (
                                                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                                                        Status
                                                                                    </th>
                                                                                )}
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                                                            {invoicesToDisplay.map(
                                                                                (
                                                                                    invoice: any,
                                                                                    index: number
                                                                                ) => (
                                                                                    <tr
                                                                                        key={
                                                                                            invoice.id ||
                                                                                            `${
                                                                                                invoice.sourceStatus ||
                                                                                                "single"
                                                                                            }-${index}`
                                                                                        }
                                                                                        className="hover:bg-gray-50 dark:hover:bg-gray-700"
                                                                                    >
                                                                                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                                                                                            <div className="font-mono">
                                                                                                {
                                                                                                    invoice.khhdon
                                                                                                }

                                                                                                -
                                                                                                {
                                                                                                    invoice.shdon
                                                                                                }
                                                                                            </div>
                                                                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                                                                {
                                                                                                    invoice.nbmst
                                                                                                }
                                                                                            </div>
                                                                                        </td>
                                                                                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                                                                                            <div className="font-medium">
                                                                                                {
                                                                                                    invoice.nbten
                                                                                                }
                                                                                            </div>
                                                                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                                                                {
                                                                                                    invoice.nbdchi
                                                                                                }
                                                                                            </div>
                                                                                        </td>
                                                                                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                                                                                            {invoice.tdlap
                                                                                                ? new Date(
                                                                                                      invoice.tdlap
                                                                                                  ).toLocaleDateString()
                                                                                                : "N/A"}
                                                                                        </td>
                                                                                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                                                                                            {invoice.tgtcthue?.toLocaleString()}{" "}
                                                                                            VND
                                                                                        </td>
                                                                                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                                                                                            {invoice.tgtthue?.toLocaleString()}{" "}
                                                                                            VND
                                                                                        </td>
                                                                                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                                                                                            {invoice.tgtttbso?.toLocaleString()}{" "}
                                                                                            VND
                                                                                        </td>
                                                                                        {invoiceResult.combinedResults && (
                                                                                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                                                                                                <span
                                                                                                    className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                                                                                        invoice.sourceStatus ===
                                                                                                        "5"
                                                                                                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200"
                                                                                                            : invoice.sourceStatus ===
                                                                                                              "6"
                                                                                                            ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200"
                                                                                                            : "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-200"
                                                                                                    }`}
                                                                                                >
                                                                                                    Status{" "}
                                                                                                    {
                                                                                                        invoice.sourceStatus
                                                                                                    }
                                                                                                </span>
                                                                                            </td>
                                                                                        )}
                                                                                    </tr>
                                                                                )
                                                                            )}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            </div>
                                                        )
                                                    );
                                                })()}

                                                {/* Raw JSON Data (Collapsible) */}
                                                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                                    <details className="group">
                                                        <summary className="cursor-pointer text-lg font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                                                            <span className="mr-2 transition-transform group-open:rotate-90">
                                                                ▶
                                                            </span>
                                                            🔍 Raw JSON Data
                                                        </summary>
                                                        <div className="bg-gray-900 dark:bg-gray-950 rounded-lg p-4 overflow-x-auto mt-3">
                                                            <pre className="text-green-400 text-sm font-mono">
                                                                {JSON.stringify(
                                                                    invoiceResult.data,
                                                                    null,
                                                                    2
                                                                )}
                                                            </pre>
                                                        </div>
                                                    </details>
                                                </div>
                                            </div>
                                        )}

                                    {/* Invoice Query Details */}
                                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                        <h4 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-3">
                                            🔍 Query Details
                                        </h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                                                <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                                                    Status
                                                </div>
                                                <div className="text-gray-800 dark:text-gray-200 font-semibold">
                                                    {invoiceResult.status ||
                                                        "N/A"}
                                                </div>
                                            </div>
                                            <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                                                <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                                                    Timestamp
                                                </div>
                                                <div className="text-gray-800 dark:text-gray-200 font-mono text-xs">
                                                    {invoiceResult.timestamp
                                                        ? new Date(
                                                              invoiceResult.timestamp
                                                          ).toLocaleString()
                                                        : "N/A"}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Raw Response Display */}
                {authResult && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                            📋 Raw Authentication Response
                        </h2>
                        <div className="bg-gray-900 dark:bg-gray-950 rounded-lg p-4 overflow-x-auto">
                            <pre className="text-green-400 text-sm font-mono">
                                {JSON.stringify(authResult, null, 2)}
                            </pre>
                        </div>
                    </div>
                )}

                {/* Quick Actions */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                        🚀 Quick Actions
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <button
                            type="button"
                            onClick={() => {
                                setAuthResult(null);
                                setAuthError(null);
                                handleFetchCaptcha();
                            }}
                            className="flex items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                        >
                            <span className="text-blue-600 dark:text-blue-400 text-xl mr-3">
                                🔄
                            </span>
                            <span className="text-blue-800 dark:text-blue-200 font-medium">
                                Try Again
                            </span>
                        </button>
                        <Link
                            href="/dashboard"
                            className="flex items-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                        >
                            <span className="text-purple-600 dark:text-purple-400 text-xl mr-3">
                                🎯
                            </span>
                            <span className="text-purple-800 dark:text-purple-200 font-medium">
                                Dashboard
                            </span>
                        </Link>
                        <Link
                            href="/captcha-fetcher"
                            className="flex items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                        >
                            <span className="text-green-600 dark:text-green-400 text-xl mr-3">
                                🌐
                            </span>
                            <span className="text-green-800 dark:text-green-200 font-medium">
                                Captcha Fetcher
                            </span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
