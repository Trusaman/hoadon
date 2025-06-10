/**
 * SVG Captcha Solver Application
 * Optimized and modular JavaScript code
 */

// Application state and configuration
const AppConfig = {
    LOADING_DELAY: 500,
    EXAMPLE_SVG: `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="40" viewBox="0,0,200,40">
        <path d="M17 27 C115 17,93 3,180 32" stroke="#777" fill="none"/>
        <path d="M9 3 C89 3,114 22,186 24" stroke="#666" fill="none"/>
        <path fill="#222" d="M174.76 32.95L174.81 32.99Q175.11 33.98 175.64 36.00Q171.36 34.60 166.75 34.87Q162.08 35.04 158.08 37.02Q162.17 32.54 166.10 28.13Q170.51 23.14 171.70 18.46Q172.14 16.70 170.87 15.52Q169.63 14.37 167.84 14.52Q167.53 14.52 167.19 14.52Q165.50 14.36 164.24 15.27Q163.10 16.80 163.33 19.46Q161.46 19.03 160.24 18.58Q160.09 17.21 160.01 15.76Q159.93 14.12 160.54 12.97Q162.27 11.55 165.62 11.55Q169.63 11.56 170.58 11.67Q175.02 12.20 175.29 14.63Q175.25 15.09 175.17 15.88Q175.14 16.53 174.98 17.22Q173.42 25.40 165.84 32.25Q167.36 32.20 168.73 32.20Q171.81 32.05 174.67 32.85Z"/>
        <path fill="#444" d="M22.53 25.59Q25.98 25.61 29.27 25.59Q28.32 22.82 25.89 17.18Q25.30 18.58 24.25 21.43Q23.23 24.31 22.66 25.72ZM30.45 28.14Q28.06 28.00 25.86 28.04Q23.76 28.23 21.48 28.42Q19.84 31.73 16.60 35.92Q14.08 36.59 12.70 37.08Q17.90 31.51 22.59 18.14Q23.69 14.56 25.06 11.33Q25.33 11.30 25.68 11.30Q27.23 12.74 32.06 24.39Q35.40 32.29 39.40 36.44Q38.82 36.24 34.93 35.36Q32.39 32.25 30.41 28.10ZM34.97 35.82Q35.64 35.77 35.94 35.88Q36.36 36.33 38.18 38.35Q41.89 39.31 44.29 40.34Q38.75 35.75 34.75 27.76Q33.03 24.36 31.58 20.40Q28.89 12.95 28.33 12.96Q27.45 12.31 26.73 10.94Q26.18 10.93 25.72 10.89Q25.36 10.94 24.82 10.94Q23.42 14.87 19.54 25.03Q16.42 33.00 11.78 37.79Q12.75 37.32 14.77 36.71Q14.06 37.64 12.50 39.43Q14.14 38.71 18.06 37.94Q21.47 33.59 23.03 30.35Q24.81 30.27 27.13 30.31Q29.82 30.29 31.19 30.37Q32.52 32.80 34.88 35.73ZM27.05 20.93Q27.98 23.08 28.74 25.17Q25.99 23.72 27.05 20.94Z"/>
    </svg>`,
};

// Character recognition patterns for analysis display
const CHARACTER_PATTERNS = {
    // Numbers
    0: { curves: 2, corners: 0, complexity: "medium" },
    1: { curves: 0, corners: 2, complexity: "low" },
    2: { curves: 3, corners: 4, complexity: "high" },
    3: { curves: 4, corners: 2, complexity: "high" },
    4: { curves: 1, corners: 3, complexity: "medium" },
    5: { curves: 2, corners: 4, complexity: "high" },
    6: { curves: 3, corners: 2, complexity: "high" },
    7: { curves: 1, corners: 2, complexity: "low" },
    8: { curves: 4, corners: 0, complexity: "high" },
    9: { curves: 3, corners: 2, complexity: "high" },
    // Letters (common captcha letters)
    A: { curves: 1, corners: 3, complexity: "medium" },
    P: { curves: 2, corners: 4, complexity: "medium" },
    S: { curves: 4, corners: 2, complexity: "high" },
    T: { curves: 0, corners: 4, complexity: "low" },
    E: { curves: 0, corners: 6, complexity: "medium" },
};

