import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET - Obter proposta para visualização pública (sem autenticação)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const proposal = await prisma.proposal.findUnique({
      where: { id: params.id },
      include: {
        items: { orderBy: { order: 'asc' } },
        images: { orderBy: { order: 'asc' } },
        user: {
          select: {
            name: true,
            companyName: true,
            cnpj: true,
            logoUrl: true,
            cep: true,
            address: true,
            addressNumber: true,
            neighborhood: true,
            city: true,
            state: true,
          },
        },
      },
    });

    if (!proposal) {
      return NextResponse.json({ error: 'Proposta não encontrada' }, { status: 404 });
    }

    // Formatar data
    const formatDate = (date: Date) => {
      return new Date(date).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
    };

    // Formatar moeda
    const formatCurrency = (value: any) => {
      if (!value) return 'R$ 0,00';
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(Number(value));
    };

    // Gerar HTML do PDF (mesmo do PDF normal)
    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Proposta ${proposal.proposalNumber}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: Arial, sans-serif;
      font-size: 10pt;
      line-height: 1.5;
      color: #333;
      background: white;
    }
    .page {
      max-width: 210mm;
      margin: 0 auto;
      padding: 25mm 30mm;
      background: white;
    }
    .header {
      text-align: center;
      margin-bottom: 25px;
    }
    .logo {
      max-height: 50px;
      max-width: 180px;
      margin-bottom: 8px;
    }
    .title {
      font-size: 14pt;
      font-weight: bold;
      color: #1a365d;
      text-transform: uppercase;
      margin-bottom: 15px;
    }
    .date-location {
      text-align: right;
      margin-bottom: 15px;
      font-style: italic;
      font-size: 9pt;
    }
    .greeting {
      margin-bottom: 15px;
    }
    .section {
      margin-bottom: 18px;
    }
    .section-title {
      font-size: 11pt;
      font-weight: bold;
      color: #1a365d;
      border-bottom: 2px solid #3182ce;
      padding-bottom: 4px;
      margin-bottom: 8px;
    }
    .section-content {
      text-align: justify;
    }
    .features-list {
      margin-left: 18px;
    }
    .features-list li {
      margin-bottom: 3px;
    }
    .pricing-table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0;
      font-size: 9pt;
    }
    .pricing-table th,
    .pricing-table td {
      border: 1px solid #e2e8f0;
      padding: 8px;
      text-align: left;
    }
    .pricing-table th {
      background: #f7fafc;
      font-weight: bold;
    }
    .pricing-table .number {
      text-align: center;
    }
    .pricing-table .currency {
      text-align: right;
    }
    .total-row {
      background: #e2e8f0;
      font-weight: bold;
    }
    .plan-box {
      background: #f7fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 12px;
      margin: 12px 0;
    }
    .plan-box .label {
      font-weight: bold;
      color: #4a5568;
      font-size: 9pt;
    }
    .plan-box .value {
      font-size: 12pt;
      color: #1a365d;
    }
    .images-section {
      margin: 15px 0;
    }
    .images-section img {
      max-width: 100%;
      height: auto;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      margin: 8px 0;
    }
    .image-caption {
      text-align: center;
      font-style: italic;
      color: #718096;
      font-size: 8pt;
      margin-top: 4px;
    }
    .signature {
      margin-top: 30px;
      text-align: center;
    }
    .signature-line {
      border-top: 1px solid #333;
      width: 220px;
      margin: 0 auto;
      padding-top: 8px;
    }
    .footer {
      margin-top: 25px;
      padding-top: 15px;
      border-top: 2px solid #3182ce;
      text-align: center;
      font-size: 8pt;
      color: #718096;
    }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page { padding: 20mm 25mm; }
      .page-break { page-break-before: always; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      ${proposal.user.logoUrl ? `<img src="${proposal.user.logoUrl}" alt="Logo" class="logo" />` : ''}
      <div class="title">PROPOSTA DE AQUISIÇÃO E PRESTAÇÃO DE SERVIÇO</div>
    </div>

    <div class="date-location">
      ${proposal.user.city || 'Brasília'}, ${formatDate(proposal.proposalDate)}
    </div>

    <div class="greeting">
      ${proposal.greeting || `Prezado(a) ${proposal.clientContactPerson || proposal.clientName}!`}
    </div>

    <p style="margin-bottom: 20px;">
      Conforme solicitado estamos enviando a nossa Proposta de Aquisição de Totem para
      Pesquisa de Satisfação do Cliente, a ser realizada pela <strong>${proposal.user.companyName || 'BACKEEND SOLUÇÕES INTELIGENTES'}</strong> para
      o <strong>${proposal.clientName.toUpperCase()}</strong>.
    </p>

    ${proposal.generalDescription ? `
    <div class="section">
      <div class="section-title">Descrição geral</div>
      <div class="section-content">${proposal.generalDescription.replace(/\n/g, '<br>')}</div>
    </div>
    ` : ''}

    ${proposal.implementationReqs ? `
    <div class="section">
      <div class="section-title">Requisitos de implementação</div>
      <div class="section-content">${proposal.implementationReqs.replace(/\n/g, '<br>')}</div>
    </div>
    ` : ''}

    ${proposal.technicalSupport ? `
    <div class="section">
      <div class="section-title">Suporte técnico</div>
      <div class="section-content">${proposal.technicalSupport.replace(/\n/g, '<br>')}</div>
    </div>
    ` : ''}

    ${proposal.warranty ? `
    <div class="section">
      <div class="section-title">Garantia</div>
      <div class="section-content">${proposal.warranty.replace(/\n/g, '<br>')}</div>
    </div>
    ` : ''}

    ${proposal.systemFeatures ? `
    <div class="section">
      <div class="section-title">Veja alguns recursos do nosso sistema</div>
      <ul class="features-list">
        ${proposal.systemFeatures.split('\n').filter((f: string) => f.trim()).map((feature: string) => `<li>${feature.replace(/^[\u2022\-\*]\s*/, '')}</li>`).join('')}
      </ul>
    </div>
    ` : ''}

    <div class="section">
      <div class="section-title">Valores e Planos</div>
      
      ${proposal.planType ? `
      <div class="plan-box">
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
          <div>
            <span class="label">Tipo de plano:</span><br>
            <span class="value">${proposal.planType}</span>
          </div>
          <div>
            <span class="label">Valor mensal:</span><br>
            <span class="value">${formatCurrency(proposal.planValue)}</span>
          </div>
        </div>
        ${proposal.planDescription ? `<p style="font-size: 10pt; color: #718096;">${proposal.planDescription}</p>` : ''}
      </div>
      ` : ''}

      ${proposal.items && proposal.items.length > 0 ? `
      <table class="pricing-table">
        <thead>
          <tr>
            <th>Produto</th>
            <th class="number">Qtd.</th>
            <th class="currency">Valor Unit.</th>
            <th class="currency">Frete</th>
            <th class="currency">Sub total</th>
          </tr>
        </thead>
        <tbody>
          ${proposal.items.map((item: any) => `
          <tr>
            <td>
              <strong>${item.name}</strong>
              ${item.description ? `<br><small style="color: #718096;">${item.description}</small>` : ''}
            </td>
            <td class="number">${item.quantity}</td>
            <td class="currency">${formatCurrency(item.unitPrice)}</td>
            <td class="currency">${item.shippingValue ? formatCurrency(item.shippingValue) : '-'}</td>
            <td class="currency">${formatCurrency(Number(item.subtotal) + Number(item.shippingValue || 0))}</td>
          </tr>
          `).join('')}
          ${proposal.shippingValue ? `
          <tr>
            <td colspan="4">Frete Adicional${proposal.clientCep ? ` referente a localidade: ${proposal.clientCep}` : ''}</td>
            <td class="currency">${formatCurrency(proposal.shippingValue)}</td>
          </tr>
          ` : ''}
          <tr class="total-row">
            <td colspan="4">TOTAL</td>
            <td class="currency">${formatCurrency(proposal.totalValue)}</td>
          </tr>
        </tbody>
      </table>
      ` : ''}
    </div>

    ${proposal.paymentTerms ? `
    <div class="section">
      <div class="section-title">Forma de pagamento e Garantia</div>
      <div class="section-content">${proposal.paymentTerms.replace(/\n/g, '<br>')}</div>
      ${proposal.validUntil ? `<p style="margin-top: 10px;"><strong>Validade da proposta:</strong> ${formatDate(proposal.validUntil)}</p>` : ''}
    </div>
    ` : ''}

    ${proposal.images && proposal.images.length > 0 ? `
    <div class="section page-break">
      <div class="section-title">Demonstrativo do Sistema</div>
      <div class="images-section">
        ${proposal.images.map((img: any) => `
        <div style="margin-bottom: 20px;">
          <img src="${img.imageUrl}" alt="${img.caption || 'Screenshot do sistema'}" />
          ${img.caption ? `<p class="image-caption">${img.caption}</p>` : ''}
        </div>
        `).join('')}
      </div>
    </div>
    ` : ''}

    ${proposal.finalConsiderations ? `
    <div class="section">
      <div class="section-title">Considerações finais</div>
      <div class="section-content">${proposal.finalConsiderations.replace(/\n/g, '<br>')}</div>
    </div>
    ` : ''}

    <div class="signature">
      <p>Atenciosamente,</p>
      <div class="signature-line">
        <strong>${proposal.signatureName || proposal.user.name}</strong>
        ${proposal.signaturePhone ? `<br>Tel.: ${proposal.signaturePhone}` : ''}
      </div>
    </div>

    <div class="footer">
      ${proposal.user.companyName || 'BACKEEND SOLUCOES INTELIGENTES'}
      ${proposal.user.cnpj ? ` / CNPJ: ${proposal.user.cnpj}` : ''}
      / www.backeend.com.br
    </div>
  </div>
</body>
</html>
    `;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Error generating public PDF:', error);
    return NextResponse.json({ error: 'Erro ao gerar proposta' }, { status: 500 });
  }
}
