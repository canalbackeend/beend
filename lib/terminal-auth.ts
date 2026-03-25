import { verify } from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'your-secret-key';

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

    const decoded = verify(token.value, JWT_SECRET) as TerminalSession;

    if (decoded.type !== 'terminal') {
      return null;
    }

    return decoded;
  } catch (error) {
    console.error('Error verifying terminal token:', error);
    return null;
  }
}