// Optimized DOM element cache with WeakMap for better memory management
const DOMElements = {
    _cache: new Map(),
    _weakCache: new WeakMap(),
    _initialized: false,

    /**
     * Get DOM element with optimized caching and validation
     * @param {string} id - Element ID
     * @returns {HTMLElement|null} - Cached DOM element
     */
    get(id) {
        // Use direct property access for frequently used elements if already cached
        if (this._cache.has(id)) {
            const element = this._cache.get(id);
            // Verify element is still in DOM (prevents stale references)
            if (element && element.isConnected) {
                return element;
            } else {
                this._cache.delete(id);
            }
        }

        const element = document.getElementById(id);
        if (element) {
            this._cache.set(id, element);
            // Store additional metadata in WeakMap
            this._weakCache.set(element, {
                id,
                accessCount: 1,
                lastAccessed: Date.now(),
            });
        } else if (!this._initialized) {
            // Only warn if initialization is complete
            console.warn(`Element with ID '${id}' not found`);
        }

        return element;
    },

    /**
     * Batch initialize all required DOM elements for better performance
     * @returns {boolean} - Success status
     */
    init() {
        const requiredElements = [
            "svgInput",
            "results",
            "solveText",
            "svgPreview",
            "finalResult",
            "characterList",
            "pathAnalysis",
            "visualProps",
            "boundingBoxes",
        ];

        let allFound = true;

        // Batch query all elements at once for better performance
        for (const id of requiredElements) {
            const element = document.getElementById(id);
            if (element) {
                this._cache.set(id, element);
                this._weakCache.set(element, {
                    id,
                    accessCount: 0,
                    lastAccessed: Date.now(),
                });
            } else {
                allFound = false;
                console.warn(
                    `Required element '${id}' not found during initialization`
                );
            }
        }

        this._initialized = true;
        return allFound;
    },

    /**
     * Optimized cache clearing with memory cleanup
     */
    clearCache() {
        // Clear both caches
        this._cache.clear();
        // WeakMap will be garbage collected automatically
        this._initialized = false;
    },

    /**
     * Get cache statistics for performance monitoring
     */
    getCacheStats() {
        return {
            size: this._cache.size,
            initialized: this._initialized,
            elements: Array.from(this._cache.keys()),
        };
    },

    // Optimized getter methods with direct cache access
    get svgInput() {
        return this._cache.get("svgInput") || this.get("svgInput");
    },
    get results() {
        return this._cache.get("results") || this.get("results");
    },
    get solveText() {
        return this._cache.get("solveText") || this.get("solveText");
    },
    get svgPreview() {
        return this._cache.get("svgPreview") || this.get("svgPreview");
    },
    get finalResult() {
        return this._cache.get("finalResult") || this.get("finalResult");
    },
    get characterList() {
        return this._cache.get("characterList") || this.get("characterList");
    },
    get pathAnalysis() {
        return this._cache.get("pathAnalysis") || this.get("pathAnalysis");
    },
    get visualProps() {
        return this._cache.get("visualProps") || this.get("visualProps");
    },
    get boundingBoxes() {
        return this._cache.get("boundingBoxes") || this.get("boundingBoxes");
    },
};

