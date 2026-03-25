import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { generatePresignedUploadUrl, deleteFile, getFileUrl } from '@/lib/s3';
import { logActivity, ActivityAction, EntityType } from '@/lib/activity-log';

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

    const { uploadUrl, cloud_storage_path } = await generatePresignedUploadUrl(
      fileName,
      contentType,
      true // Logo sempre pública
    );

    return NextResponse.json({
      uploadUrl,
      cloud_storage_path,
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
    const { cloud_storage_path } = body;

    if (!cloud_storage_path) {
      return NextResponse.json(
        { error: 'Caminho do arquivo é obrigatório' },
        { status: 400 }
      );
    }

    // Deletar logo antiga se existir
    if (user.logoUrl) {
      try {
        // Extrair cloud_storage_path da logoUrl antiga
        const oldPath = user.logoUrl.split('.amazonaws.com/')[1];
        if (oldPath) {
          await deleteFile(oldPath);
        }
      } catch (error) {
        console.error('Error deleting old logo:', error);
        // Continuar mesmo se falhar ao deletar
      }
    }

    // Gerar URL pública da nova logo
    const logoUrl = await getFileUrl(cloud_storage_path, true);

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
