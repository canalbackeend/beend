import { ReactNode } from 'react';

export const metadata = {
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover',
  },
  themeColor: '#111827',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Pesquisa de Satisfação',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export default function SurveyLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <meta name="theme-color" content="#111827" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
      />
      {children}
    </>
  );
}
