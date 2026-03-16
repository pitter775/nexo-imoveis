import { NextResponse } from 'next/server';
import {
  answerPropertyQuestion,
  getLatestPropertyConversation,
} from '@/lib/ai/property-chat';
import { getCurrentAuthenticatedUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId')?.trim();

    if (!propertyId) {
      return NextResponse.json(
        { error: 'propertyId e obrigatorio.' },
        { status: 400 },
      );
    }

    const currentUser = await getCurrentAuthenticatedUser();

    if (!currentUser) {
      return NextResponse.json({
        conversationId: null,
        messages: [],
      });
    }

    const conversation = await getLatestPropertyConversation({
      propertyId,
      userId: currentUser.id,
    });

    return NextResponse.json({
      conversationId: conversation?.conversationId ?? null,
      messages:
        conversation?.messages.map((message) => ({
          role: message.role === 'assistant' ? 'model' : 'user',
          text: message.content,
        })) ?? [],
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: 'Nao foi possivel carregar o historico do chat.' },
      { status: 500 },
    );
  }
}

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
