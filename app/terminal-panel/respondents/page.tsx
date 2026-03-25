import { TerminalPanelWrapper } from '../_components/terminal-panel-wrapper';
import dynamic from 'next/dynamic';

const RespondentsContent = dynamic(() => import('./_respondents-content').then(mod => ({ default: mod.default })), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-16">
      <div className="text-center">
        <div className="text-4xl mb-4">⌛</div>
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    </div>
  ),
});

export default async function TerminalPanelRespondents() {
  return (
    <TerminalPanelWrapper>
      <RespondentsContent />
    </TerminalPanelWrapper>
  );
}
