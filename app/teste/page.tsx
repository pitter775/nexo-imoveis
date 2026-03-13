import { supabase } from '@/lib/supabase'

export default async function Page() {

  await supabase.from('imoveis').insert({
    titulo: "Casa teste",
    descricao: "Primeiro imóvel do sistema",
    preco: 500000,
    cidade: "São Paulo",
    estado: "SP"
  })

  const { data: imoveis } = await supabase
    .from('imoveis')
    .select('*')

  return (
    <div>
      <h1>Teste Supabase</h1>

      <pre>
        {JSON.stringify(imoveis, null, 2)}
      </pre>
    </div>
  )
}