// Optimized utility functions with compiled regex and better performance
const Utils = {
    // Pre-compiled regex patterns for better performance
    _regexCache: {
        svgTag: /<svg[^>]*>/i,
        whitespace: /^\s*$/,
        svgNamespace: /xmlns\s*=\s*["']http:\/\/www\.w3\.org\/2000\/svg["']/i,
        htmlTags: /<[^>]*>/g,
        numbers: /[\d.-]+/g,
    },

    // Validation result cache to avoid re-validation of same input
    _validationCache: new Map(),

    /**
     * Optimized SVG input validation with caching and detailed checks
     * @param {string} svgInput - The SVG string to validate
     * @returns {{isValid: boolean, error?: string}} - Validation result
     */
    validateSVGInput(svgInput) {
        // Quick type and null checks
        if (!svgInput || typeof svgInput !== "string") {
            return {
                isValid: false,
                error: "Input must be a non-empty string",
            };
        }

        // Check cache first for performance
        if (this._validationCache.has(svgInput)) {
            return this._validationCache.get(svgInput);
        }

        const trimmed = svgInput.trim();
        let result;

        if (trimmed.length === 0) {
            result = {
                isValid: false,
                error: "Input cannot be empty or whitespace only",
            };
        } else if (!this._regexCache.svgTag.test(trimmed)) {
            result = {
                isValid: false,
                error: "Input must contain a valid SVG tag",
            };
        } else if (!this._regexCache.svgNamespace.test(trimmed)) {
            result = {
                isValid: false,
                error: "SVG must include proper namespace declaration",
            };
        } else {
            result = { isValid: true };
        }

        // Cache the result (limit cache size to prevent memory leaks)
        if (this._validationCache.size > 50) {
            const firstKey = this._validationCache.keys().next().value;
            this._validationCache.delete(firstKey);
        }
        this._validationCache.set(svgInput, result);

        return result;
    },

    /**
     * Optimized results toggle with better animation performance
     * @param {boolean} show - Whether to show the results
     * @param {boolean} animate - Whether to animate the transition
     */
    toggleResults(show, animate = true) {
        const resultsElement = DOMElements.results;
        if (!resultsElement) {
            console.warn("Results element not found");
            return;
        }

        // Use CSS classes for better performance instead of inline styles
        if (show) {
            resultsElement.classList.remove("hidden");
            if (animate) {
                resultsElement.classList.add("results-entering");

                // Use requestAnimationFrame for smooth animation
                requestAnimationFrame(() => {
                    resultsElement.classList.remove("results-entering");
                    resultsElement.classList.add("results-visible");
                });
            } else {
                resultsElement.classList.add("results-visible");
            }
        } else {
            if (animate) {
                resultsElement.classList.remove("results-visible");
                resultsElement.classList.add("results-leaving");

                // Use transitionend event for better performance
                const handleTransitionEnd = () => {
                    resultsElement.classList.add("hidden");
                    resultsElement.classList.remove("results-leaving");
                    resultsElement.removeEventListener(
                        "transitionend",
                        handleTransitionEnd
                    );
                };

                resultsElement.addEventListener(
                    "transitionend",
                    handleTransitionEnd
                );

                // Fallback timeout in case transitionend doesn't fire
                setTimeout(() => {
                    if (resultsElement.classList.contains("results-leaving")) {
                        handleTransitionEnd();
                    }
                }, 350);
            } else {
                resultsElement.classList.add("hidden");
                resultsElement.classList.remove("results-visible");
            }
        }
    },

    /**
     * Optimized loading state management with better performance
     * @param {boolean} loading - Whether to show loading state
     * @param {string} customMessage - Custom loading message
     */
    setLoadingState(loading, customMessage = "Analyzing...") {
        const solveTextElement = DOMElements.solveText;
        if (!solveTextElement) {
            console.warn("Solve text element not found");
            return;
        }

        if (loading) {
            // Use template literals more efficiently
            solveTextElement.innerHTML = `<span class="loading" aria-hidden="true"></span>${this.escapeHtml(
                customMessage
            )}`;
            solveTextElement.setAttribute("aria-busy", "true");
            solveTextElement.setAttribute("aria-live", "polite");
        } else {
            solveTextElement.innerHTML = "🚀 Solve Captcha";
            solveTextElement.removeAttribute("aria-busy");
            solveTextElement.removeAttribute("aria-live");
        }
    },

    /**
     * Optimized error display with better performance and categorization
     * @param {string|Error} error - Error message or Error object
     * @param {string} category - Error category (validation, processing, network)
     */
    showError(error, category = "general") {
        const finalResultElement = DOMElements.finalResult;
        if (!finalResultElement) {
            console.warn("Final result element not found");
            return;
        }

        const message = error instanceof Error ? error.message : String(error);
        const errorClass = `error error-${category}`;

        // Use textContent for better security and performance
        finalResultElement.innerHTML = "";
        const errorDiv = document.createElement("div");
        errorDiv.className = errorClass;
        errorDiv.setAttribute("role", "alert");
        errorDiv.setAttribute("aria-live", "assertive");

        const strongElement = document.createElement("strong");
        strongElement.textContent = "Error: ";
        errorDiv.appendChild(strongElement);
        errorDiv.appendChild(document.createTextNode(message));

        finalResultElement.appendChild(errorDiv);
    },

    /**
     * Optimized HTML escaping with caching for better performance
     * @param {string} text - Text to escape
     * @returns {string} - Escaped text
     */
    escapeHtml(text) {
        // Use a static map for common escape sequences for better performance
        if (!this._escapeMap) {
            this._escapeMap = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;",
            };
            this._escapeRegex = /[&<>"']/g;
        }

        return String(text).replace(
            this._escapeRegex,
            (match) => this._escapeMap[match]
        );
    },

    /**
     * Enhanced debounce with immediate execution option
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @param {boolean} immediate - Execute immediately on first call
     * @returns {Function} - Debounced function
     */
    debounce(func, wait, immediate = false) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func.apply(this, args);
            };

            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);

            if (callNow) func.apply(this, args);
        };
    },

    /**
     * Throttle function to limit execution frequency
     * @param {Function} func - Function to throttle
     * @param {number} limit - Time limit in milliseconds
     * @returns {Function} - Throttled function
     */
    throttle(func, limit) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => (inThrottle = false), limit);
            }
        };
    },
};

