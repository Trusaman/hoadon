"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { CaptchaSolver } from "./svg-captcha-solver";

interface ValidationResult {
    isValid: boolean;
    error?: string;
}

interface ExampleCaptcha {
    id: string;
    name: string;
    description: string;
    svg: string;
    expectedResult?: string;
}

export default function CaptchaSolverPage() {
    const [svgInput, setSvgInput] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [validationResult, setValidationResult] =
        useState<ValidationResult | null>(null);
    const [solverResult, setSolverResult] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const [selectedExample, setSelectedExample] = useState<string>("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Example captchas for testing - designed to work with the actual CaptchaSolver algorithm
    const exampleCaptchas: ExampleCaptcha[] = [
        {
            id: "example1",
            name: "Simple Numbers",
            description: "Basic SVG captcha with number patterns (1, 7, 4)",
            svg: `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="40" viewBox="0,0,200,40">
        <path d="M 10 20 l 10 20 L 20 20" fill="black"/>
        <path d="M 50 15 L 60 15 L 70 25" fill="black"/>
        <path d="M 90 10 L 100 10 L 110 20 L 120 20" fill="black"/>
      </svg>`,
            expectedResult: "174",
        },
        {
            id: "example2",
            name: "Mixed Characters",
            description: "SVG with letters and numbers (0, 1, O, P)",
            svg: `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="40" viewBox="0,0,240,40">
        <path d="M 15 20 C 25 10 35 10 45 20 Z" fill="black"/>
        <path d="M 55 15 l 10 20 L 65 15" fill="black"/>
        <path d="M 95 15 C 105 10 115 15 125 20 C 135 25 145 20 155 15 Z" fill="black"/>
        <path d="M 175 10 L 185 10 L 195 15 L 205 15 L 215 20" fill="black"/>
      </svg>`,
            expectedResult: "01OP",
        },
        {
            id: "example3",
            name: "Complex Pattern",
            description: "More complex SVG with varied patterns (A, H, 8, B)",
            svg: `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="40" viewBox="0,0,320,40">
        <path d="M 20 10 L 30 10 L 40 15 L 50 15 L 60 20 L 70 20" fill="black"/>
        <path d="M 90 5 L 100 5 L 110 10 L 120 10 L 130 15 L 140 15 L 150 20" fill="black"/>
        <path d="M 170 8 L 180 8 L 190 12 L 200 12 L 210 16 L 220 16 L 230 20 L 240 20" fill="black"/>
        <path d="M 260 6 L 270 6 L 280 10 L 290 10 L 300 14 L 310 14 L 320 18 L 330 18 L 340 22" fill="black"/>
      </svg>`,
            expectedResult: "AH8B",
        },
    ];

    // SVG validation function (reused from helpers demo)
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

        if (!input.includes("</svg>")) {
            return {
                isValid: false,
                error: "SVG element must be properly closed",
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
                return { isValid: false, error: "No valid SVG element found" };
            }

            // Check for paths (required for captcha solving)
            const paths = svgElement.querySelectorAll("path");
            if (paths.length === 0) {
                return {
                    isValid: false,
                    error: "SVG must contain path elements for captcha solving",
                };
            }

            return { isValid: true };
        } catch (error) {
            return {
                isValid: false,
                error: "Failed to parse SVG: " + (error as Error).message,
            };
        }
    }, []);

    // Validate SVG input whenever it changes
    useEffect(() => {
        if (svgInput.trim()) {
            const validation = validateSVGInput(svgInput);
            setValidationResult(validation);
            if (!validation.isValid) {
                setError(null); // Clear previous errors when showing validation errors
            }
        } else {
            setValidationResult(null);
        }
    }, [svgInput, validateSVGInput]);

    // Load example captcha
    const loadExample = useCallback(
        (exampleId: string) => {
            const example = exampleCaptchas.find((ex) => ex.id === exampleId);
            if (example) {
                setSvgInput(example.svg);
                setSelectedExample(exampleId);
                setSolverResult(null);
                setError(null);
            }
        },
        [exampleCaptchas]
    );

    // File upload handling
    const handleFileUpload = useCallback((file: File) => {
        if (file.type !== "image/svg+xml" && !file.name.endsWith(".svg")) {
            setError("Please upload a valid SVG file");
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            setSvgInput(content);
            setSelectedExample("");
        };
        reader.onerror = () => {
            setError("Failed to read file");
        };
        reader.readAsText(file);
    }, []);

    // Drag and drop handlers
    const handleDragEnter = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setDragActive(false);

            const files = Array.from(e.dataTransfer.files);
            if (files.length > 0) {
                handleFileUpload(files[0]);
            }
        },
        [handleFileUpload]
    );

    // Solve captcha function
    const solveCaptcha = useCallback(async () => {
        if (!validationResult?.isValid) {
            setError("Please provide valid SVG input before solving");
            return;
        }

        setIsProcessing(true);
        setError(null);
        setSolverResult(null);

        try {
            // Use the TypeScript wrapper for captcha solving
            const result = CaptchaSolver.solve(svgInput);
            setSolverResult(result);
        } catch (error) {
            console.error("Captcha solving error:", error);
            setError("Failed to solve captcha: " + (error as Error).message);
        } finally {
            setIsProcessing(false);
        }
    }, [svgInput, validationResult]);

    // Copy to clipboard
    const copyToClipboard = useCallback(async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            // You could add a toast notification here
        } catch (error) {
            console.error("Failed to copy to clipboard:", error);
        }
    }, []);

    // Clear/reset function
    const clearAll = useCallback(() => {
        setSvgInput("");
        setSelectedExample("");
        setSolverResult(null);
        setError(null);
        setValidationResult(null);
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <header className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        🔓 SVG Captcha Solver
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-6">
                        Upload or paste SVG captcha markup to automatically
                        solve and extract the hidden text. Supports
                        drag-and-drop file upload and real-time validation.
                    </p>

                    {/* Navigation Links */}
                    <div className="flex justify-center gap-4">
                        <a
                            href="/helpers-demo"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                            🔧 Helper Functions Demo
                        </a>
                        <a
                            href="/"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                        >
                            🏠 Back to Home
                        </a>
                    </div>
                </header>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {/* Input Section */}
                    <div className="space-y-6">
                        {/* Example Captchas */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                                📋 Example Captchas
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {exampleCaptchas.map((example) => (
                                    <button
                                        key={example.id}
                                        type="button"
                                        onClick={() => loadExample(example.id)}
                                        className={cn(
                                            "p-3 rounded-lg border text-left transition-all duration-200",
                                            "hover:shadow-md transform hover:-translate-y-0.5",
                                            selectedExample === example.id
                                                ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                                                : "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600"
                                        )}
                                    >
                                        <div className="font-medium text-gray-900 dark:text-white text-sm">
                                            {example.name}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            {example.description}
                                        </div>
                                        {example.expectedResult && (
                                            <div className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-mono">
                                                Expected:{" "}
                                                {example.expectedResult}
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* File Upload & SVG Input */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                                📁 SVG Input
                            </h2>

                            {/* File Upload Area */}
                            <div
                                className={cn(
                                    "border-2 border-dashed rounded-lg p-6 text-center transition-colors duration-200",
                                    dragActive
                                        ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20"
                                        : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                                )}
                                onDragEnter={handleDragEnter}
                                onDragLeave={handleDragLeave}
                                onDragOver={handleDragOver}
                                onDrop={handleDrop}
                            >
                                <div className="space-y-3">
                                    <div className="text-4xl">📎</div>
                                    <div>
                                        <p className="text-gray-600 dark:text-gray-300">
                                            Drag and drop SVG file here, or{" "}
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    fileInputRef.current?.click()
                                                }
                                                className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                                            >
                                                browse files
                                            </button>
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                            Supports .svg files
                                        </p>
                                    </div>
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".svg,image/svg+xml"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleFileUpload(file);
                                    }}
                                    className="hidden"
                                    title="Upload SVG file"
                                    aria-label="Upload SVG file"
                                />
                            </div>

                            {/* SVG Text Input */}
                            <div className="mt-6">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Or paste SVG markup:
                                </label>
                                <textarea
                                    value={svgInput}
                                    onChange={(e) =>
                                        setSvgInput(e.target.value)
                                    }
                                    className="w-full h-48 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm resize-none"
                                    placeholder='<svg xmlns="http://www.w3.org/2000/svg" width="200" height="40">&#10;  <path d="M10 20 L30 20" fill="black"/>&#10;</svg>'
                                />
                            </div>

                            {/* Validation Status */}
                            {validationResult && (
                                <div
                                    className={cn(
                                        "mt-4 p-3 rounded-lg border",
                                        validationResult.isValid
                                            ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                                            : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                                    )}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">
                                            {validationResult.isValid
                                                ? "✅"
                                                : "❌"}
                                        </span>
                                        <span
                                            className={cn(
                                                "font-medium",
                                                validationResult.isValid
                                                    ? "text-green-800 dark:text-green-200"
                                                    : "text-red-800 dark:text-red-200"
                                            )}
                                        >
                                            {validationResult.isValid
                                                ? "Valid SVG"
                                                : "Invalid SVG"}
                                        </span>
                                    </div>
                                    {validationResult.error && (
                                        <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                                            {validationResult.error}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={solveCaptcha}
                                    disabled={
                                        !validationResult?.isValid ||
                                        isProcessing
                                    }
                                    className={cn(
                                        "flex-1 px-6 py-3 rounded-lg font-medium transition-all duration-200",
                                        "flex items-center justify-center gap-2",
                                        validationResult?.isValid &&
                                            !isProcessing
                                            ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                                            : "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                                    )}
                                >
                                    {isProcessing ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                            Processing...
                                        </>
                                    ) : (
                                        <>🚀 Solve Captcha</>
                                    )}
                                </button>

                                <button
                                    type="button"
                                    onClick={clearAll}
                                    className="px-6 py-3 rounded-lg font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                                >
                                    🗑️ Clear
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Results Section */}
                    <div className="space-y-6">
                        {/* SVG Preview */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                                👁️ SVG Preview
                            </h2>
                            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg border min-h-[120px] flex items-center justify-center p-4">
                                {validationResult?.isValid && svgInput ? (
                                    <div
                                        className="max-w-full max-h-full"
                                        dangerouslySetInnerHTML={{
                                            __html: svgInput,
                                        }}
                                    />
                                ) : (
                                    <span className="text-gray-500 dark:text-gray-400 text-center">
                                        {svgInput
                                            ? "Invalid SVG"
                                            : "No SVG loaded"}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Error Display */}
                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
                                <div className="flex items-start gap-3">
                                    <span className="text-red-500 text-xl">
                                        ⚠️
                                    </span>
                                    <div>
                                        <h3 className="font-semibold text-red-800 dark:text-red-200">
                                            Error
                                        </h3>
                                        <p className="text-red-600 dark:text-red-400 mt-1">
                                            {error}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Solver Results */}
                        {solverResult && (
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                                    🎯 Solved Result
                                </h2>

                                {/* Main Result */}
                                <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg p-6 mb-4">
                                    <div className="text-center">
                                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                            Solved Captcha Code:
                                        </div>
                                        <div className="text-3xl font-bold text-gray-900 dark:text-white font-mono tracking-wider mb-3">
                                            {solverResult}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                copyToClipboard(solverResult)
                                            }
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                                        >
                                            📋 Copy to Clipboard
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Instructions */}
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
                            <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-3">
                                💡 How to Use
                            </h3>
                            <ol className="text-blue-700 dark:text-blue-300 text-sm space-y-2">
                                <li>
                                    1. Choose an example captcha or upload/paste
                                    your own SVG
                                </li>
                                <li>
                                    2. Ensure the SVG contains path elements
                                    (required for solving)
                                </li>
                                <li>
                                    3. Click "Solve Captcha" to process the
                                    image
                                </li>
                                <li>
                                    4. Copy the solved code and use it where
                                    needed
                                </li>
                            </ol>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
