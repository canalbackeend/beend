import { Metadata } from "next";

export const metadata: Metadata = {
  title: "404 - Página não encontrada",
};

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="text-center">
        <h1 className="mb-4 text-6xl font-bold text-gray-800 dark:text-gray-200">
          404
        </h1>
        <h2 className="mb-4 text-2xl font-semibold text-gray-700 dark:text-gray-300">
          Página não encontrada
        </h2>
        <p className="mb-6 text-gray-600 dark:text-gray-400">
          A página que você está procurando não existe ou foi removida.
        </p>
        <a
          href="/"
          className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 transition-colors"
        >
          Voltar para a página inicial
        </a>
      </div>
    </div>
  );
}
