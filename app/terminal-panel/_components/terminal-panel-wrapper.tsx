import { getTerminalSession } from '@/lib/terminal-auth';
import { redirect } from 'next/navigation';
import { TerminalNavbar } from './terminal-navbar';
import prisma from '@/lib/db';
import { Footer } from '@/components/footer';

export async function TerminalPanelWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getTerminalSession();

  // Se não houver sessão, redirecionar para login
  if (!session) {
    redirect('/terminal-panel/login');
  }

  // Buscar dados do terminal e usuário pai
  const terminal = await prisma.terminal.findUnique({
    where: { id: session.terminalId },
    include: {
      campaigns: {
        include: {
          campaign: {
            select: {
              title: true,
            },
          },
        },
        where: { isActive: true },
        orderBy: { order: 'asc' },
      },
      user: {
        select: {
          logoUrl: true,
        },
      },
    },
  });

  // Pegar título da primeira campanha ativa
  const campaignTitle = terminal?.campaigns[0]?.campaign?.title || undefined;

  return (
    <div className="min-h-screen flex flex-col">
      <TerminalNavbar
        terminalName={terminal?.name}
        campaignTitle={campaignTitle}
        logoUrl={terminal?.user?.logoUrl || undefined}
      />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        {children}
      </main>
      <Footer />
    </div>
  );
}
