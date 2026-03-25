import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { deleteFile } from '@/lib/s3';

export const dynamic = 'force-dynamic';

// DELETE - Remover imagem da biblioteca
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Buscar a imagem
    const image = await prisma.proposalLibraryImage.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!image) {
      return NextResponse.json({ error: 'Imagem não encontrada' }, { status: 404 });
    }

    // Deletar do S3 se tiver o caminho
    if (image.cloudStoragePath) {
      try {
        await deleteFile(image.cloudStoragePath);
      } catch (s3Error) {
        console.error('Error deleting from S3:', s3Error);
        // Continua para deletar do banco mesmo se falhar no S3
      }
    }

    // Deletar do banco
    await prisma.proposalLibraryImage.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting library image:', error);
    return NextResponse.json({ error: 'Erro ao deletar imagem' }, { status: 500 });
  }
}
