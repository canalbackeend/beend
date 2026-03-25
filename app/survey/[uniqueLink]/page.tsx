import { SurveyForm } from './_components/survey-form';
import type { Viewport } from 'next';

export const dynamic = 'force-dynamic';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

interface Props {
  params: { uniqueLink: string };
}

export default function SurveyPage({ params }: Props) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-6 px-3 overflow-x-hidden">
      <SurveyForm uniqueLink={params.uniqueLink} />
    </div>
  );
}
