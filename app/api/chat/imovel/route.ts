import { NextResponse } from 'next/server';
import { answerPropertyQuestion } from '@/lib/ai/property-chat';
import { getCurrentAuthenticatedUser } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      propertyId?: string;
      message?: string;
      conversationId?: string | null;
    };

    const propertyId = body.propertyId?.trim();
    const message = body.message?.trim();

    if (!propertyId || !message) {
      return NextResponse.json(
        { error: 'propertyId e message sao obrigatorios.' },
        { status: 400 },
      );
    }

    const currentUser = await getCurrentAuthenticatedUser();
    const result = await answerPropertyQuestion({
      propertyId,
      question: message,
      conversationId: body.conversationId ?? null,
      userId: currentUser?.id ?? null,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: 'Nao foi possivel processar a pergunta do chat.' },
      { status: 500 },
    );
  }
}
