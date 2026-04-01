import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { generatePresignedUploadUrl, getFileUrl } from '@/lib/s3';
import { supabase, hasSupabaseConfig } from '@/lib/supabase';

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

      // Verificar se tem Supabase configurado
      if (hasSupabaseConfig() && supabase) {
        try {
          const timestamp = Date.now();
          const random = Math.random().toString(36).substring(7);
          const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
          const key = `proposal-images/${user.id}/${timestamp}-${random}-${cleanFileName}`;
          
          // Gerar URL de upload via Supabase
          const { data: signData, error: signError } = await supabase.storage
            .from('uploads')
            .createSignedUploadUrl(key);

          if (signError) {
            throw new Error(`Failed to create signed URL: ${signError.message}`);
          }

          if (!signData) {
            throw new Error('No signed URL returned');
          }

          return NextResponse.json({
            uploadUrl: signData.signedUrl,
            cloudStoragePath: key,
            useSupabase: true
          });
        } catch (supabaseError) {
          console.error('Supabase upload error:', supabaseError);
        }
      }

      // Usar S3 (comportamento original)
      const { uploadUrl, cloud_storage_path } = await generatePresignedUploadUrl(
        `proposal-images/${user.id}/${fileName}`,
        contentType,
        true
      );

      return NextResponse.json({
        uploadUrl,
        cloudStoragePath: cloud_storage_path,
        useSupabase: false
      });
    }

    // Ação: salvar imagem na biblioteca após upload
    if (action === 'save') {
      if (!cloudStoragePath) {
        return NextResponse.json({ error: 'Caminho da imagem não informado' }, { status: 400 });
      }

      let imageUrl: string;

      // Verificar se foi usado Supabase ou S3
      if (hasSupabaseConfig() && supabase) {
        // Obter URL pública do Supabase
        const { data: urlData } = supabase.storage
          .from('uploads')
          .getPublicUrl(cloudStoragePath);
        imageUrl = urlData.publicUrl;
      } else {
        // Obter URL pública do S3
        imageUrl = await getFileUrl(cloudStoragePath, true);
      }

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

// DELETE - Remover imagem da biblioteca
export async function DELETE(request: NextRequest) {
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

    // Extrair ID da URL
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();

    if (!id) {
      return NextResponse.json({ error: 'ID da imagem não informado' }, { status: 400 });
    }

    // Verificar se a imagem pertence ao usuário
    const image = await prisma.proposalLibraryImage.findFirst({
      where: { id, userId: user.id },
    });

    if (!image) {
      return NextResponse.json({ error: 'Imagem não encontrada' }, { status: 404 });
    }

    // Remover do storage (Supabase ou S3)
    if (image.cloudStoragePath && hasSupabaseConfig() && supabase) {
      try {
        await supabase.storage
          .from('uploads')
          .remove([image.cloudStoragePath]);
      } catch (supabaseError) {
        console.error('Supabase delete error:', supabaseError);
      }
    }

    // Remover do banco
    await prisma.proposalLibraryImage.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting library image:', error);
    return NextResponse.json({ error: 'Erro ao remover imagem' }, { status: 500 });
  }
}
