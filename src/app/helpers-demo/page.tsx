"use client";

import { useState, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";

// Import helper functions (we'll need to convert JS modules to work with TypeScript)
// For now, we'll create TypeScript-compatible versions

interface ValidationResult {
    isValid: boolean;
    error?: string;
}

interface ComplexityAnalysis {
    curves: number;
    lines: number;
    moves: number;
    complexity: "low" | "medium" | "high" | "veryHigh";
    totalCommands: number;
}

interface BoundingBox {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
}

export default function HelpersDemoPage() {
    const [activeTab, setActiveTab] = useState("core-utils");
    const [performanceMetrics, setPerformanceMetrics] = useState<
        Record<string, number>
    >({});

    // Performance monitoring utility
    const measurePerformance = useCallback((name: string, fn: () => any) => {
        const start = performance.now();
        const result = fn();
        const end = performance.now();
        setPerformanceMetrics((prev) => ({
            ...prev,
            [name]: end - start,
        }));
        return result;
    }, []);

    const tabs = [
        { id: "core-utils", label: "Core Utilities", icon: "🔧" },
        { id: "svg-processing", label: "SVG Processing", icon: "🎨" },
        { id: "performance", label: "Performance Utils", icon: "⚡" },
        { id: "validation", label: "Validation", icon: "✅" },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <header className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        Helper Functions Demonstration
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-6">
                        Interactive showcase of all utility functions available
                        in the src/lib/ directory. Test, explore, and understand
                        how each helper function works.
                    </p>

                    {/* Navigation Links */}
                    <div className="flex justify-center gap-4">
                        <a
                            href="/captcha-solver"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                        >
                            🔓 Try SVG Captcha Solver
                        </a>
                        <a
                            href="/"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                        >
                            🏠 Back to Home
                        </a>
                    </div>
                </header>

                {/* Navigation Tabs */}
                <nav className="flex flex-wrap justify-center gap-2 mb-8">
                    {tabs.map((tab) => (
                        <button
                            type="button"
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200",
                                "hover:shadow-md transform hover:-translate-y-0.5",
                                activeTab === tab.id
                                    ? "bg-blue-600 text-white shadow-lg"
                                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                            )}
                        >
                            <span className="text-xl">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </nav>

                {/* Performance Metrics Display */}
                {Object.keys(performanceMetrics).length > 0 && (
                    <div className="mb-8 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                        <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
                            ⚡ Performance Metrics
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {Object.entries(performanceMetrics).map(
                                ([name, time]) => (
                                    <div
                                        key={name}
                                        className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded"
                                    >
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {name}
                                        </span>
                                        <span className="text-sm text-blue-600 dark:text-blue-400 font-mono">
                                            {time.toFixed(3)}ms
                                        </span>
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                )}

                {/* Demo Content */}
                <main className="space-y-8">
                    {activeTab === "core-utils" && (
                        <CoreUtilsDemo
                            measurePerformance={measurePerformance}
                        />
                    )}
                    {activeTab === "svg-processing" && (
                        <SVGProcessingDemo
                            measurePerformance={measurePerformance}
                        />
                    )}
                    {activeTab === "performance" && (
                        <PerformanceDemo
                            measurePerformance={measurePerformance}
                        />
                    )}
                    {activeTab === "validation" && (
                        <ValidationDemo
                            measurePerformance={measurePerformance}
                        />
                    )}
                </main>
            </div>
        </div>
    );
}

// Core Utilities Demo Component
function CoreUtilsDemo({
    measurePerformance,
}: {
    measurePerformance: (name: string, fn: () => any) => any;
}) {
    const [classInputs, setClassInputs] = useState([
        "bg-blue-500",
        "text-white",
        "px-4 py-2",
        "rounded-lg",
    ]);
    const [conditionalClasses, setConditionalClasses] = useState({
        isActive: true,
        isDisabled: false,
        size: "large",
    });
    const [mergedResult, setMergedResult] = useState("");

    const demonstrateCnFunction = useCallback(() => {
        const result = measurePerformance("cn-function", () => {
            return cn(...classInputs, {
                "opacity-50 cursor-not-allowed": conditionalClasses.isDisabled,
                "ring-2 ring-blue-300": conditionalClasses.isActive,
                "text-sm": conditionalClasses.size === "small",
                "text-lg": conditionalClasses.size === "large",
            });
        });
        setMergedResult(result);
    }, [classInputs, conditionalClasses, measurePerformance]);

    useEffect(() => {
        demonstrateCnFunction();
    }, [demonstrateCnFunction]);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                🔧 Core Utilities - cn() Function
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Input Section */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Base Classes (one per line):
                        </label>
                        <textarea
                            value={classInputs.join("\n")}
                            onChange={(e) =>
                                setClassInputs(
                                    e.target.value.split("\n").filter(Boolean)
                                )
                            }
                            className="w-full h-32 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                            placeholder="Enter CSS classes..."
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Conditional Classes:
                        </label>

                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="isActive"
                                checked={conditionalClasses.isActive}
                                onChange={(e) =>
                                    setConditionalClasses((prev) => ({
                                        ...prev,
                                        isActive: e.target.checked,
                                    }))
                                }
                                className="rounded"
                            />
                            <label
                                htmlFor="isActive"
                                className="text-sm text-gray-700 dark:text-gray-300"
                            >
                                Active (adds ring-2 ring-blue-300)
                            </label>
                        </div>

                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="isDisabled"
                                checked={conditionalClasses.isDisabled}
                                onChange={(e) =>
                                    setConditionalClasses((prev) => ({
                                        ...prev,
                                        isDisabled: e.target.checked,
                                    }))
                                }
                                className="rounded"
                            />
                            <label
                                htmlFor="isDisabled"
                                className="text-sm text-gray-700 dark:text-gray-300"
                            >
                                Disabled (adds opacity-50 cursor-not-allowed)
                            </label>
                        </div>

                        <div className="flex items-center gap-3">
                            <label className="text-sm text-gray-700 dark:text-gray-300">
                                Size:
                            </label>
                            <select
                                value={conditionalClasses.size}
                                onChange={(e) =>
                                    setConditionalClasses((prev) => ({
                                        ...prev,
                                        size: e.target.value,
                                    }))
                                }
                                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                title="Select button size"
                            >
                                <option value="small">Small</option>
                                <option value="large">Large</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Output Section */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Merged Result:
                        </label>
                        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border">
                            <code className="text-sm text-gray-900 dark:text-white font-mono break-all">
                                {mergedResult}
                            </code>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Live Preview:
                        </label>
                        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <button type="button" className={mergedResult}>
                                Sample Button
                            </button>
                        </div>
                    </div>

                    <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                        <p>
                            <strong>Function:</strong> cn(...inputs:
                            ClassValue[])
                        </p>
                        <p>
                            <strong>Purpose:</strong> Merges and deduplicates
                            Tailwind CSS classes
                        </p>
                        <p>
                            <strong>Dependencies:</strong> clsx, tailwind-merge
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// SVG Processing Demo Component
function SVGProcessingDemo({
    measurePerformance,
}: {
    measurePerformance: (name: string, fn: () => any) => any;
}) {
    const [svgInput, setSvgInput] =
        useState(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="40" viewBox="0,0,200,40">
  <path d="M17 27 C115 17,93 3,180 32" stroke="#777" fill="none"/>
  <path d="M9 3 C89 3,114 22,186 24" stroke="#666" fill="none"/>
  <path d="M10 10 L20 20 L30 10 Z" fill="black"/>
</svg>`);
    const [analysisResult, setAnalysisResult] =
        useState<ComplexityAnalysis | null>(null);
    const [boundingBox, setBoundingBox] = useState<BoundingBox | null>(null);
    const [validationResult, setValidationResult] =
        useState<ValidationResult | null>(null);

    // Simplified SVG validation function (based on the original Utils.validateSVGInput)
    const validateSVGInput = useCallback((input: string): ValidationResult => {
        if (!input || input.trim().length === 0) {
            return { isValid: false, error: "SVG input cannot be empty" };
        }

        if (!input.includes("<svg")) {
            return {
                isValid: false,
                error: "Input must contain an SVG element",
            };
        }

        if (!input.includes('xmlns="http://www.w3.org/2000/svg"')) {
            return {
                isValid: false,
                error: "SVG must include proper namespace declaration",
            };
        }

        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(input, "image/svg+xml");
            const parseError = doc.querySelector("parsererror");

            if (parseError) {
                return { isValid: false, error: "Invalid SVG syntax" };
            }

            return { isValid: true };
        } catch (error) {
            return { isValid: false, error: "Failed to parse SVG" };
        }
    }, []);

    // Simplified complexity analysis (based on SVGAnalyzer.analyzeComplexity)
    const analyzeComplexity = useCallback(
        (pathData: string): ComplexityAnalysis => {
            const curves = (pathData.match(/[CcSsQqTtAa]/g) || []).length;
            const lines = (pathData.match(/[LlHhVv]/g) || []).length;
            const moves = (pathData.match(/[Mm]/g) || []).length;
            const totalCommands = curves + lines + moves;

            let complexity: "low" | "medium" | "high" | "veryHigh" = "low";
            if (curves >= 5 || totalCommands >= 15) complexity = "veryHigh";
            else if (curves >= 3 || totalCommands >= 10) complexity = "high";
            else if (curves >= 1 || totalCommands >= 5) complexity = "medium";

            return { curves, lines, moves, complexity, totalCommands };
        },
        []
    );

    // Simplified bounding box calculation
    const calculateBoundingBox = useCallback(
        (pathData: string): BoundingBox => {
            const numbers = pathData.match(/[\d.-]+/g) || [];
            const coords = numbers
                .map((n) => parseFloat(n))
                .filter((n) => !isNaN(n));

            if (coords.length === 0) {
                return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
            }

            let minX = coords[0],
                maxX = coords[0],
                minY = coords[1] || 0,
                maxY = coords[1] || 0;

            for (let i = 0; i < coords.length; i += 2) {
                if (i + 1 < coords.length) {
                    minX = Math.min(minX, coords[i]);
                    maxX = Math.max(maxX, coords[i]);
                    minY = Math.min(minY, coords[i + 1]);
                    maxY = Math.max(maxY, coords[i + 1]);
                }
            }

            return { minX, minY, maxX, maxY };
        },
        []
    );

    const analyzeSVG = useCallback(() => {
        const validation = measurePerformance("svg-validation", () =>
            validateSVGInput(svgInput)
        );
        setValidationResult(validation);

        if (validation.isValid) {
            try {
                const parser = new DOMParser();
                const doc = parser.parseFromString(svgInput, "image/svg+xml");
                const paths = doc.querySelectorAll("path");

                if (paths.length > 0) {
                    const firstPath = paths[0].getAttribute("d") || "";

                    const complexity = measurePerformance(
                        "complexity-analysis",
                        () => analyzeComplexity(firstPath)
                    );
                    const bbox = measurePerformance("bounding-box", () =>
                        calculateBoundingBox(firstPath)
                    );

                    setAnalysisResult(complexity);
                    setBoundingBox(bbox);
                }
            } catch (error) {
                console.error("Analysis error:", error);
            }
        } else {
            setAnalysisResult(null);
            setBoundingBox(null);
        }
    }, [
        svgInput,
        validateSVGInput,
        analyzeComplexity,
        calculateBoundingBox,
        measurePerformance,
    ]);

    useEffect(() => {
        analyzeSVG();
    }, [analyzeSVG]);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                🎨 SVG Processing & Analysis
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Input Section */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            SVG Input:
                        </label>
                        <textarea
                            value={svgInput}
                            onChange={(e) => setSvgInput(e.target.value)}
                            className="w-full h-48 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                            placeholder="Enter SVG markup..."
                        />
                    </div>

                    <button
                        type="button"
                        onClick={analyzeSVG}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Analyze SVG
                    </button>

                    {/* Validation Status */}
                    <div
                        className={cn(
                            "p-3 rounded-lg border",
                            validationResult?.isValid
                                ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                                : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                        )}
                    >
                        <div className="flex items-center gap-2">
                            <span className="text-lg">
                                {validationResult?.isValid ? "✅" : "❌"}
                            </span>
                            <span
                                className={cn(
                                    "font-medium",
                                    validationResult?.isValid
                                        ? "text-green-800 dark:text-green-200"
                                        : "text-red-800 dark:text-red-200"
                                )}
                            >
                                {validationResult?.isValid
                                    ? "Valid SVG"
                                    : "Invalid SVG"}
                            </span>
                        </div>
                        {validationResult?.error && (
                            <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                                {validationResult.error}
                            </p>
                        )}
                    </div>
                </div>

                {/* Results Section */}
                <div className="space-y-4">
                    {/* SVG Preview */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            SVG Preview:
                        </label>
                        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border min-h-[100px] flex items-center justify-center">
                            {validationResult?.isValid ? (
                                <div
                                    dangerouslySetInnerHTML={{
                                        __html: svgInput,
                                    }}
                                />
                            ) : (
                                <span className="text-gray-500 dark:text-gray-400">
                                    Invalid SVG
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Complexity Analysis */}
                    {analysisResult && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Complexity Analysis:
                            </label>
                            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-2">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        Curves:{" "}
                                        <span className="font-mono">
                                            {analysisResult.curves}
                                        </span>
                                    </div>
                                    <div>
                                        Lines:{" "}
                                        <span className="font-mono">
                                            {analysisResult.lines}
                                        </span>
                                    </div>
                                    <div>
                                        Moves:{" "}
                                        <span className="font-mono">
                                            {analysisResult.moves}
                                        </span>
                                    </div>
                                    <div>
                                        Total:{" "}
                                        <span className="font-mono">
                                            {analysisResult.totalCommands}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span>Complexity:</span>
                                    <span
                                        className={cn(
                                            "px-2 py-1 rounded text-xs font-medium",
                                            analysisResult.complexity ===
                                                "low" &&
                                                "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200",
                                            analysisResult.complexity ===
                                                "medium" &&
                                                "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200",
                                            analysisResult.complexity ===
                                                "high" &&
                                                "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-200",
                                            analysisResult.complexity ===
                                                "veryHigh" &&
                                                "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200"
                                        )}
                                    >
                                        {analysisResult.complexity}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Bounding Box */}
                    {boundingBox && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Bounding Box:
                            </label>
                            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <div className="grid grid-cols-2 gap-2 text-sm font-mono">
                                    <div>
                                        minX: {boundingBox.minX.toFixed(2)}
                                    </div>
                                    <div>
                                        maxX: {boundingBox.maxX.toFixed(2)}
                                    </div>
                                    <div>
                                        minY: {boundingBox.minY.toFixed(2)}
                                    </div>
                                    <div>
                                        maxY: {boundingBox.maxY.toFixed(2)}
                                    </div>
                                </div>
                                <div className="mt-2 text-sm">
                                    Dimensions:{" "}
                                    {(
                                        boundingBox.maxX - boundingBox.minX
                                    ).toFixed(2)}{" "}
                                    ×{" "}
                                    {(
                                        boundingBox.maxY - boundingBox.minY
                                    ).toFixed(2)}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                        <p>
                            <strong>Functions:</strong> validateSVGInput(),
                            analyzeComplexity(), calculateBoundingBox()
                        </p>
                        <p>
                            <strong>Purpose:</strong> SVG validation, complexity
                            analysis, and geometric calculations
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Performance Demo Component
function PerformanceDemo({
    measurePerformance,
}: {
    measurePerformance: (name: string, fn: () => any) => any;
}) {
    const [inputText, setInputText] = useState(
        "Hello World! This is a test string for performance testing."
    );
    const [debounceDelay, setDebounceDelay] = useState(300);
    const [throttleLimit, setThrottleLimit] = useState(100);
    const [debouncedValue, setDebouncedValue] = useState("");
    const [throttledCount, setThrottledCount] = useState(0);
    const [callCounts, setCallCounts] = useState({
        debounce: 0,
        throttle: 0,
        normal: 0,
    });

    // Debounce implementation (based on Utils.debounce)
    const debounce = useCallback(
        (func: Function, wait: number, immediate = false) => {
            let timeout: NodeJS.Timeout;
            return function executedFunction(...args: any[]) {
                const later = () => {
                    timeout = null as any;
                    if (!immediate) func.apply(this, args);
                };

                const callNow = immediate && !timeout;
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);

                if (callNow) func.apply(this, args);
            };
        },
        []
    );

    // Throttle implementation (based on Utils.throttle)
    const throttle = useCallback((func: Function, limit: number) => {
        let inThrottle: boolean;
        return function (this: any, ...args: any[]) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => (inThrottle = false), limit);
            }
        };
    }, []);

    // Create debounced function
    const debouncedUpdate = useCallback(
        debounce((value: string) => {
            measurePerformance("debounced-update", () => {
                setDebouncedValue(value);
                setCallCounts((prev) => ({
                    ...prev,
                    debounce: prev.debounce + 1,
                }));
            });
        }, debounceDelay),
        [debounceDelay, measurePerformance, debounce]
    );

    // Create throttled function
    const throttledUpdate = useCallback(
        throttle(() => {
            measurePerformance("throttled-update", () => {
                setThrottledCount((prev) => prev + 1);
                setCallCounts((prev) => ({
                    ...prev,
                    throttle: prev.throttle + 1,
                }));
            });
        }, throttleLimit),
        [throttleLimit, measurePerformance, throttle]
    );

    // Normal function for comparison
    const normalUpdate = useCallback(() => {
        measurePerformance("normal-update", () => {
            setCallCounts((prev) => ({ ...prev, normal: prev.normal + 1 }));
        });
    }, [measurePerformance]);

    useEffect(() => {
        debouncedUpdate(inputText);
    }, [inputText, debouncedUpdate]);

    const resetCounters = () => {
        setCallCounts({ debounce: 0, throttle: 0, normal: 0 });
        setThrottledCount(0);
        setDebouncedValue("");
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                ⚡ Performance Utilities - Debounce & Throttle
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Controls Section */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Test Input (triggers debounce):
                        </label>
                        <textarea
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            className="w-full h-24 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="Type to test debouncing..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Debounce Delay (ms):
                            </label>
                            <input
                                type="number"
                                value={debounceDelay}
                                onChange={(e) =>
                                    setDebounceDelay(Number(e.target.value))
                                }
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                min="0"
                                max="2000"
                                title="Debounce delay in milliseconds"
                                placeholder="300"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Throttle Limit (ms):
                            </label>
                            <input
                                type="number"
                                value={throttleLimit}
                                onChange={(e) =>
                                    setThrottleLimit(Number(e.target.value))
                                }
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                min="0"
                                max="2000"
                                title="Throttle limit in milliseconds"
                                placeholder="100"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <button
                            type="button"
                            onClick={throttledUpdate}
                            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                            Test Throttle (Click rapidly)
                        </button>

                        <button
                            type="button"
                            onClick={normalUpdate}
                            className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        >
                            Normal Function (No throttling)
                        </button>

                        <button
                            type="button"
                            onClick={resetCounters}
                            className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                            Reset Counters
                        </button>
                    </div>
                </div>

                {/* Results Section */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Debounced Output:
                        </label>
                        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border min-h-[60px]">
                            <p className="text-sm text-gray-900 dark:text-white break-words">
                                {debouncedValue ||
                                    "Waiting for debounced input..."}
                            </p>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Function Call Counts:
                        </label>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                                <span className="text-sm font-medium">
                                    Debounce Calls:
                                </span>
                                <span className="text-lg font-mono text-blue-600 dark:text-blue-400">
                                    {callCounts.debounce}
                                </span>
                            </div>
                            <div className="flex justify-between items-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
                                <span className="text-sm font-medium">
                                    Throttle Calls:
                                </span>
                                <span className="text-lg font-mono text-green-600 dark:text-green-400">
                                    {callCounts.throttle}
                                </span>
                            </div>
                            <div className="flex justify-between items-center p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
                                <span className="text-sm font-medium">
                                    Normal Calls:
                                </span>
                                <span className="text-lg font-mono text-purple-600 dark:text-purple-400">
                                    {callCounts.normal}
                                </span>
                            </div>
                            <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                <span className="text-sm font-medium">
                                    Throttled Counter:
                                </span>
                                <span className="text-lg font-mono text-gray-600 dark:text-gray-400">
                                    {throttledCount}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                        <p>
                            <strong>Functions:</strong> debounce(), throttle()
                        </p>
                        <p>
                            <strong>Purpose:</strong> Performance optimization
                            by limiting function execution frequency
                        </p>
                        <p>
                            <strong>Debounce:</strong> Delays execution until
                            after calls have stopped
                        </p>
                        <p>
                            <strong>Throttle:</strong> Limits execution to once
                            per time period
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Validation Demo Component
function ValidationDemo({
    measurePerformance,
}: {
    measurePerformance: (name: string, fn: () => any) => any;
}) {
    const [testInputs, setTestInputs] = useState({
        validSVG: `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="50"><rect x="10" y="10" width="30" height="30" fill="blue"/></svg>`,
        invalidSVG: `<svg width="100" height="50"><rect x="10" y="10" width="30" height="30" fill="blue"/></svg>`,
        malformedSVG: `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="50"><rect x="10" y="10" width="30" height="30" fill="blue"</svg>`,
        emptySVG: "",
        customInput: "",
    });

    const [validationResults, setValidationResults] = useState<
        Record<string, ValidationResult>
    >({});
    const [selectedTest, setSelectedTest] = useState("validSVG");

    // Enhanced validation function with more comprehensive checks
    const validateInput = useCallback(
        (input: string, type: "svg" | "general" = "svg"): ValidationResult => {
            if (type === "svg") {
                // SVG-specific validation
                if (!input || input.trim().length === 0) {
                    return {
                        isValid: false,
                        error: "SVG input cannot be empty",
                    };
                }

                if (!input.includes("<svg")) {
                    return {
                        isValid: false,
                        error: "Input must contain an SVG element",
                    };
                }

                if (!input.includes('xmlns="http://www.w3.org/2000/svg"')) {
                    return {
                        isValid: false,
                        error: "SVG must include proper namespace declaration",
                    };
                }

                if (!input.includes("</svg>")) {
                    return {
                        isValid: false,
                        error: "SVG element must be properly closed",
                    };
                }

                // Check for basic SVG structure
                const svgTagMatch = input.match(/<svg[^>]*>/);
                if (!svgTagMatch) {
                    return { isValid: false, error: "Invalid SVG opening tag" };
                }

                // Check for required attributes
                const svgTag = svgTagMatch[0];
                if (!svgTag.includes("width") || !svgTag.includes("height")) {
                    return {
                        isValid: false,
                        error: "SVG must have width and height attributes",
                    };
                }

                try {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(input, "image/svg+xml");
                    const parseError = doc.querySelector("parsererror");

                    if (parseError) {
                        return {
                            isValid: false,
                            error:
                                "Invalid SVG syntax: " +
                                parseError.textContent?.substring(0, 100),
                        };
                    }

                    const svgElement = doc.querySelector("svg");
                    if (!svgElement) {
                        return {
                            isValid: false,
                            error: "No valid SVG element found",
                        };
                    }

                    return { isValid: true };
                } catch (error) {
                    return {
                        isValid: false,
                        error:
                            "Failed to parse SVG: " + (error as Error).message,
                    };
                }
            } else {
                // General validation
                if (!input || input.trim().length === 0) {
                    return { isValid: false, error: "Input cannot be empty" };
                }

                if (input.length > 10000) {
                    return {
                        isValid: false,
                        error: "Input too long (max 10,000 characters)",
                    };
                }

                return { isValid: true };
            }
        },
        []
    );

    // Run validation on all test inputs
    const runAllValidations = useCallback(() => {
        const results: Record<string, ValidationResult> = {};

        Object.entries(testInputs).forEach(([key, value]) => {
            results[key] = measurePerformance(`validation-${key}`, () =>
                validateInput(value, key.includes("SVG") ? "svg" : "general")
            );
        });

        setValidationResults(results);
    }, [testInputs, validateInput, measurePerformance]);

    useEffect(() => {
        runAllValidations();
    }, [runAllValidations]);

    const testCases = [
        {
            key: "validSVG",
            label: "Valid SVG",
            description: "Properly formatted SVG with all required attributes",
        },
        {
            key: "invalidSVG",
            label: "Invalid SVG",
            description: "Missing namespace declaration",
        },
        {
            key: "malformedSVG",
            label: "Malformed SVG",
            description: "Unclosed tags and syntax errors",
        },
        {
            key: "emptySVG",
            label: "Empty Input",
            description: "Empty string validation",
        },
        {
            key: "customInput",
            label: "Custom Input",
            description: "Test your own SVG input",
        },
    ];

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                ✅ Input Validation & Error Handling
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Test Cases Section */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Select Test Case:
                        </label>
                        <select
                            value={selectedTest}
                            onChange={(e) => setSelectedTest(e.target.value)}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            title="Select a test case to examine"
                        >
                            {testCases.map((testCase) => (
                                <option key={testCase.key} value={testCase.key}>
                                    {testCase.label}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {
                                testCases.find((tc) => tc.key === selectedTest)
                                    ?.description
                            }
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Test Input:
                        </label>
                        <textarea
                            value={
                                testInputs[
                                    selectedTest as keyof typeof testInputs
                                ]
                            }
                            onChange={(e) =>
                                setTestInputs((prev) => ({
                                    ...prev,
                                    [selectedTest]: e.target.value,
                                }))
                            }
                            className="w-full h-48 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                            placeholder="Enter test input..."
                        />
                    </div>

                    <button
                        type="button"
                        onClick={runAllValidations}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Run Validation Tests
                    </button>
                </div>

                {/* Results Section */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Validation Results:
                        </label>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {testCases.map((testCase) => {
                                const result = validationResults[testCase.key];
                                if (!result) return null;

                                return (
                                    <div
                                        key={testCase.key}
                                        className={cn(
                                            "p-3 rounded-lg border",
                                            result.isValid
                                                ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                                                : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                                        )}
                                    >
                                        <div className="flex items-start gap-2">
                                            <span className="text-lg mt-0.5">
                                                {result.isValid ? "✅" : "❌"}
                                            </span>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className={cn(
                                                            "font-medium text-sm",
                                                            result.isValid
                                                                ? "text-green-800 dark:text-green-200"
                                                                : "text-red-800 dark:text-red-200"
                                                        )}
                                                    >
                                                        {testCase.label}
                                                    </span>
                                                    {selectedTest ===
                                                        testCase.key && (
                                                        <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 text-xs rounded">
                                                            Selected
                                                        </span>
                                                    )}
                                                </div>
                                                {result.error && (
                                                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                                                        {result.error}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                        <p>
                            <strong>Function:</strong> validateInput()
                        </p>
                        <p>
                            <strong>Purpose:</strong> Comprehensive input
                            validation with detailed error reporting
                        </p>
                        <p>
                            <strong>Features:</strong> SVG structure validation,
                            namespace checking, syntax parsing
                        </p>
                        <p>
                            <strong>Error Handling:</strong> Descriptive error
                            messages for debugging
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
