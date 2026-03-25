import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { generatePresignedUploadUrl, getFileUrl } from '@/lib/s3';

export const dynamic = 'force-dynamic';

// GET - Listar imagens da biblioteca do usuário
export async function GET(request: NextRequest) {
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

    const images = await prisma.proposalLibraryImage.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(images);
  } catch (error) {
    console.error('Error fetching library images:', error);
    return NextResponse.json({ error: 'Erro ao buscar imagens' }, { status: 500 });
  }
}

// POST - Obter URL de upload ou salvar imagem na biblioteca
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
    const { action, fileName, contentType, caption, cloudStoragePath } = body;

    // Ação: obter URL de upload
    if (action === 'get-upload-url') {
      if (!fileName || !contentType) {
        return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
      }

      // Gerar URL pré-assinada para upload
      const { uploadUrl, cloud_storage_path } = await generatePresignedUploadUrl(
        `proposal-images/${user.id}/${fileName}`,
        contentType,
        true // Imagens de propostas são públicas
      );

      return NextResponse.json({
        uploadUrl,
        cloudStoragePath: cloud_storage_path,
      });
    }

    // Ação: salvar imagem na biblioteca após upload
    if (action === 'save') {
      if (!cloudStoragePath) {
        return NextResponse.json({ error: 'Caminho da imagem não informado' }, { status: 400 });
      }

      // Obter URL pública da imagem
      const imageUrl = await getFileUrl(cloudStoragePath, true);

      // Salvar na biblioteca
      const libraryImage = await prisma.proposalLibraryImage.create({
        data: {
          userId: user.id,
          imageUrl,
          cloudStoragePath,
          caption: caption || 'Imagem personalizada',
        },
      });

      return NextResponse.json(libraryImage);
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
  } catch (error) {
    console.error('Error handling library image:', error);
    return NextResponse.json({ error: 'Erro ao processar imagem' }, { status: 500 });
  }
}
