import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// API de notificação da Abacus AI
const NOTIFICATION_API_URL = 'https://apps.abacus.ai/api/sendNotificationEmail';
const ABACUSAI_API_KEY = process.env.ABACUSAI_API_KEY;

// POST - Enviar campanha de email
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Buscar campanha com lista de contatos
    const campaign = await prisma.emailCampaign.findFirst({
      where: { id, userId: user.id },
      include: {
        terminal: {
          include: {
            campaigns: {
              include: {
                campaign: {
                  select: { title: true, uniqueLink: true }
                }
              },
              where: { isActive: true },
              orderBy: { order: 'asc' },
              take: 1,
            }
          }
        },
        contactList: {
          include: {
            contacts: true
          }
        },
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campanha não encontrada' }, { status: 404 });
    }

    if (campaign.status === 'SENT' || campaign.status === 'SENDING') {
      return NextResponse.json({ error: 'Campanha já foi enviada' }, { status: 400 });
    }

    if (!campaign.contactList || campaign.contactList.contacts.length === 0) {
      return NextResponse.json({ error: 'Nenhum contato na lista selecionada' }, { status: 400 });
    }

    const contacts = campaign.contactList.contacts;
    const totalToSend = contacts.length;

    // Verificar créditos
    if (user.emailCredits < totalToSend) {
      return NextResponse.json({
        error: `Créditos insuficientes. Você tem ${user.emailCredits} créditos e precisa de ${totalToSend}`,
        creditsNeeded: totalToSend,
        creditsAvailable: user.emailCredits,
      }, { status: 400 });
    }

    // Atualizar status da campanha para enviando
    await prisma.emailCampaign.update({
      where: { id },
      data: { status: 'SENDING' },
    });

    // Construir URL da pesquisa
    const appUrl = process.env.NEXTAUTH_URL || 'https://beend.app';
    
    // Pegar a primeira campanha vinculada ao terminal
    const terminalCampaign = campaign.terminal.campaigns[0]?.campaign;
    const surveyLink = campaign.terminal.uniqueLink
      ? `${appUrl}/terminal-v2/survey/${campaign.terminal.uniqueLink}`
      : terminalCampaign?.uniqueLink
        ? `${appUrl}/survey/${terminalCampaign.uniqueLink}`
        : `${appUrl}`;

    // Template do email com visual de pesquisa de satisfação
    const generateEmailHtml = (contactName: string | null, trackingId: string) => {
      const logoUrl = user.logoUrl || `${appUrl}/logo.png`;
      const displayName = contactName || 'Prezado(a) Cliente';
      const companyName = user.companyName || 'Nossa Empresa';
      
      return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;background-color:#f0f4f8;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f4f8;padding:30px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
          
          <!-- Header com Logo -->
          <tr>
            <td style="padding:25px 30px;text-align:center;border-bottom:1px solid #eef2f6;">
              <img src="${logoUrl}" alt="${companyName}" style="max-width:160px;max-height:60px;object-fit:contain;" />
            </td>
          </tr>
          
          <!-- Banner Visual de Pesquisa -->
          <tr>
            <td style="background:#f7f7f7;padding:35px 30px;text-align:center;border-bottom:1px solid #e5e7eb;">
              <!-- Carinhas de Satisfação -->
              <div style="margin-bottom:20px;">
                <span style="font-size:42px;margin:0 8px;">😞</span>
                <span style="font-size:42px;margin:0 8px;">😐</span>
                <span style="font-size:42px;margin:0 8px;">🙂</span>
                <span style="font-size:42px;margin:0 8px;">😊</span>
                <span style="font-size:42px;margin:0 8px;">😍</span>
              </div>
              <h1 style="color:#333333;margin:0;font-size:26px;font-weight:700;">
                📋 Pesquisa de Satisfação
              </h1>
              <p style="color:#555555;margin:10px 0 0 0;font-size:15px;">
                Sua opinião é muito importante para nós!
              </p>
            </td>
          </tr>
          
          <!-- Conteúdo Principal -->
          <tr>
            <td style="padding:35px 35px 25px 35px;">
              <p style="color:#374151;font-size:17px;line-height:1.6;margin:0 0 20px 0;">
                Olá, <strong>${displayName}</strong>! 👋
              </p>
              
              <div style="color:#4b5563;font-size:15px;line-height:1.8;margin-bottom:25px;white-space:pre-line;">${campaign.bodyText}</div>
              
              <!-- Card de Destaque -->
              <div style="background:linear-gradient(135deg,#fef3c7 0%,#fde68a 100%);border-radius:12px;padding:20px;margin:25px 0;border-left:4px solid #f59e0b;">
                <div style="display:flex;align-items:center;">
                  <span style="font-size:28px;margin-right:12px;">📣</span>
                  <div>
                    <p style="color:#92400e;font-size:14px;font-weight:600;margin:0;">Leva apenas 2 minutos!</p>
                    <p style="color:#a16207;font-size:13px;margin:5px 0 0 0;">Responda nossa pesquisa e nos ajude a melhorar.</p>
                  </div>
                </div>
              </div>
              
              <!-- Botão CTA Principal -->
              <div style="text-align:center;margin:30px 0;">
                <a href="${surveyLink}?track=${trackingId}" style="display:inline-block;background:linear-gradient(135deg,#10b981 0%,#059669 100%);color:white;padding:18px 50px;text-decoration:none;border-radius:50px;font-weight:bold;font-size:17px;box-shadow:0 4px 15px rgba(16,185,129,0.4);transition:all 0.3s;">
                  ✨ Responder Pesquisa
                </a>
              </div>
              
              <!-- Escala NPS Visual -->
              <div style="text-align:center;margin:30px 0 20px 0;padding:20px;background:#f8fafc;border-radius:12px;">
                <p style="color:#64748b;font-size:12px;margin:0 0 12px 0;text-transform:uppercase;letter-spacing:1px;">Como você avalia nosso atendimento?</p>
                <div style="display:inline-block;">
                  <span style="display:inline-block;width:28px;height:28px;line-height:28px;background:#ef4444;color:white;border-radius:6px;margin:2px;font-size:12px;font-weight:bold;">0</span>
                  <span style="display:inline-block;width:28px;height:28px;line-height:28px;background:#f97316;color:white;border-radius:6px;margin:2px;font-size:12px;font-weight:bold;">1</span>
                  <span style="display:inline-block;width:28px;height:28px;line-height:28px;background:#f97316;color:white;border-radius:6px;margin:2px;font-size:12px;font-weight:bold;">2</span>
                  <span style="display:inline-block;width:28px;height:28px;line-height:28px;background:#fb923c;color:white;border-radius:6px;margin:2px;font-size:12px;font-weight:bold;">3</span>
                  <span style="display:inline-block;width:28px;height:28px;line-height:28px;background:#fbbf24;color:white;border-radius:6px;margin:2px;font-size:12px;font-weight:bold;">4</span>
                  <span style="display:inline-block;width:28px;height:28px;line-height:28px;background:#fbbf24;color:white;border-radius:6px;margin:2px;font-size:12px;font-weight:bold;">5</span>
                  <span style="display:inline-block;width:28px;height:28px;line-height:28px;background:#facc15;color:white;border-radius:6px;margin:2px;font-size:12px;font-weight:bold;">6</span>
                  <span style="display:inline-block;width:28px;height:28px;line-height:28px;background:#a3e635;color:white;border-radius:6px;margin:2px;font-size:12px;font-weight:bold;">7</span>
                  <span style="display:inline-block;width:28px;height:28px;line-height:28px;background:#4ade80;color:white;border-radius:6px;margin:2px;font-size:12px;font-weight:bold;">8</span>
                  <span style="display:inline-block;width:28px;height:28px;line-height:28px;background:#22c55e;color:white;border-radius:6px;margin:2px;font-size:12px;font-weight:bold;">9</span>
                  <span style="display:inline-block;width:28px;height:28px;line-height:28px;background:#16a34a;color:white;border-radius:6px;margin:2px;font-size:12px;font-weight:bold;">10</span>
                </div>
                <div style="margin-top:8px;">
                  <span style="color:#ef4444;font-size:11px;">Nada provável</span>
                  <span style="color:#9ca3af;font-size:11px;margin:0 30px;">•</span>
                  <span style="color:#16a34a;font-size:11px;">Muito provável</span>
                </div>
              </div>
            </td>
          </tr>
          
          <!-- Link alternativo -->
          <tr>
            <td style="padding:0 35px 25px 35px;">
              <p style="color:#9ca3af;font-size:12px;margin:0;padding-top:20px;border-top:1px solid #e5e7eb;">
                Não consegue clicar no botão? Copie este link:<br/>
                <a href="${surveyLink}?track=${trackingId}" style="color:#667eea;word-break:break-all;font-size:11px;">${surveyLink}?track=${trackingId}</a>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;padding:25px 35px;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="color:#6b7280;font-size:13px;margin:0 0 8px 0;font-weight:600;">
                ${companyName}
              </p>
              <p style="color:#9ca3af;font-size:11px;margin:0;">
                Pesquisa enviada via <a href="https://beend.app" style="color:#667eea;text-decoration:none;font-weight:500;">Beend</a> • Plataforma de Pesquisas de Satisfação
              </p>
            </td>
          </tr>
        </table>
        
        <!-- Texto Legal -->
        <p style="color:#9ca3af;font-size:10px;margin:20px 0 0 0;text-align:center;">
          Você recebeu este email porque é cliente de ${companyName}.<br/>
          Sua opinião nos ajuda a melhorar continuamente.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
    };

    // Enviar emails em lote
    let sentCount = 0;
    let errorCount = 0;
    const sendPromises = contacts.map(async (contact) => {
      const trackingId = `${id}-${contact.id}-${Date.now()}`;
      
      // Criar registro de envio
      const emailSend = await prisma.emailSend.create({
        data: {
          emailCampaignId: id,
          contactId: contact.id,
          trackingId,
          status: 'PENDING',
        },
      });

      try {
        // Enviar email via API de notificação Abacus AI
        const emailResponse = await fetch(NOTIFICATION_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            deployment_token: ABACUSAI_API_KEY,
            recipient_email: contact.email,
            subject: campaign.subject,
            body: generateEmailHtml(contact.name, trackingId),
            is_html: true,
            sender_email: `noreply@beend.app`,
            sender_alias: user.companyName || 'Beend',
          }),
        });

        const result = await emailResponse.json().catch(() => ({}));
        
        if (emailResponse.ok && result.success) {
          await prisma.emailSend.update({
            where: { id: emailSend.id },
            data: { status: 'SENT', sentAt: new Date() },
          });
          sentCount++;
        } else {
          await prisma.emailSend.update({
            where: { id: emailSend.id },
            data: { status: 'FAILED', errorMessage: result.message || 'Falha no envio' },
          });
          errorCount++;
        }
      } catch (error) {
        console.error(`Error sending to ${contact.email}:`, error);
        await prisma.emailSend.update({
          where: { id: emailSend.id },
          data: { status: 'FAILED', errorMessage: 'Erro de conexão' },
        });
        errorCount++;
      }
    });

    await Promise.all(sendPromises);

    // Atualizar campanha com resultados
    await prisma.emailCampaign.update({
      where: { id },
      data: {
        status: 'SENT',
        sentAt: new Date(),
        sentEmails: sentCount,
        totalEmails: totalToSend,
      },
    });

    // Descontar créditos
    const creditsToDeduct = sentCount;
    await prisma.user.update({
      where: { id: user.id },
      data: { emailCredits: { decrement: creditsToDeduct } },
    });

    // Registrar transação de créditos
    await prisma.emailCreditTransaction.create({
      data: {
        userId: user.id,
        amount: -creditsToDeduct,
        balance: user.emailCredits - creditsToDeduct,
        type: 'EMAIL_SENT',
        description: `Campanha: ${campaign.name}`,
        reference: id,
      },
    });

    return NextResponse.json({
      success: true,
      sent: sentCount,
      failed: errorCount,
      total: totalToSend,
      creditsUsed: creditsToDeduct,
      creditsRemaining: user.emailCredits - creditsToDeduct,
    });
  } catch (error) {
    console.error('Error sending email campaign:', error);
    return NextResponse.json({ error: 'Erro ao enviar campanha' }, { status: 500 });
  }
}
