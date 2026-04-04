import { NextRequest, NextResponse } from 'next/server';
import { existsSync, createReadStream } from 'fs';
import { join, extname } from 'path';

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const filePath = searchParams.get('path');

  if (!filePath) {
    return NextResponse.json({ error: 'No path provided' }, { status: 400 });
  }

  // Decode URL encoding first
  let decodedPath = decodeURIComponent(filePath);

  // Additional check for any encoding attempts
  try {
    decodedPath = decodedPath.normalize('NFC');
  } catch (e) {
    return NextResponse.json({ error: 'Invalid path encoding' }, { status: 400 });
  }

  // Check for directory traversal attempts
  if (decodedPath.includes('..') || decodedPath.startsWith('/') || decodedPath.includes(':')) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  // Sanitize path
  const sanitizedPath = decodedPath.replace(/[^a-zA-Z0-9._\-/]/g, '');

  // Validate file extension
  const ext = extname(sanitizedPath).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return NextResponse.json({ error: 'File type not allowed' }, { status: 403 });
  }
  
  // Try multiple base directories
  const possiblePaths = [
    join('/app/uploads', sanitizedPath),
    join(process.cwd(), 'public', 'uploads', sanitizedPath),
    join('/uploads', sanitizedPath),
  ];
  
  let fullPath = '';
  for (const p of possiblePaths) {
    if (existsSync(p)) {
      fullPath = p;
      break;
    }
  }

  if (!fullPath) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  const contentType = ext === '.png' ? 'image/png' : 
                      ext === '.gif' ? 'image/gif' : 
                      ext === '.webp' ? 'image/webp' : 
                      ext === '.svg' ? 'image/svg+xml' : 'image/jpeg';

  const stream = createReadStream(fullPath);

  return new NextResponse(stream as any, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000',
    },
  });
}
