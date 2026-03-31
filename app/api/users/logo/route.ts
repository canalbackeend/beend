import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { generatePresignedUploadUrl, deleteFile, getFileUrl, uploadToS3 } from '@/lib/s3';
import { supabase, uploadToSupabase, hasSupabaseConfig } from '@/lib/supabase';
import { logActivity, ActivityAction, EntityType } from '@/lib/activity-log';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

// POST - Gerar URL pré-assinada para upload de logo
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const body = await request.json();
    const { fileName, contentType } = body;

    if (!fileName || !contentType) {
      return NextResponse.json(
        { error: 'Nome do arquivo e tipo de conteúdo são obrigatórios' },
        { status: 400 }
      );
    }

    // Validar tipo de arquivo (apenas imagens)
    if (!contentType.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Apenas arquivos de imagem são permitidos' },
        { status: 400 }
      );
    }

    // Gerar nome único
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const extension = fileName.split('.').pop();
    const cleanFileName = `${timestamp}-${random}.${extension}`;

    // Verificar configuração do Supabase
    if (hasSupabaseConfig()) {
      // Retornar URL de upload direto para o frontend usar
      return NextResponse.json({
        uploadUrl: null,
        cloud_storage_path: `logos/${user.id}/${cleanFileName}`,
        supabaseMode: true,
        localMode: false,
      });
    }

    // Verificar se tem AWS configurado
    const hasAwsConfig = process.env.AWS_BUCKET_NAME && 
                         process.env.AWS_ACCESS_KEY_ID && 
                         process.env.AWS_SECRET_ACCESS_KEY;

    // Se não tem AWS, salvar localmente
    if (!hasAwsConfig) {
      try {
        const baseDir = process.env.UPLOAD_DIR || '/app/uploads';
        const logoDir = path.join(baseDir, 'logos', user.id);
        if (!existsSync(logoDir)) {
          await mkdir(logoDir, { recursive: true });
        }

        return NextResponse.json({
          uploadUrl: null,
          cloud_storage_path: `uploads/logos/${user.id}/${cleanFileName}`,
          localMode: true,
        });
      } catch (localError) {
        console.error('Local logo setup failed:', localError);
        throw localError;
      }
    }

    // Tem AWS configurado: usar S3
    const { uploadUrl, cloud_storage_path } = await generatePresignedUploadUrl(
      fileName,
      contentType,
      true
    );

    return NextResponse.json({
      uploadUrl,
      cloud_storage_path,
      localMode: false,
    });
  } catch (error) {
    console.error('Error generating upload URL:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar URL de upload' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar logoUrl no perfil do usuário
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const body = await request.json();
    const { cloud_storage_path, logoUrl: directUrl, isBase64 } = body;

    // Deletar logo antiga se existir
    if (user.logoUrl) {
      try {
        // Verificar se tem AWS configurado
        const hasAwsConfig = process.env.AWS_BUCKET_NAME && 
                             process.env.AWS_ACCESS_KEY_ID && 
                             process.env.AWS_SECRET_ACCESS_KEY;
        
        if (!hasAwsConfig && user.logoUrl.includes('/api/uploads')) {
          // URL local - não precisa deletar arquivo
        } else if (user.logoUrl.includes('.amazonaws.com/')) {
          // URL S3 - deletar
          const oldPath = user.logoUrl.split('.amazonaws.com/')[1];
          if (oldPath) {
            await deleteFile(oldPath);
          }
        }
      } catch (error) {
        console.error('Error deleting old logo:', error);
      }
    }

    let logoUrl: string;

    // Verificar configuração do Supabase
    const hasSupabase = hasSupabaseConfig();
    
    // Verificar se tem AWS configurado
    const hasAwsConfig = process.env.AWS_BUCKET_NAME && 
                         process.env.AWS_ACCESS_KEY_ID && 
                         process.env.AWS_SECRET_ACCESS_KEY;

    // Se tem Supabase, usar URL pública do Supabase
    if (hasSupabase && supabase && cloud_storage_path) {
      const { data } = supabase.storage.from('uploads').getPublicUrl(cloud_storage_path);
      console.log('Supabase public URL:', data.publicUrl);
      logoUrl = data.publicUrl;
    }
    // Se não tem AWS, usar URL local via API
    else if (!hasAwsConfig && directUrl) {
      // Converter caminho para URL da API
      const fileName = directUrl.split('/').pop();
      logoUrl = `/api/uploads?path=logos/${user.id}/${fileName}`;
    }
    // Tem AWS: usar S3
    else if (hasAwsConfig && cloud_storage_path) {
      logoUrl = await getFileUrl(cloud_storage_path, true);
    } else {
      return NextResponse.json(
        { error: 'Caminho do arquivo é obrigatório' },
        { status: 400 }
      );
    }

    // Atualizar usuário
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { logoUrl },
    });

    // Registrar atividade
    await logActivity({
      userId: user.id,
      action: ActivityAction.UPLOAD_LOGO,
      entityType: EntityType.USER,
      entityId: user.id,
      entityName: user.name,
      description: `Logo da empresa atualizada`,
    });

    return NextResponse.json({ logoUrl: updatedUser.logoUrl });
  } catch (error) {
    console.error('Error updating logo:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar logo' },
      { status: 500 }
    );
  }
}

// DELETE - Remover logo
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    if (!user.logoUrl) {
      return NextResponse.json({ message: 'Nenhuma logo para remover' });
    }

    // Deletar arquivo do S3
    try {
      const cloudPath = user.logoUrl.split('.amazonaws.com/')[1];
      if (cloudPath) {
        await deleteFile(cloudPath);
      }
    } catch (error) {
      console.error('Error deleting logo from S3:', error);
    }

    // Atualizar banco
    await prisma.user.update({
      where: { id: user.id },
      data: { logoUrl: null },
    });

    return NextResponse.json({ message: 'Logo removida com sucesso' });
  } catch (error) {
    console.error('Error removing logo:', error);
    return NextResponse.json(
      { error: 'Erro ao remover logo' },
      { status: 500 }
    );
  }
}
