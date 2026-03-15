import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuthenticatedUser } from '@/lib/auth';
import {
  addImovelImage,
  removeImovelImage,
  reorderImovelImages,
} from '@/lib/admin/imoveis';

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
  const body = (await request.json()) as { url?: string };

  if (!body.url) {
    return NextResponse.json({ error: 'Image url is required' }, { status: 400 });
  }

  const image = await addImovelImage(id, body.url);
  return NextResponse.json({ image });
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
  const body = (await request.json()) as { url?: string };

  if (!body.url) {
    return NextResponse.json({ error: 'Image url is required' }, { status: 400 });
  }

  await removeImovelImage(id, body.url);
  return NextResponse.json({ success: true });
}

export async function PATCH(request: NextRequest, { params }: RouteProps) {
  const user = await getCurrentAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  if (user.tipo_usuario !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const body = (await request.json()) as { urls?: string[] };

  if (!Array.isArray(body.urls) || body.urls.length === 0) {
    return NextResponse.json(
      { error: 'Ordered image urls are required' },
      { status: 400 },
    );
  }

  await reorderImovelImages(id, body.urls);
  return NextResponse.json({ success: true });
}
