"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
    fetchCaptcha,
    solveCaptcha,
    isValidCaptchaResponse,
    queryInvoices,
    type CaptchaResponse,
    type CaptchaSolverResult,
    type InvoiceQueryResponse,
} from "@/lib/captcha-api";

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
                handleSolveCaptcha(response.data.rawSvg);
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
        if (!authResult?.token) {
            setInvoiceError("No authentication token available");
            return;
        }

        setQueryingInvoices(true);
        setInvoiceError(null);
        setInvoiceResult(null);

        try {
            const response = await queryInvoices({
                token: authResult.token,
                queryParams: {
                    sort: "tdlap:desc,khmshdon:asc,shdon:desc",
                    size: "15",
                    search: "tdlap=ge=06/01/2025T00:00:00;tdlap=le=07/01/2025T23:59:59;ttxly==5",
                },
            });

            setInvoiceResult(response);

            if (!response.success) {
                setInvoiceError(response.error || "Invoice query failed");
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

    // Auto-fetch captcha on load
    useEffect(() => {
        handleFetchCaptcha();
    }, []);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
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

                        {/* Invoice Query Section */}
                        {authResult.success && authResult.token && (
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
                                            Query invoices from the Vietnamese
                                            Tax Authority using your
                                            authenticated token. This will
                                            search for invoices from 06/01/2025
                                            to 07/01/2025 with status 5.
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleQueryInvoices}
                                        disabled={queryingInvoices}
                                        className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
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

                                    {/* Invoice Error Display */}
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
                                                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                                        <h4 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-3">
                                                            📊 Invoice Data
                                                        </h4>
                                                        <div className="bg-gray-900 dark:bg-gray-950 rounded-lg p-4 overflow-x-auto">
                                                            <pre className="text-green-400 text-sm font-mono">
                                                                {JSON.stringify(
                                                                    invoiceResult.data,
                                                                    null,
                                                                    2
                                                                )}
                                                            </pre>
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
                )}
            </div>
        </div>
    );
}
