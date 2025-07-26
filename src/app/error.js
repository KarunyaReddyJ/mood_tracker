"use client";

export default function Error({ error, reset }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-red-50">
            <div className="bg-white p-8 rounded-xl shadow-lg border border-red-200 max-w-lg w-full">
                <h1 className="text-3xl font-bold text-red-600 mb-4">Something went wrong</h1>
                <p className="text-gray-800 mb-2">{error?.message || "An unexpected error occurred."}</p>
                {error?.digest && (
                    <pre className="bg-red-100 text-red-700 rounded p-2 text-xs mb-4 overflow-x-auto">{error.digest}</pre>
                )}
                <button
                    onClick={() => reset?.() || (window.location.href = "/")}
                    className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                >
                    Go to Home
                </button>
            </div>
        </div>
    );
} 