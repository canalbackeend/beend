import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET - Buscar campanha específica
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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

    const campaign = await prisma.campaign.findUnique({
      where: { id: params.id },
      include: {
        questions: {
          orderBy: { order: 'asc' },
          include: {
            options: { orderBy: { order: 'asc' } },
          },
        },
        user: { select: { email: true, name: true } },
        _count: { select: { responses: true } },
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campanha não encontrada' }, { status: 404 });
    }

    // Verificar propriedade - usuário deve ser dono da campanha
    if (campaign.userId !== user.id) {
      return NextResponse.json({ error: 'Sem permissão para acessar esta campanha' }, { status: 403 });
    }

    return NextResponse.json(campaign);
  } catch (error) {
    console.error('Error fetching campaign:', error);
    return NextResponse.json({ error: 'Erro ao buscar campanha' }, { status: 500 });
  }
}

// PUT - Atualizar campanha
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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

    const campaign = await prisma.campaign.findUnique({
      where: { id: params.id },
    });

    if (!campaign || campaign.userId !== user.id) {
      return NextResponse.json({ error: 'Campanha não encontrada ou sem permissão' }, { status: 404 });
    }

    const body = await request.json();
    const { title, description, status, questions, lgpdText, collectName, collectPhone, collectEmail, resetData } = body;

    // Atualizar campanha
    const updatedCampaign = await prisma.campaign.update({
      where: { id: params.id },
      data: {
        title: title || campaign.title,
        description: description !== undefined ? description : campaign.description,
        status: status || campaign.status,
        lgpdText: lgpdText !== undefined ? lgpdText : campaign.lgpdText,
        collectName: collectName !== undefined ? collectName : campaign.collectName,
        collectPhone: collectPhone !== undefined ? collectPhone : campaign.collectPhone,
        collectEmail: collectEmail !== undefined ? collectEmail : campaign.collectEmail,
      },
    });

    // Se houver perguntas, atualizar
    if (questions && Array.isArray(questions)) {
      // Verificar se existem respostas
      const responseCount = await prisma.response.count({
        where: { campaignId: params.id },
      });

      // Se há respostas e não está marcado resetData, validar mudanças
      if (responseCount > 0 && !resetData) {
        const currentQuestions = await prisma.question.findMany({
          where: { campaignId: params.id },
          orderBy: { order: 'asc' },
        });

        const newQuestionIds = questions.filter((q: any) => q.id).map((q: any) => q.id);

        // Verificar perguntas removidas
        const removedQuestions = currentQuestions.filter(cq => !newQuestionIds.includes(cq.id));
        if (removedQuestions.length > 0) {
          return NextResponse.json(
            { error: `Você está tentando remover ${removedQuestions.length} pergunta(s). Isso requer reset dos dados. Por favor, salve novamente confirmando o reset.` },
            { status: 400 }
          );
        }

        // Verificar mudanças de tipo
        for (const q of questions) {
          if (!q.id) continue;
          const originalQ = currentQuestions.find(cq => cq.id === q.id);
          if (originalQ && originalQ.type !== q.type) {
            return NextResponse.json(
              { error: `Você está alterando o tipo da pergunta "${q.text.substring(0, 30)}..." de ${originalQ.type} para ${q.type}. Isso requer reset dos dados. Por favor, salve novamente confirmando o reset.` },
              { status: 400 }
            );
          }
        }

        // Verificar mudanças de isRequired
        for (const q of questions) {
          if (!q.id) continue;
          const originalQ = currentQuestions.find(cq => cq.id === q.id);
          if (originalQ && originalQ.isRequired !== q.isRequired) {
            return NextResponse.json(
              { error: `Você está alterando a obrigatoriedade da pergunta "${q.text.substring(0, 30)}...". Isso requer reset dos dados. Por favor, salve novamente confirmando o reset.` },
              { status: 400 }
            );
          }
        }
      }

      // Agora proceed com update (safe or reset)
      if (resetData) {
        await prisma.response.deleteMany({
          where: { campaignId: params.id },
        });
        
        await prisma.question.deleteMany({
          where: { campaignId: params.id },
        });

        // Criar novas perguntas com opções
        for (let i = 0; i < questions.length; i++) {
          const q = questions[i];
          await prisma.question.create({
            data: {
              campaignId: params.id,
              text: q.text,
              type: q.type || 'SMILE',
              isRequired: q.isRequired !== undefined ? q.isRequired : true,
              allowOptionalComment: q.allowOptionalComment !== undefined ? q.allowOptionalComment : false,
              order: q.order || i + 1,
              scaleMin: q.scaleMin,
              scaleMax: q.scaleMax,
              scaleMinLabel: q.scaleMinLabel,
              scaleMaxLabel: q.scaleMaxLabel,
              options: q.options && q.options.length > 0 ? {
                create: q.options.map((opt: any, idx: number) => ({
                  text: opt.text,
                  color: opt.color || '#3b82f6',
                  imageUrl: opt.imageUrl,
                  order: opt.order ?? idx + 1,
                })),
              } : undefined,
            },
          });
        }
      } else {
        // Atualização segura - mantém as respostas existentes
        // Apenas atualiza texto, ordem e opções. Não deleta perguntas existentes.
        
        // Atualizar perguntas existentes
        for (let i = 0; i < questions.length; i++) {
          const q = questions[i];
          
          if (q.id) {
            // Atualizar pergunta existente (mantém dados)
            await prisma.question.update({
              where: { id: q.id },
              data: {
                text: q.text,
                order: q.order || i + 1,
                scaleMin: q.scaleMin,
                scaleMax: q.scaleMax,
                scaleMinLabel: q.scaleMinLabel,
                scaleMaxLabel: q.scaleMaxLabel,
              },
            });

            // Atualizar opções existentes em vez de deletar e recriar
            // Isso mantém os IDs e preserva as respostas antigas
            if (q.options && q.options.length > 0) {
              // Buscar opções atuais da pergunta
              const currentOptions = await prisma.questionOption.findMany({
                where: { questionId: q.id },
              });
              
              // Para cada opção enviada, atualizar se existir ou criar se não existir
              for (let optIdx = 0; optIdx < q.options.length; optIdx++) {
                const opt = q.options[optIdx];
                
                if (opt.id) {
                  // Atualizar opção existente
                  await prisma.questionOption.update({
                    where: { id: opt.id },
                    data: {
                      text: opt.text,
                      color: opt.color || '#3b82f6',
                      imageUrl: opt.imageUrl,
                      order: opt.order ?? optIdx + 1,
                    },
                  });
                } else {
                  // Criar nova opção (sem ID, é nova)
                  await prisma.questionOption.create({
                    data: {
                      questionId: q.id,
                      text: opt.text,
                      color: opt.color || '#3b82f6',
                      imageUrl: opt.imageUrl,
                      order: opt.order ?? optIdx + 1,
                    },
                  });
                }
              }
              
              // Opcional: deletar opções que foram removidas
              // (comentado para manter compatibilidade - se quiser remover, descomente)
              // const newOptionIds = q.options.filter((o: any) => o.id).map((o: any) => o.id);
              // await prisma.questionOption.deleteMany({
              //   where: { 
              //     questionId: q.id,
              //     id: { notIn: newOptionIds }
              //   }
              // });
            }
          } else {
            // Criar nova pergunta (pergunta nova sem ID)
            await prisma.question.create({
              data: {
                campaignId: params.id,
                text: q.text,
                type: q.type || 'SMILE',
                isRequired: q.isRequired !== undefined ? q.isRequired : true,
                allowOptionalComment: q.allowOptionalComment !== undefined ? q.allowOptionalComment : false,
                order: q.order || i + 1,
                scaleMin: q.scaleMin,
                scaleMax: q.scaleMax,
                scaleMinLabel: q.scaleMinLabel,
                scaleMaxLabel: q.scaleMaxLabel,
                options: q.options && q.options.length > 0 ? {
                  create: q.options.map((opt: any, idx: number) => ({
                    text: opt.text,
                    color: opt.color || '#3b82f6',
                    imageUrl: opt.imageUrl,
                    order: opt.order ?? idx + 1,
                  })),
                } : undefined,
              },
            });
          }
        }
      }
    }

    const result = await prisma.campaign.findUnique({
      where: { id: params.id },
      include: {
        questions: {
          orderBy: { order: 'asc' },
          include: {
            options: { orderBy: { order: 'asc' } },
          },
        },
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating campaign:', error);
    return NextResponse.json({ error: 'Erro ao atualizar campanha' }, { status: 500 });
  }
}

// DELETE - Deletar campanha
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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

    const campaign = await prisma.campaign.findUnique({
      where: { id: params.id },
    });

    if (!campaign || campaign.userId !== user.id) {
      return NextResponse.json({ error: 'Campanha não encontrada ou sem permissão' }, { status: 404 });
    }

    await prisma.campaign.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    return NextResponse.json({ error: 'Erro ao deletar campanha' }, { status: 500 });
  }
}