// Optimized SVG Analysis functions with improved caching and performance
const SVGAnalyzer = {
    // Enhanced caches with LRU-like behavior
    _complexityCache: new Map(),
    _boundingBoxCache: new Map(),
    _maxCacheSize: 100,

    // Pre-compiled regex patterns for optimal performance
    _patterns: {
        curves: /[CcSsQqTtAa]/g,
        lines: /[LlHhVv]/g,
        moves: /[Mm]/g,
        commands: /[MmLlHhVvCcSsQqTtAaZz]|[\d.-]+/g,
        moveLineCommands: /[MmLl]/,
        numbers: /[\d.-]+/g,
        pathCommands: /[MmLlHhVvCcSsQqTtAaZz]/g,
    },

    // Complexity level thresholds for better categorization
    _complexityThresholds: {
        veryHigh: { curves: 5, total: 15 },
        high: { curves: 3, total: 10 },
        medium: { curves: 1, total: 5 },
    },

    /**
     * Optimized path complexity analysis with improved caching and performance
     * @param {string} pathData - SVG path data
     * @returns {Object} - Complexity analysis
     */
    analyzePathComplexity(pathData) {
        if (!pathData || typeof pathData !== "string") {
            return {
                curves: 0,
                lines: 0,
                moves: 0,
                total: 0,
                complexity: "low",
            };
        }

        // Check cache first for performance
        if (this._complexityCache.has(pathData)) {
            const cached = this._complexityCache.get(pathData);
            // Move to end for LRU behavior
            this._complexityCache.delete(pathData);
            this._complexityCache.set(pathData, cached);
            return cached;
        }

        // Use single pass through the string for better performance
        let curves = 0,
            lines = 0,
            moves = 0;

        // Reset regex lastIndex to ensure consistent behavior
        this._patterns.curves.lastIndex = 0;
        this._patterns.lines.lastIndex = 0;
        this._patterns.moves.lastIndex = 0;

        // Count matches more efficiently
        curves = (pathData.match(this._patterns.curves) || []).length;
        lines = (pathData.match(this._patterns.lines) || []).length;
        moves = (pathData.match(this._patterns.moves) || []).length;

        const total = curves + lines + moves;

        const result = {
            curves,
            lines,
            moves,
            total,
            complexity: this._getComplexityLevel(curves, total),
        };

        // Implement LRU cache behavior
        this._manageCacheSize(this._complexityCache);
        this._complexityCache.set(pathData, result);

        return result;
    },

    /**
     * Optimized complexity level determination using thresholds
     * @param {number} curves - Number of curve commands
     * @param {number} total - Total number of commands
     * @returns {string} - Complexity level
     */
    _getComplexityLevel(curves, total) {
        const thresholds = this._complexityThresholds;

        if (
            curves > thresholds.veryHigh.curves ||
            total > thresholds.veryHigh.total
        ) {
            return "very-high";
        }
        if (curves > thresholds.high.curves || total > thresholds.high.total) {
            return "high";
        }
        if (
            curves > thresholds.medium.curves ||
            total > thresholds.medium.total
        ) {
            return "medium";
        }
        return "low";
    },

    /**
     * Manage cache size with LRU behavior
     * @param {Map} cache - Cache to manage
     */
    _manageCacheSize(cache) {
        if (cache.size >= this._maxCacheSize) {
            // Remove oldest entries (first in Map)
            const entriesToRemove = cache.size - this._maxCacheSize + 1;
            const keys = cache.keys();
            for (let i = 0; i < entriesToRemove; i++) {
                const key = keys.next().value;
                if (key !== undefined) {
                    cache.delete(key);
                }
            }
        }
    },

    /**
     * Enhanced bounding box calculation with caching and better parsing
     * @param {string} pathData - SVG path data
     * @returns {Object} - Bounding box coordinates
     */
    getPathBoundingBox(pathData) {
        if (!pathData || typeof pathData !== "string") {
            return { x: 0, y: 0, width: 0, height: 0 };
        }

        // Check cache first
        if (this._boundingBoxCache.has(pathData)) {
            return this._boundingBoxCache.get(pathData);
        }

        const commands = pathData.match(this._patterns.commands) || [];
        const bounds = this._calculateBounds(commands);

        const result = {
            x: isFinite(bounds.minX) ? bounds.minX : 0,
            y: isFinite(bounds.minY) ? bounds.minY : 0,
            width:
                isFinite(bounds.maxX) && isFinite(bounds.minX)
                    ? bounds.maxX - bounds.minX
                    : 0,
            height:
                isFinite(bounds.maxY) && isFinite(bounds.minY)
                    ? bounds.maxY - bounds.minY
                    : 0,
        };

        // Cache the result
        this._boundingBoxCache.set(pathData, result);

        // Limit cache size
        if (this._boundingBoxCache.size > 100) {
            const firstKey = this._boundingBoxCache.keys().next().value;
            this._boundingBoxCache.delete(firstKey);
        }

        return result;
    },

    /**
     * Calculate bounds from path commands
     * @param {Array} commands - Array of path commands and coordinates
     * @returns {Object} - Min/max coordinates
     */
    _calculateBounds(commands) {
        let minX = Infinity,
            minY = Infinity,
            maxX = -Infinity,
            maxY = -Infinity;
        let currentX = 0,
            currentY = 0;

        for (let i = 0; i < commands.length; i++) {
            const cmd = commands[i];

            if (this._patterns.moveLineCommands.test(cmd)) {
                // Handle Move and Line commands
                if (i + 2 < commands.length) {
                    const x = parseFloat(commands[i + 1]);
                    const y = parseFloat(commands[i + 2]);

                    if (!isNaN(x) && !isNaN(y)) {
                        currentX = cmd.toLowerCase() === cmd ? currentX + x : x; // relative vs absolute
                        currentY = cmd.toLowerCase() === cmd ? currentY + y : y;

                        minX = Math.min(minX, currentX);
                        minY = Math.min(minY, currentY);
                        maxX = Math.max(maxX, currentX);
                        maxY = Math.max(maxY, currentY);
                    }
                    i += 2;
                }
            } else if (this._patterns.numbers.test(cmd)) {
                // Handle coordinate values
                const num = parseFloat(cmd);
                if (!isNaN(num)) {
                    // Simple heuristic: alternate between x and y coordinates
                    if (i % 2 === 1) {
                        minX = Math.min(minX, num);
                        maxX = Math.max(maxX, num);
                    } else {
                        minY = Math.min(minY, num);
                        maxY = Math.max(maxY, num);
                    }
                }
            }
        }

        return { minX, minY, maxX, maxY };
    },

    /**
     * Clear analysis caches (useful for memory management)
     */
    clearCaches() {
        this._complexityCache.clear();
        this._boundingBoxCache.clear();
    },

    /**
     * Get cache statistics for debugging
     * @returns {Object} - Cache statistics
     */
    getCacheStats() {
        return {
            complexityCache: this._complexityCache.size,
            boundingBoxCache: this._boundingBoxCache.size,
        };
    },
};

