import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuthenticatedUser } from '@/lib/auth';
import { addImovelArquivo, removeImovelArquivo } from '@/lib/admin/imoveis';

type RouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: NextRequest, { params }: RouteProps) {
  const user = await getCurrentAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  if (user.tipo_usuario !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const body = (await request.json()) as {
    nome_arquivo?: string;
    url_storage?: string;
    tipo_arquivo?: string;
    tipo_documento?: string;
    visivel_publico?: boolean;
    visivel_pagantes?: boolean;
  };

  if (!body.nome_arquivo || !body.url_storage) {
    return NextResponse.json(
      { error: 'File metadata is required' },
      { status: 400 },
    );
  }

  const arquivo = await addImovelArquivo(id, {
    nome_arquivo: body.nome_arquivo,
    url_storage: body.url_storage,
    tipo_arquivo: body.tipo_arquivo ?? null,
    tipo_documento: body.tipo_documento ?? null,
    visivel_publico: body.visivel_publico ?? false,
    visivel_pagantes: body.visivel_pagantes ?? true,
  });

  return NextResponse.json({ arquivo });
}

export async function DELETE(request: NextRequest, { params }: RouteProps) {
  const user = await getCurrentAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  if (user.tipo_usuario !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const body = (await request.json()) as { arquivoId?: string };

  if (!body.arquivoId) {
    return NextResponse.json({ error: 'File id is required' }, { status: 400 });
  }

  await removeImovelArquivo(id, body.arquivoId);
  return NextResponse.json({ success: true });
}
