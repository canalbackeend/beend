"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="text-center">
        <h2 className="mb-4 text-2xl font-bold text-gray-800 dark:text-gray-200">
          Algo deu errado!
        </h2>
        <p className="mb-4 text-gray-600 dark:text-gray-400">
          Ocorreu um erro inesperado. Por favor, tente novamente.
        </p>
        <button
          onClick={() => reset()}
          className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
}