// Display functions
const DisplayManager = {
    /**
     * Display analysis results
     * @param {Object} result - Analysis result object
     */
    displayResults(result) {
        try {
            // Display SVG preview
            DOMElements.svgPreview.innerHTML = result.originalSVG;

            // Display final result
            DOMElements.finalResult.innerHTML = `Captcha Text: <strong>${result.recognizedText}</strong>`;

            // Display character list
            this.displayCharacterList(result.characters);

            // Display path analysis
            this.displayPathAnalysis(result);

            // Display visual properties
            this.displayVisualProperties(result.svgDimensions);

            // Display bounding boxes
            this.displayBoundingBoxes(result.characters);
        } catch (error) {
            console.error("Error displaying results:", error);
            Utils.showError("Failed to display results");
        }
    },

    /**
     * Display character list
     * @param {Array} characters - Array of character objects
     */
    displayCharacterList(characters) {
        DOMElements.characterList.innerHTML = characters
            .map((char) => `<div class="character-box">${char.character}</div>`)
            .join("");
    },

    /**
     * Display path analysis
     * @param {Object} result - Analysis result object
     */
    displayPathAnalysis(result) {
        const avgComplexity =
            result.characters.length > 0
                ? (
                      result.characters.reduce(
                          (acc, c) => acc + c.complexity.total,
                          0
                      ) / result.characters.length
                  ).toFixed(1)
                : 0;

        DOMElements.pathAnalysis.innerHTML = `
            <p><strong>Total Paths:</strong> ${result.pathCount}</p>
            <p><strong>Characters Found:</strong> ${result.characters.length}</p>
            <p><strong>Average Complexity:</strong> ${avgComplexity}</p>
        `;
    },

    /**
     * Display visual properties
     * @param {Object} dimensions - SVG dimensions object
     */
    displayVisualProperties(dimensions) {
        DOMElements.visualProps.innerHTML = `
            <p><strong>Width:</strong> ${dimensions.width || "N/A"}px</p>
            <p><strong>Height:</strong> ${dimensions.height || "N/A"}px</p>
            <p><strong>ViewBox:</strong> ${dimensions.viewBox || "N/A"}</p>
        `;
    },

    /**
     * Display bounding boxes
     * @param {Array} characters - Array of character objects
     */
    displayBoundingBoxes(characters) {
        DOMElements.boundingBoxes.innerHTML = characters
            .map(
                (char) =>
                    `<p><strong>${char.character}:</strong> (${Math.round(
                        char.bbox.x
                    )}, ${Math.round(char.bbox.y)}) ${Math.round(
                        char.bbox.width
                    )}×${Math.round(char.bbox.height)}</p>`
            )
            .join("");
    },
};

