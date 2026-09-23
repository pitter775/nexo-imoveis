import { NextResponse } from 'next/server';
import { getCurrentAuthenticatedUser } from '@/lib/auth';
import {
  INFORMATION_ACCESS_PRICE,
  createInformationPreference,
} from '@/lib/payments/mercado-pago';
import { userHasActivePropertyAccess } from '@/lib/payments/information-access';
import { getPublicAbsoluteUrl } from '@/lib/site';
import { createAdminClient } from '@/lib/supabase/admin';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  const user = await getCurrentAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ error: 'Login necessario para solicitar informacoes.' }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { imovelId?: string } | null;
  const imovelId = body?.imovelId?.trim();

  if (!imovelId || !UUID_REGEX.test(imovelId)) {
    return NextResponse.json({ error: 'Imovel invalido.' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: imovel, error: imovelError } = await supabase
    .from('imoveis')
    .select('id, titulo, descricao, status')
    .eq('id', imovelId)
    .maybeSingle();

  if (imovelError) {
    return NextResponse.json(
      { error: `Nao foi possivel carregar o imovel: ${imovelError.message}` },
      { status: 500 },
    );
  }

  if (!imovel) {
    return NextResponse.json({ error: 'Imovel nao encontrado.' }, { status: 404 });
  }

  if (user.tipo_usuario === 'admin' || (await userHasActivePropertyAccess(user.id, imovelId))) {
    return NextResponse.json({
      alreadyUnlocked: true,
      redirectUrl: getPublicAbsoluteUrl(`/imoveis/${imovelId}?chat=1`),
    });
  }

  const { data: pagamento, error: pagamentoError } = await supabase
    .from('pagamentos')
    .insert({
      user_id: user.id,
      valor: INFORMATION_ACCESS_PRICE,
      metodo: 'mercado_pago',
      status: 'pendente',
    })
    .select('id')
    .single();

  if (pagamentoError) {
    return NextResponse.json(
      { error: `Nao foi possivel registrar o pagamento: ${pagamentoError.message}` },
      { status: 500 },
    );
  }

  const { error: itemError } = await supabase.from('pagamentos_itens').insert({
    pagamento_id: pagamento.id,
    imovel_id: imovelId,
    valor: INFORMATION_ACCESS_PRICE,
  });

  if (itemError) {
    await supabase.from('pagamentos').update({ status: 'erro' }).eq('id', pagamento.id);

    return NextResponse.json(
      { error: `Nao foi possivel registrar o item do pagamento: ${itemError.message}` },
      { status: 500 },
    );
  }

  try {
    const preference = await createInformationPreference({
      pagamentoId: pagamento.id,
      imovelId,
      title: imovel.titulo,
      description: imovel.descricao,
      payer: {
        email: user.email,
        name: user.nome,
      },
    });

    await supabase
      .from('pagamentos')
      .update({ referencia_gateway: preference.preferenceId })
      .eq('id', pagamento.id);

    return NextResponse.json({
      checkoutUrl: preference.checkoutUrl,
      pagamentoId: pagamento.id,
      valor: INFORMATION_ACCESS_PRICE,
    });
  } catch (error) {
    await supabase.from('pagamentos').update({ status: 'erro' }).eq('id', pagamento.id);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Nao foi possivel criar o checkout do Mercado Pago.',
      },
      { status: 500 },
    );
  }
}
