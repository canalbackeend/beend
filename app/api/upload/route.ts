import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { uploadToS3 } from '@/lib/s3';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string || 'employees';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    // Validar tamanho (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large' }, { status: 400 });
    }

    // Converter File para Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Gerar nome único
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const extension = file.name.split('.').pop();
    const fileName = `${timestamp}-${random}.${extension}`;

    // Determinar o tipo de upload
    const uploadType = type === 'logo' ? 'logos' : 'employees';

    // Verificar se tem AWS configurado
    const hasAwsConfig = process.env.AWS_BUCKET_NAME && 
                         process.env.AWS_ACCESS_KEY_ID && 
                         process.env.AWS_SECRET_ACCESS_KEY;

    // Se não tem AWS, salvar localmente (com Persistent Storage do Coolify)
    if (!hasAwsConfig) {
      try {
        // Usar diretório configurável ou padrão
        const baseDir = process.env.UPLOAD_DIR || '/app/uploads';
        const userDir = path.join(baseDir, uploadType, session.user.id);
        
        if (!existsSync(userDir)) {
          await mkdir(userDir, { recursive: true });
        }

        // Salvar arquivo
        const filePath = path.join(userDir, fileName);
        await writeFile(filePath, buffer);

        // Retornar URL
        const url = `/uploads/${uploadType}/${session.user.id}/${fileName}`;
        return NextResponse.json({ url });
      } catch (localError) {
        console.error('Local upload failed:', localError);
        throw localError;
      }
    }

    // Tem AWS configurado: usar S3
    try {
      const key = `${uploadType}/${session.user.id}/${fileName}`;
      const url = await uploadToS3(buffer, key, file.type);
      return NextResponse.json({ url });
    } catch (uploadError) {
      console.error('S3 upload failed:', uploadError);
      throw uploadError;
    }
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}