// Enhanced main application functions with better error handling
/**
 * Enhanced solve captcha function with comprehensive validation and error handling
 */
async function solveCaptcha() {
    const svgInputElement = DOMElements.svgInput;
    if (!svgInputElement) {
        console.error("SVG input element not found");
        return;
    }

    const svgInput = svgInputElement.value.trim();

    // Enhanced validation with detailed error messages
    const validation = Utils.validateSVGInput(svgInput);
    if (!validation.isValid) {
        Utils.showError(validation.error, "validation");
        svgInputElement.focus();
        return;
    }

    // Show loading state with custom message
    Utils.setLoadingState(true, "Processing SVG...");
    Utils.toggleResults(true, true);

    try {
        // Use requestAnimationFrame to ensure UI updates before processing
        await new Promise((resolve) => requestAnimationFrame(resolve));

        const result = await processCaptcha(svgInput);
        DisplayManager.displayResults(result);
    } catch (error) {
        console.error("Error solving captcha:", error);
        const errorCategory = getErrorCategory(error);
        Utils.showError(error, errorCategory);

        // Hide results on error
        Utils.toggleResults(false, true);
    } finally {
        Utils.setLoadingState(false);
    }
}

/**
 * Process captcha with enhanced error handling and validation
 * @param {string} svgInput - SVG input string
 * @returns {Promise<Object>} - Processing result
 */
