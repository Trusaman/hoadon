"use client";

import { useState, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
    fetchCaptcha,
    isValidCaptchaResponse,
    getErrorMessage,
    formatFileSize,
    formatTimestamp,
    type CaptchaResponse,
} from "@/lib/captcha-api";

interface CaptchaState {
    loading: boolean;
    data: CaptchaResponse | null;
    error: string | null;
    lastFetched: string | null;
}

export default function CaptchaFetcher() {
    const [captchaState, setCaptchaState] = useState<CaptchaState>({
        loading: false,
        data: null,
        error: null,
        lastFetched: null,
    });

    const [autoRefresh, setAutoRefresh] = useState(false);
    const [refreshInterval, setRefreshInterval] = useState(30); // seconds

    // Fetch captcha function
    const handleFetchCaptcha = useCallback(async () => {
        setCaptchaState((prev) => ({
            ...prev,
            loading: true,
            error: null,
        }));

        try {
            const response = await fetchCaptcha();

            if (response.success && isValidCaptchaResponse(response)) {
                setCaptchaState({
                    loading: false,
                    data: response,
                    error: null,
                    lastFetched: new Date().toISOString(),
                });
            } else {
                setCaptchaState({
                    loading: false,
                    data: null,
                    error: response.error || "Failed to fetch captcha",
                    lastFetched: null,
                });
            }
        } catch (error) {
            setCaptchaState({
                loading: false,
                data: null,
                error:
                    error instanceof Error
                        ? error.message
                        : "Unknown error occurred",
                lastFetched: null,
            });
        }
    }, []);

    // Auto-refresh effect
    useEffect(() => {
        let intervalId: NodeJS.Timeout;

        if (autoRefresh && refreshInterval > 0) {
            intervalId = setInterval(() => {
                handleFetchCaptcha();
            }, refreshInterval * 1000);
        }

        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [autoRefresh, refreshInterval, handleFetchCaptcha]);

    // Initial fetch on component mount
    useEffect(() => {
        handleFetchCaptcha();
    }, [handleFetchCaptcha]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        Vietnamese Tax Authority Captcha Fetcher
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                        Fetch and display captcha images from the Vietnamese tax
                        authority's system (hoadondientu.gdt.gov.vn). This tool
                        helps developers test captcha integration.
                    </p>
                </div>

                {/* Controls */}
                <div className="max-w-4xl mx-auto mb-8">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                            {/* Fetch Button */}
                            <button
                                type="button"
                                onClick={handleFetchCaptcha}
                                disabled={captchaState.loading}
                                className={cn(
                                    "px-6 py-3 rounded-lg font-medium transition-all duration-200",
                                    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                                    captchaState.loading
                                        ? "bg-gray-400 cursor-not-allowed text-white"
                                        : "bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg"
                                )}
                            >
                                {captchaState.loading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Fetching...
                                    </div>
                                ) : (
                                    "🔄 Fetch New Captcha"
                                )}
                            </button>

                            {/* Auto-refresh Controls */}
                            <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                    <input
                                        type="checkbox"
                                        checked={autoRefresh}
                                        onChange={(e) =>
                                            setAutoRefresh(e.target.checked)
                                        }
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    Auto-refresh
                                </label>

                                {autoRefresh && (
                                    <select
                                        value={refreshInterval}
                                        onChange={(e) =>
                                            setRefreshInterval(
                                                Number(e.target.value)
                                            )
                                        }
                                        title="Auto-refresh interval"
                                        aria-label="Auto-refresh interval"
                                        className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    >
                                        <option value={10}>10s</option>
                                        <option value={30}>30s</option>
                                        <option value={60}>1m</option>
                                        <option value={300}>5m</option>
                                    </select>
                                )}
                            </div>
                        </div>

                        {/* Status Info */}
                        {captchaState.lastFetched && (
                            <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                                Last fetched:{" "}
                                {formatTimestamp(captchaState.lastFetched)}
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Content */}
                <div className="max-w-4xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Captcha Display */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                                Captcha Image
                            </h2>

                            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center min-h-[200px] flex items-center justify-center">
                                {captchaState.loading ? (
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                        <p className="text-gray-600 dark:text-gray-400">
                                            Loading captcha...
                                        </p>
                                    </div>
                                ) : captchaState.error ? (
                                    <div className="text-center">
                                        <div className="text-red-500 text-4xl mb-2">
                                            ⚠️
                                        </div>
                                        <p className="text-red-600 dark:text-red-400 font-medium mb-2">
                                            Error
                                        </p>
                                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                                            {getErrorMessage(
                                                captchaState.error
                                            )}
                                        </p>
                                    </div>
                                ) : captchaState.data?.data ? (
                                    <div className="w-full">
                                        <img
                                            src={captchaState.data.data.image}
                                            alt="Vietnamese Tax Authority Captcha"
                                            className="max-w-full h-auto mx-auto border border-gray-200 dark:border-gray-600 rounded [image-rendering:pixelated]"
                                        />
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        <div className="text-gray-400 text-4xl mb-2">
                                            🖼️
                                        </div>
                                        <p className="text-gray-600 dark:text-gray-400">
                                            Click "Fetch New Captcha" to load an
                                            image
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Metadata */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                                Image Information
                            </h2>

                            {captchaState.data?.data ? (
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-600">
                                        <span className="text-gray-600 dark:text-gray-400">
                                            Content Type:
                                        </span>
                                        <span className="font-mono text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                            {captchaState.data.data.contentType}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-600">
                                        <span className="text-gray-600 dark:text-gray-400">
                                            File Size:
                                        </span>
                                        <span className="font-mono text-sm">
                                            {formatFileSize(
                                                captchaState.data.data.size
                                            )}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-600">
                                        <span className="text-gray-600 dark:text-gray-400">
                                            Timestamp:
                                        </span>
                                        <span className="font-mono text-sm">
                                            {formatTimestamp(
                                                captchaState.data.data.timestamp
                                            )}
                                        </span>
                                    </div>
                                    {captchaState.data.data.key && (
                                        <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-600">
                                            <span className="text-gray-600 dark:text-gray-400">
                                                Captcha Key:
                                            </span>
                                            <span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded max-w-[200px] truncate">
                                                {captchaState.data.data.key}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-gray-600 dark:text-gray-400">
                                            Status:
                                        </span>
                                        <span className="text-green-600 dark:text-green-400 font-medium">
                                            ✅ Successfully loaded
                                        </span>
                                    </div>
                                    {captchaState.data.data.rawSvg && (
                                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                                            <details className="group">
                                                <summary className="cursor-pointer text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                                                    🔍 View Raw SVG (Debug)
                                                </summary>
                                                <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded text-xs font-mono overflow-auto max-h-32">
                                                    <pre className="whitespace-pre-wrap break-all">
                                                        {
                                                            captchaState.data
                                                                .data.rawSvg
                                                        }
                                                    </pre>
                                                </div>
                                            </details>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <div className="text-gray-400 text-3xl mb-2">
                                        📊
                                    </div>
                                    <p className="text-gray-600 dark:text-gray-400">
                                        Image metadata will appear here after
                                        fetching a captcha
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <div className="max-w-4xl mx-auto mt-8 text-center">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Explore More Tools
                        </h3>
                        <div className="flex flex-wrap justify-center gap-4">
                            <a
                                href="/helpers-demo"
                                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            >
                                📚 Helper Functions Demo
                            </a>
                            <a
                                href="/captcha-solver"
                                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            >
                                🧩 SVG Captcha Solver
                            </a>
                            <a
                                href="/"
                                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            >
                                🏠 Home
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
