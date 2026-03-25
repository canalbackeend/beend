import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const cep = searchParams.get('cep');

    if (!cep) {
      return NextResponse.json(
        { error: 'CEP é obrigatório' },
        { status: 400 }
      );
    }

    // Remove caracteres não numéricos
    const cleanCep = cep.replace(/\D/g, '');

    if (cleanCep.length !== 8) {
      return NextResponse.json(
        { error: 'CEP inválido' },
        { status: 400 }
      );
    }

    // Busca no ViaCEP
    const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
    
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Erro ao buscar CEP' },
        { status: 500 }
      );
    }

    const data = await response.json();

    if (data.erro) {
      return NextResponse.json(
        { error: 'CEP não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      cep: data.cep,
      address: data.logradouro,
      neighborhood: data.bairro,
      city: data.localidade,
      state: data.uf,
      complement: data.complemento,
    });
  } catch (error) {
    console.error('Erro ao buscar CEP:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar CEP' },
      { status: 500 }
    );
  }
}
