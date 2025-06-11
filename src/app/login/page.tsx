"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Simulate login process (you can add actual authentication logic here)
        setTimeout(() => {
            setLoading(false);
            // Navigate to dashboard
            router.push("/dashboard");
        }, 1000);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                {/* Login Card */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            🔐 Login
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">
                            Sign in to access the dashboard
                        </p>
                    </div>

                    {/* Login Form */}
                    <form onSubmit={handleLogin} className="space-y-6">
                        {/* Username Field */}
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
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Enter username"
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                                required
                            />
                        </div>

                        {/* Password Field */}
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
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter password"
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                                required
                            />
                        </div>

                        {/* Login Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                    Logging in...
                                </span>
                            ) : (
                                "Login to Dashboard"
                            )}
                        </button>
                    </form>

                    {/* Additional Links */}
                    <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
                        <div className="text-center">
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                Explore other features:
                            </p>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <Link
                                    href="/captcha-fetcher"
                                    className="flex-1 px-3 py-2 text-sm bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/30 transition-colors text-center"
                                >
                                    🌐 Captcha Fetcher
                                </Link>
                                <Link
                                    href="/captcha-solver"
                                    className="flex-1 px-3 py-2 text-sm bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/30 transition-colors text-center"
                                >
                                    🧩 Captcha Solver
                                </Link>
                            </div>
                            <Link
                                href="/"
                                className="inline-block mt-2 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            >
                                🏠 Back to Home
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Info Card */}
                <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                    <div className="flex items-start">
                        <div className="text-blue-600 dark:text-blue-400 text-xl mr-3">
                            ℹ️
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                                Demo Login
                            </h3>
                            <p className="text-blue-600 dark:text-blue-400 text-sm mt-1">
                                This is a demo login. Enter any username and
                                password to access the dashboard which displays
                                captcha token data from the Vietnamese Tax
                                Authority.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
