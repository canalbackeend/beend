'use client';

import { useEffect, useState } from 'react';

export function Footer() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <footer className="py-6 text-center text-xs text-muted-foreground space-y-1">
      <p className="font-medium">
        © Backeend {new Date().getFullYear()} - Todos os direitos reservados
      </p>
      <p>
        <strong>Suporte Técnico:</strong>{' '}
        <a 
          href="mailto:suporte@backeend.com.br" 
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          suporte@backeend.com.br
        </a>
        {' '}- Tel.:{' '}
        <a 
          href="https://wa.me/5561995957461" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-green-600 dark:text-green-400 hover:underline"
        >
          +55 (61) 9 9595-7461
        </a>
      </p>
      <p>Brasília/DF - Brasil</p>
    </footer>
  );
}
