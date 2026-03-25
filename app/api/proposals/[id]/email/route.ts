import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// Função para gerar o HTML do PDF
function generatePdfHtml(proposal: any, formatDate: (date: Date) => string, formatCurrency: (value: any) => string) {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Proposta ${proposal.proposalNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 10pt; line-height: 1.5; color: #333; background: white; }
    .page { max-width: 210mm; margin: 0 auto; padding: 25mm 30mm; background: white; }
    .header { text-align: center; margin-bottom: 25px; }
    .logo { max-height: 50px; max-width: 180px; margin-bottom: 8px; }
    .title { font-size: 14pt; font-weight: bold; color: #1a365d; text-transform: uppercase; margin-bottom: 15px; }
    .date-location { text-align: right; margin-bottom: 15px; font-style: italic; font-size: 9pt; }
    .greeting { margin-bottom: 15px; }
    .section { margin-bottom: 18px; }
    .section-title { font-size: 11pt; font-weight: bold; color: #1a365d; border-bottom: 2px solid #f8a32f; padding-bottom: 4px; margin-bottom: 8px; }
    .section-content { text-align: justify; }
    .features-list { margin-left: 18px; }
    .features-list li { margin-bottom: 3px; }
    .pricing-table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 9pt; }
    .pricing-table th, .pricing-table td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; }
    .pricing-table th { background: #f7fafc; font-weight: bold; }
    .pricing-table .number { text-align: center; }
    .pricing-table .currency { text-align: right; }
    .total-row { background: #f8a32f; color: white; font-weight: bold; }
    .plan-box { background: #f7fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; margin: 12px 0; }
    .plan-box .label { font-weight: bold; color: #4a5568; font-size: 9pt; }
    .plan-box .value { font-size: 12pt; color: #1a365d; }
    .images-section { margin: 15px 0; }
    .images-section img { max-width: 100%; height: auto; border: 1px solid #e2e8f0; border-radius: 6px; margin: 8px 0; }
    .image-caption { text-align: center; font-style: italic; color: #718096; font-size: 8pt; margin-top: 4px; }
    .signature { margin-top: 30px; text-align: center; }
    .signature-line { border-top: 1px solid #333; width: 220px; margin: 0 auto; padding-top: 8px; }
    .footer { margin-top: 25px; padding-top: 15px; border-top: 2px solid #f8a32f; text-align: center; font-size: 8pt; color: #718096; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } .page { padding: 20mm 25mm; } .page-break { page-break-before: always; } }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      ${proposal.user.logoUrl ? `<img src="${proposal.user.logoUrl}" alt="Logo" class="logo" />` : ''}
      <div class="title">PROPOSTA DE AQUISIÇÃO E PRESTAÇÃO DE SERVIÇO</div>
    </div>
    <div class="date-location">${proposal.user.city || 'Brasília'}, ${formatDate(proposal.proposalDate)}</div>
    <div class="greeting">${proposal.greeting || `Prezado(a) ${proposal.clientContactPerson || proposal.clientName}!`}</div>
    <p style="margin-bottom: 20px;">Conforme solicitado estamos enviando a nossa Proposta de Aquisição de Totem para Pesquisa de Satisfação do Cliente, a ser realizada pela <strong>${proposal.user.companyName || 'BACKEEND SOLUÇÕES INTELIGENTES'}</strong> para o <strong>${proposal.clientName.toUpperCase()}</strong>.</p>
    ${proposal.generalDescription ? `<div class="section"><div class="section-title">Descrição geral</div><div class="section-content">${proposal.generalDescription.replace(/\n/g, '<br>')}</div></div>` : ''}
    ${proposal.implementationReqs ? `<div class="section"><div class="section-title">Requisitos de implementação</div><div class="section-content">${proposal.implementationReqs.replace(/\n/g, '<br>')}</div></div>` : ''}
    ${proposal.technicalSupport ? `<div class="section"><div class="section-title">Suporte técnico</div><div class="section-content">${proposal.technicalSupport.replace(/\n/g, '<br>')}</div></div>` : ''}
    ${proposal.warranty ? `<div class="section"><div class="section-title">Garantia</div><div class="section-content">${proposal.warranty.replace(/\n/g, '<br>')}</div></div>` : ''}
    ${proposal.systemFeatures ? `<div class="section"><div class="section-title">Veja alguns recursos do nosso sistema</div><ul class="features-list">${proposal.systemFeatures.split('\n').filter((f: string) => f.trim()).map((feature: string) => `<li>${feature.replace(/^[\u2022\-\*]\s*/, '')}</li>`).join('')}</ul></div>` : ''}
    <div class="section">
      <div class="section-title">Valores e Planos</div>
      ${proposal.planType ? `<div class="plan-box"><div style="display: flex; justify-content: space-between; margin-bottom: 10px;"><div><span class="label">Tipo de plano:</span><br><span class="value">${proposal.planType}</span></div><div><span class="label">Valor mensal:</span><br><span class="value">${formatCurrency(proposal.planValue)}</span></div></div>${proposal.planDescription ? `<p style="font-size: 10pt; color: #718096;">${proposal.planDescription}</p>` : ''}</div>` : ''}
      ${proposal.items && proposal.items.length > 0 ? `<table class="pricing-table"><thead><tr><th>Produto</th><th class="number">Qtd.</th><th class="currency">Valor Unit.</th><th class="currency">Sub total</th></tr></thead><tbody>${proposal.items.map((item: any) => `<tr><td><strong>${item.name}</strong>${item.description ? `<br><small style="color: #718096;">${item.description}</small>` : ''}</td><td class="number">${item.quantity}</td><td class="currency">${formatCurrency(item.unitPrice)}</td><td class="currency">${formatCurrency(item.subtotal)}</td></tr>`).join('')}${proposal.shippingValue ? `<tr><td colspan="3">Frete${proposal.clientCep ? ` referente a sua localidade: ${proposal.clientCep}` : ''}</td><td class="currency">${formatCurrency(proposal.shippingValue)}</td></tr>` : ''}<tr class="total-row"><td colspan="3">TOTAL</td><td class="currency">${formatCurrency(proposal.totalValue)}</td></tr></tbody></table>` : ''}
    </div>
    ${proposal.paymentTerms ? `<div class="section"><div class="section-title">Forma de pagamento e Garantia</div><div class="section-content">${proposal.paymentTerms.replace(/\n/g, '<br>')}</div>${proposal.validUntil ? `<p style="margin-top: 10px;"><strong>Validade da proposta:</strong> ${formatDate(proposal.validUntil)}</p>` : ''}</div>` : ''}
    ${proposal.images && proposal.images.length > 0 ? `<div class="section page-break"><div class="section-title">Demonstrativo do Sistema</div><div class="images-section">${proposal.images.map((img: any) => `<div style="margin-bottom: 20px;"><img src="${img.imageUrl}" alt="${img.caption || 'Screenshot do sistema'}" />${img.caption ? `<p class="image-caption">${img.caption}</p>` : ''}</div>`).join('')}</div></div>` : ''}
    ${proposal.finalConsiderations ? `<div class="section"><div class="section-title">Considerações finais</div><div class="section-content">${proposal.finalConsiderations.replace(/\n/g, '<br>')}</div></div>` : ''}
    <div class="signature"><p>Atenciosamente,</p><div class="signature-line"><strong>${proposal.signatureName || proposal.user.name}</strong>${proposal.signaturePhone ? `<br>Tel.: ${proposal.signaturePhone}` : ''}</div></div>
    <div class="footer">${proposal.user.companyName || 'BACKEEND SOLUCOES INTELIGENTES'}${proposal.user.cnpj ? ` / CNPJ: ${proposal.user.cnpj}` : ''} / www.backeend.com.br</div>
  </div>
</body>
</html>`;
}

// POST - Enviar proposta por email
export async function POST(
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

    const body = await request.json();
    const { recipientEmail, subject, message } = body;

    const proposal = await prisma.proposal.findFirst({
      where: {
        id: params.id,
        userId: user.role === 'ADMIN' ? undefined : user.id,
      },
      include: {
        items: { orderBy: { order: 'asc' } },
        images: { orderBy: { order: 'asc' } },
        user: {
          select: {
            name: true,
            companyName: true,
            cnpj: true,
            logoUrl: true,
            city: true,
            cep: true,
            address: true,
            addressNumber: true,
            neighborhood: true,
            state: true,
          },
        },
      },
    });

    if (!proposal) {
      return NextResponse.json({ error: 'Proposta não encontrada' }, { status: 404 });
    }

    const emailTo = recipientEmail || proposal.clientEmail;
    if (!emailTo) {
      return NextResponse.json({ error: 'Email do destinatário não informado' }, { status: 400 });
    }

    // Formatar moeda
    const formatCurrency = (value: any) => {
      if (!value) return 'R$ 0,00';
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(Number(value));
    };

    // Formatar data
    const formatDate = (date: Date) => {
      return new Date(date).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
    };

    // Gerar URL da proposta
    const appUrl = process.env.NEXTAUTH_URL || 'https://beend.app';

    // Construir HTML do email (com cores laranja)
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; background: #f8fafc;">
        <div style="background: #f8a32f; color: white; padding: 30px; text-align: center;">
          ${proposal.user.logoUrl ? `<img src="${proposal.user.logoUrl}" alt="Logo" style="max-height: 50px; margin-bottom: 15px;" />` : ''}
          <h1 style="margin: 0; font-size: 24px;">PROPOSTA COMERCIAL</h1>
          <p style="margin: 10px 0 0; opacity: 0.9;">${proposal.proposalNumber}</p>
        </div>
        
        <div style="padding: 30px; background: white;">
          <p style="font-size: 16px; color: #4a5568;">
            ${message || `Prezado(a) ${proposal.clientContactPerson || proposal.clientName},`}
          </p>
          
          ${!message ? `
          <p style="color: #718096; margin-top: 15px;">
            Conforme solicitado, segue em anexo nossa proposta comercial para pesquisa de satisfação.
          </p>
          ` : ''}
          
          <div style="background: #fff8ee; border-radius: 8px; padding: 20px; margin: 25px 0; border-left: 4px solid #f8a32f;">
            <h3 style="color: #c77800; margin: 0 0 15px;">Resumo da Proposta</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #718096;">Cliente:</td>
                <td style="padding: 8px 0; font-weight: bold;">${proposal.clientName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #718096;">Data:</td>
                <td style="padding: 8px 0;">${formatDate(proposal.proposalDate)}</td>
              </tr>
              ${proposal.validUntil ? `
              <tr>
                <td style="padding: 8px 0; color: #718096;">Validade:</td>
                <td style="padding: 8px 0;">${formatDate(proposal.validUntil)}</td>
              </tr>
              ` : ''}
              ${proposal.planType ? `
              <tr>
                <td style="padding: 8px 0; color: #718096;">Plano:</td>
                <td style="padding: 8px 0;">${proposal.planType} - ${formatCurrency(proposal.planValue)}/mês</td>
              </tr>
              ` : ''}
              <tr style="border-top: 2px solid #f8d49a;">
                <td style="padding: 12px 0; color: #c77800; font-weight: bold; font-size: 18px;">Valor Total:</td>
                <td style="padding: 12px 0; font-weight: bold; font-size: 18px; color: #f8a32f;">${formatCurrency(proposal.totalValue)}</td>
              </tr>
            </table>
          </div>
          
          ${proposal.items && proposal.items.length > 0 ? `
          <h3 style="color: #c77800; margin: 25px 0 15px;">Itens da Proposta</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr style="background: #fff8ee;">
                <th style="padding: 12px; text-align: left; border: 1px solid #f8d49a;">Item</th>
                <th style="padding: 12px; text-align: center; border: 1px solid #f8d49a;">Qtd</th>
                <th style="padding: 12px; text-align: right; border: 1px solid #f8d49a;">Frete</th>
                <th style="padding: 12px; text-align: right; border: 1px solid #f8d49a;">Valor</th>
              </tr>
            </thead>
            <tbody>
              ${proposal.items.map((item: any) => `
              <tr>
                <td style="padding: 12px; border: 1px solid #e2e8f0;">
                  <strong>${item.name}</strong>
                  ${item.description ? `<br><small style="color: #718096;">${item.description.substring(0, 100)}...</small>` : ''}
                </td>
                <td style="padding: 12px; text-align: center; border: 1px solid #e2e8f0;">${item.quantity}</td>
                <td style="padding: 12px; text-align: right; border: 1px solid #e2e8f0;">${item.shippingValue ? formatCurrency(item.shippingValue) : '-'}</td>
                <td style="padding: 12px; text-align: right; border: 1px solid #e2e8f0;">${formatCurrency(Number(item.subtotal) + Number(item.shippingValue || 0))}</td>
              </tr>
              `).join('')}
            </tbody>
          </table>
          ` : ''}
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${appUrl}/proposals/${proposal.id}/public" style="display: inline-block; background: #f8a32f; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
              📄 Visualizar e Baixar Proposta em PDF
            </a>
            <p style="margin-top: 10px; color: #718096; font-size: 12px;">
              Clique no botão acima para visualizar a proposta completa e fazer o download em PDF
            </p>
          </div>
          
          <p style="color: #718096; margin-top: 25px;">
            Ficamos à disposição para quaisquer esclarecimentos.
          </p>
          
          <p style="margin-top: 30px; color: #4a5568;">
            Atenciosamente,<br>
            <strong>${proposal.signatureName || proposal.user.name}</strong>
            ${proposal.signaturePhone ? `<br><span style="color: #718096;">Tel.: ${proposal.signaturePhone}</span>` : ''}
          </p>
        </div>
        
        <div style="background: #f8a32f; color: white; padding: 20px; text-align: center; font-size: 12px;">
          <p style="margin: 0;">
            ${proposal.user.companyName || 'BACKEEND SOLUCOES INTELIGENTES'}
            ${proposal.user.cnpj ? ` | CNPJ: ${proposal.user.cnpj}` : ''}
          </p>
          <p style="margin: 5px 0 0; opacity: 0.9;">www.backeend.com.br</p>
        </div>
      </div>
    `;

    // Enviar email com anexo
    const appName = proposal.user.companyName || 'Beend';

    const response = await fetch('https://apps.abacus.ai/api/sendNotificationEmail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deployment_token: process.env.ABACUSAI_API_KEY,
        subject: subject || `Proposta Comercial ${proposal.proposalNumber} - ${proposal.user.companyName || 'Beend'}`,
        body: htmlBody,
        is_html: true,
        recipient_email: emailTo,
        sender_email: `noreply@beend.app`,
        sender_alias: appName,
      }),
    });

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Falha ao enviar email');
    }

    // Atualizar status da proposta para SENT se estava em DRAFT
    if (proposal.status === 'DRAFT') {
      await prisma.proposal.update({
        where: { id: params.id },
        data: { status: 'SENT' },
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Proposta enviada para ${emailTo}` 
    });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json({ error: 'Erro ao enviar email' }, { status: 500 });
  }
}
