import { NextResponse } from 'next/server';
import { getCurrentAuthenticatedUser } from '@/lib/auth';

export async function GET() {
  const user = await getCurrentAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ user: null });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      nome: user.nome ?? null,
      email: user.email,
      tipo_usuario: user.tipo_usuario,
    },
  });
}
