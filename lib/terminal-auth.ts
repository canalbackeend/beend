import { verify } from 'jsonwebtoken';
import { cookies } from 'next/headers';

const getJwtSecret = (): string => {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error('NEXTAUTH_SECRET environment variable is required for terminal authentication');
  }
  return secret;
};

export interface TerminalSession {
  terminalId: string;
  terminalName: string;
  terminalEmail: string;
  campaignId: string;
  userId: string;
  type: 'terminal';
}

export async function getTerminalSession(): Promise<TerminalSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('terminal-token');

    if (!token) {
      return null;
    }

    const decoded = verify(token.value, getJwtSecret()) as TerminalSession;

    if (decoded.type !== 'terminal') {
      return null;
    }

    return decoded;
  } catch (error) {
    console.error('Error verifying terminal token:', error);
    return null;
  }
}