async function processCaptcha(svgInput) {
    // Update loading message
    Utils.setLoadingState(true, "Solving captcha...");

    // Use CaptchaSolver library to solve the captcha
    const recognizedText = CaptchaSolver.solve(svgInput);

    if (!recognizedText || recognizedText.length === 0) {
        throw new Error("Failed to recognize any characters from the captcha");
    }

    // Update loading message
    Utils.setLoadingState(true, "Analyzing SVG structure...");

    // Parse SVG for analysis display with error handling
    const svgData = await parseSVGSafely(svgInput);

    // Create result object for display
    const result = {
        originalSVG: svgInput,
        recognizedText,
        characters: createCharacterAnalysis(recognizedText, svgData.charPaths),
        pathCount: svgData.allPaths.length,
        svgDimensions: svgData.dimensions,
        processingTime: Date.now() - performance.now(),
    };

    return result;
}

/**
 * Safely parse SVG with comprehensive error handling
 * @param {string} svgInput - SVG input string
 * @returns {Promise<Object>} - Parsed SVG data
 */
async function parseSVGSafely(svgInput) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgInput, "image/svg+xml");

    // Check for parsing errors
    const parseError = doc.querySelector("parsererror");
    if (parseError) {
        throw new Error(`SVG parsing failed: ${parseError.textContent}`);
    }

    const svgElement = doc.querySelector("svg");
    if (!svgElement) {
        throw new Error("No SVG element found in the input");
    }

    // Get all paths and filter for character paths
    const allPaths = Array.from(svgElement.querySelectorAll("path"));
    if (allPaths.length === 0) {
        throw new Error("No path elements found in the SVG");
    }

    const charPaths = allPaths.filter(
        (path) =>
            !path.hasAttribute("stroke") ||
            path.getAttribute("stroke") === "" ||
            path.getAttribute("stroke") === "none"
    );

    return {
        svgElement,
        allPaths,
        charPaths,
        dimensions: {
            width: svgElement.getAttribute("width"),
            height: svgElement.getAttribute("height"),
            viewBox: svgElement.getAttribute("viewBox"),
        },
    };
}

/**
 * Create character analysis with error handling
 * @param {string} recognizedText - Recognized text
 * @param {Array} charPaths - Character path elements
 * @returns {Array} - Character analysis array
 */
function createCharacterAnalysis(recognizedText, charPaths) {
    return recognizedText.split("").map((char, i) => {
        const pathData = charPaths[i]?.getAttribute("d") || "";

        try {
            return {
                character: char,
                complexity: SVGAnalyzer.analyzePathComplexity(pathData),
                bbox: SVGAnalyzer.getPathBoundingBox(pathData),
                pathIndex: i,
                hasPath: !!pathData,
            };
        } catch (error) {
            console.warn(
                `Error analyzing character ${char} at index ${i}:`,
                error
            );
            return {
                character: char,
                complexity: {
                    curves: 0,
                    lines: 0,
                    moves: 0,
                    total: 0,
                    complexity: "unknown",
                },
                bbox: { x: 0, y: 0, width: 0, height: 0 },
                pathIndex: i,
                hasPath: false,
                error: error.message,
            };
        }
    });
}

/**
 * Determine error category for better error handling
 * @param {Error} error - Error object
 * @returns {string} - Error category
 */
