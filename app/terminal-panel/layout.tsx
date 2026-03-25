import { ReactNode } from 'react';

export const metadata = {
  title: 'Painel do Terminal - Pesquisa de Satisfação',
  description: 'Painel de visualização do terminal',
};

export default function TerminalPanelLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Layout neutro - a autenticação é verificada em cada página individual
  return <>{children}</>;
}
