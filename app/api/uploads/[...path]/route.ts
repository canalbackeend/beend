import { NextRequest, NextResponse } from 'next/server';
import { existsSync, createReadStream } from 'fs';
import { join } from 'path';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const filePath = searchParams.get('path');

  if (!filePath) {
    return NextResponse.json({ error: 'No path provided' }, { status: 400 });
  }

  // Sanitize path to prevent directory traversal
  const sanitizedPath = filePath.replace(/\.\./g, '');
  const fullPath = join('/app/uploads', sanitizedPath);

  if (!existsSync(fullPath)) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  const stream = createReadStream(fullPath);
  const ext = fullPath.split('.').pop() || 'jpg';
  const contentType = ext === 'png' ? 'image/png' : 
                      ext === 'gif' ? 'image/gif' : 
                      ext === 'webp' ? 'image/webp' : 'image/jpeg';

  return new NextResponse(stream as any, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000',
    },
  });
}