function getErrorCategory(error) {
    const message = error.message.toLowerCase();

    if (message.includes("parse") || message.includes("invalid svg")) {
        return "parsing";
    }
    if (message.includes("network") || message.includes("fetch")) {
        return "network";
    }
    if (message.includes("recognize") || message.includes("solve")) {
        return "processing";
    }

    return "general";
}

/**
 * Load example SVG
 */
function loadExample() {
    DOMElements.svgInput.value = AppConfig.EXAMPLE_SVG;
    Utils.toggleResults(false);
}

/**
 * Clear input and results
 */
function clearInput() {
    DOMElements.svgInput.value = "";
    Utils.toggleResults(false);
}

// Enhanced application initialization with performance monitoring
document.addEventListener("DOMContentLoaded", () => {
    const initStartTime = performance.now();

    try {
        // Initialize DOM elements with validation
        const domInitSuccess = DOMElements.init();
        if (!domInitSuccess) {
            console.error("Failed to initialize some DOM elements");
        }

        // Setup keyboard shortcuts with throttling
        setupKeyboardShortcuts();

        // Setup input validation with debouncing
        setupInputValidation();

        // Setup performance monitoring
        setupPerformanceMonitoring();

        const initTime = performance.now() - initStartTime;
        console.log(
            `SVG Captcha Solver initialized successfully in ${initTime.toFixed(
                2
            )}ms`
        );

        // Log cache statistics
        console.log("Cache statistics:", SVGAnalyzer.getCacheStats());
    } catch (error) {
        console.error("Failed to initialize SVG Captcha Solver:", error);
        Utils.showError(
            "Application initialization failed. Please refresh the page.",
            "initialization"
        );
    }
});

/**
 * Setup keyboard shortcuts with proper event handling
 */
function setupKeyboardShortcuts() {
    const keyboardHandler = Utils.throttle((e) => {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case "Enter":
                    e.preventDefault();
                    solveCaptcha();
                    break;
                case "l":
                    e.preventDefault();
                    loadExample();
                    break;
                case "k":
                    e.preventDefault();
                    clearInput();
                    break;
                case "Escape":
                    e.preventDefault();
                    Utils.toggleResults(false);
                    break;
            }
        }
    }, 100); // Throttle to prevent rapid-fire events

    document.addEventListener("keydown", keyboardHandler);
}

/**
 * Setup input validation with debouncing
 */
function setupInputValidation() {
    const svgInput = DOMElements.svgInput;
    if (!svgInput) return;

    const validateInput = Utils.debounce((value) => {
        if (value.trim().length > 0) {
            const validation = Utils.validateSVGInput(value);
            if (!validation.isValid) {
                svgInput.style.borderColor = "var(--error-color)";
                svgInput.title = validation.error;
            } else {
                svgInput.style.borderColor = "var(--success-color)";
                svgInput.title = "Valid SVG input";
            }
        } else {
            svgInput.style.borderColor = "";
            svgInput.title = "";
        }
    }, 500);

    svgInput.addEventListener("input", (e) => {
        validateInput(e.target.value);
    });

    svgInput.addEventListener("paste", (e) => {
        // Small delay to allow paste to complete
        setTimeout(() => validateInput(e.target.value), 10);
    });
}

/**
 * Setup performance monitoring
 */
function setupPerformanceMonitoring() {
    // Monitor memory usage if available
    if ("memory" in performance) {
        setInterval(() => {
            const memory = performance.memory;
            if (memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.9) {
                console.warn("High memory usage detected, clearing caches");
                SVGAnalyzer.clearCaches();
                DOMElements.clearCache();
            }
        }, 30000); // Check every 30 seconds
    }

    // Monitor for long tasks
    if ("PerformanceObserver" in window) {
        try {
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.duration > 50) {
                        console.warn(
                            `Long task detected: ${entry.duration.toFixed(2)}ms`
                        );
                    }
                }
            });
            observer.observe({ entryTypes: ["longtask"] });
        } catch (error) {
            console.log("Performance monitoring not available:", error.message);
        }
    }
}
