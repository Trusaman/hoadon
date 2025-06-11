"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
    fetchCaptchaToken,
    solveCaptcha,
    type CaptchaTokenResponse,
    type CaptchaSolverResult,
} from "@/lib/captcha-api";

export default function DashboardPage() {
    const [tokenData, setTokenData] = useState<CaptchaTokenResponse | null>(
        null
    );
    const [tokenLoading, setTokenLoading] = useState(true);
    const [tokenError, setTokenError] = useState<string | null>(null);

    const handleFetchCaptchaToken = async () => {
        try {
            setTokenLoading(true);
            setTokenError(null);

            const data = await fetchCaptchaToken();
            setTokenData(data);

            if (!data.success && data.error) {
                setTokenError(data.error);
            }
        } catch (err) {
            console.error("Error fetching captcha token:", err);
            setTokenError(
                err instanceof Error ? err.message : "Unknown error occurred"
            );
        } finally {
            setTokenLoading(false);
        }
    };

    useEffect(() => {
        handleFetchCaptchaToken();
    }, []);

    // Token content solving state
    const [tokenSolving, setTokenSolving] = useState(false);
    const [tokenSolverResult, setTokenSolverResult] =
        useState<CaptchaSolverResult | null>(null);
    const [tokenSolverError, setTokenSolverError] = useState<string | null>(
        null
    );

    // Solve token content function
    const handleSolveTokenContent = useCallback(async () => {
        if (!tokenData?.content) {
            setTokenSolverError("No SVG content available to solve");
            return;
        }

        setTokenSolving(true);
        setTokenSolverError(null);
        setTokenSolverResult(null);

        try {
            const result = await solveCaptcha(tokenData.content);
            setTokenSolverResult(result);

            if (!result.success && result.error) {
                setTokenSolverError(result.error);
            }
        } catch (error) {
            setTokenSolverError(
                error instanceof Error
                    ? error.message
                    : "Unknown error occurred while solving"
            );
        } finally {
            setTokenSolving(false);
        }
    }, [tokenData?.content]);

    // Auto-solve token content when available
    useEffect(() => {
        if (
            tokenData?.success &&
            tokenData.content &&
            !tokenSolving &&
            !tokenSolverResult
        ) {
            handleSolveTokenContent();
        }
    }, [
        tokenData?.content,
        tokenSolving,
        tokenSolverResult,
        handleSolveTokenContent,
    ]);

    const formatTimestamp = (timestamp: string) => {
        return new Date(timestamp).toLocaleString();
    };

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
                                🎯 Dashboard
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 mt-2">
                                Captcha Token Data from Vietnamese Tax Authority
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={handleFetchCaptchaToken}
                                disabled={tokenLoading}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {tokenLoading
                                    ? "🔄 Refreshing..."
                                    : "🔄 Refresh"}
                            </button>
                            <Link
                                href="/login"
                                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                            >
                                ← Back to Login
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Loading State */}
                {tokenLoading && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600 dark:text-gray-400">
                            Fetching captcha token data...
                        </p>
                    </div>
                )}

                {/* Error State */}
                {tokenError && !tokenLoading && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 mb-6">
                        <div className="flex items-center">
                            <div className="text-red-600 dark:text-red-400 text-xl mr-3">
                                ❌
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">
                                    Error Fetching Data
                                </h3>
                                <p className="text-red-600 dark:text-red-400 mt-1">
                                    {tokenError}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Success State - Display Token Data */}
                {tokenData && !tokenLoading && (
                    <div className="space-y-6">
                        {/* Main Data Display */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                                🔑 Captcha Token Data
                                {tokenData.success && (
                                    <span className="ml-2 px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 text-sm rounded-full">
                                        ✅ Success
                                    </span>
                                )}
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Key Display */}
                                <div className="space-y-3">
                                    <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">
                                        🔐 Key
                                    </h3>
                                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                        <code className="text-sm font-mono break-all">
                                            {tokenData.key || "null"}
                                        </code>
                                    </div>
                                </div>

                                {/* Content Display */}
                                <div className="space-y-3">
                                    <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">
                                        📄 Content (SVG)
                                    </h3>
                                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 max-h-40 overflow-y-auto">
                                        <code className="text-sm font-mono break-all">
                                            {tokenData.content || "null"}
                                        </code>
                                    </div>
                                </div>
                            </div>

                            {/* SVG Captcha Solver Section */}
                            {tokenData.content && (
                                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
                                    <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4 flex items-center">
                                        🧩 SVG Captcha Solver
                                        <button
                                            type="button"
                                            onClick={handleSolveTokenContent}
                                            disabled={tokenSolving}
                                            className={cn(
                                                "ml-4 px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200",
                                                "focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2",
                                                tokenSolving
                                                    ? "bg-gray-400 cursor-not-allowed text-white"
                                                    : "bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg"
                                            )}
                                        >
                                            {tokenSolving ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                    Solving...
                                                </div>
                                            ) : (
                                                "🔄 Re-solve"
                                            )}
                                        </button>
                                    </h3>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {/* SVG Preview */}
                                        <div>
                                            <h4 className="text-md font-medium text-gray-600 dark:text-gray-400 mb-3">
                                                SVG Preview
                                            </h4>
                                            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center bg-white dark:bg-gray-700">
                                                <div
                                                    dangerouslySetInnerHTML={{
                                                        __html: tokenData.content,
                                                    }}
                                                    className="flex justify-center items-center"
                                                />
                                            </div>
                                        </div>

                                        {/* Solved Text Display */}
                                        <div>
                                            <h4 className="text-md font-medium text-gray-600 dark:text-gray-400 mb-3">
                                                Solved Text
                                            </h4>
                                            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                                <div className="flex items-center gap-2">
                                                    {tokenSolving ? (
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                                            <span className="text-blue-600 dark:text-blue-400 text-sm">
                                                                Solving
                                                                captcha...
                                                            </span>
                                                        </div>
                                                    ) : tokenSolverResult?.success ? (
                                                        <div className="flex items-center gap-2 w-full">
                                                            <span className="font-mono text-2xl bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 px-4 py-2 rounded border border-green-200 dark:border-green-800 flex-1 text-center font-bold">
                                                                {
                                                                    tokenSolverResult.solvedText
                                                                }
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    copyToClipboard(
                                                                        tokenSolverResult?.solvedText ||
                                                                            ""
                                                                    )
                                                                }
                                                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                                                                title="Copy to clipboard"
                                                            >
                                                                📋
                                                            </button>
                                                        </div>
                                                    ) : tokenSolverError ? (
                                                        <span className="text-red-600 dark:text-red-400 text-sm">
                                                            ❌{" "}
                                                            {tokenSolverError}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-500 dark:text-gray-400 text-sm">
                                                            Auto-solving
                                                            captcha...
                                                        </span>
                                                    )}
                                                </div>
                                                {tokenSolverResult?.processingTime && (
                                                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                                        Processing time:{" "}
                                                        {tokenSolverResult.processingTime.toFixed(
                                                            2
                                                        )}
                                                        ms
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Metadata */}
                            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
                                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-3">
                                    📊 Metadata
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                                        <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                                            Status
                                        </div>
                                        <div className="text-blue-800 dark:text-blue-200 font-semibold">
                                            {tokenData.success
                                                ? "Success"
                                                : "Failed"}
                                        </div>
                                    </div>
                                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
                                        <div className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                                            Timestamp
                                        </div>
                                        <div className="text-purple-800 dark:text-purple-200 font-mono text-sm">
                                            {formatTimestamp(
                                                tokenData.timestamp
                                            )}
                                        </div>
                                    </div>
                                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                                        <div className="text-sm text-green-600 dark:text-green-400 font-medium">
                                            Has Key
                                        </div>
                                        <div className="text-green-800 dark:text-green-200 font-semibold">
                                            {tokenData.key ? "Yes" : "No"}
                                        </div>
                                    </div>
                                    <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3">
                                        <div className="text-sm text-orange-600 dark:text-orange-400 font-medium">
                                            Solved
                                        </div>
                                        <div className="text-orange-800 dark:text-orange-200 font-semibold">
                                            {tokenSolverResult?.success
                                                ? "Yes"
                                                : "No"}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Raw JSON Display */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                                📋 Raw JSON Response
                            </h2>
                            <div className="bg-gray-900 dark:bg-gray-950 rounded-lg p-4 overflow-x-auto">
                                <pre className="text-green-400 text-sm font-mono">
                                    {JSON.stringify(tokenData, null, 2)}
                                </pre>
                            </div>
                        </div>

                        {/* Navigation Links */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                                🔗 Quick Links
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <Link
                                    href="/authenticate"
                                    className="flex items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                                >
                                    <span className="text-green-600 dark:text-green-400 text-xl mr-3">
                                        🔐
                                    </span>
                                    <span className="text-green-800 dark:text-green-200 font-medium">
                                        Authenticate
                                    </span>
                                </Link>
                                <Link
                                    href="/captcha-fetcher"
                                    className="flex items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                                >
                                    <span className="text-blue-600 dark:text-blue-400 text-xl mr-3">
                                        🌐
                                    </span>
                                    <span className="text-blue-800 dark:text-blue-200 font-medium">
                                        Captcha Fetcher
                                    </span>
                                </Link>
                                <Link
                                    href="/captcha-solver"
                                    className="flex items-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                                >
                                    <span className="text-purple-600 dark:text-purple-400 text-xl mr-3">
                                        🧩
                                    </span>
                                    <span className="text-purple-800 dark:text-purple-200 font-medium">
                                        Captcha Solver
                                    </span>
                                </Link>
                                <Link
                                    href="/"
                                    className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                                >
                                    <span className="text-gray-600 dark:text-gray-400 text-xl mr-3">
                                        🏠
                                    </span>
                                    <span className="text-gray-800 dark:text-gray-200 font-medium">
                                        Home
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
