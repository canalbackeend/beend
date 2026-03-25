export default function TerminalV2Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Forçar dark mode IMEDIATAMENTE
                document.documentElement.classList.add('dark');
                document.documentElement.style.colorScheme = 'dark';
                
                // Remover qualquer tema salvo no localStorage que possa interferir
                try {
                  localStorage.removeItem('theme');
                  localStorage.removeItem('color-scheme');
                } catch (e) {}
                
                // Garantir que dark mode persiste
                const observer = new MutationObserver(function() {
                  if (!document.documentElement.classList.contains('dark')) {
                    document.documentElement.classList.add('dark');
                  }
                });
                
                observer.observe(document.documentElement, {
                  attributes: true,
                  attributeFilter: ['class']
                });
              })();
            `,
          }}
        />
      </head>
      <body className="dark:bg-gray-900 dark:text-white">
        {children}
      </body>
    </html>
  );
}
