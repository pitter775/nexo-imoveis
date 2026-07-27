export type LegalSection = {
  title: string;
  paragraphs?: string[];
  items?: string[];
};

export type LegalDocument = {
  title: string;
  updatedAt: string;
  intro: string[];
  sections: LegalSection[];
};

export const privacyPolicy: LegalDocument = {
  title: 'Política de Privacidade - Nexo Leilões',
  updatedAt: '22/07/2026',
  intro: [
    'A NEXO LEILÕES, doravante denominada apenas NEXO, respeita a privacidade e a proteção dos dados pessoais de seus usuários e atua em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 - LGPD), o Marco Civil da Internet (Lei nº 12.965/2014) e demais normas aplicáveis.',
    'Esta Política de Privacidade descreve de forma transparente como coletamos, utilizamos, compartilhamos, armazenamos e protegemos os dados pessoais dos usuários da plataforma disponibilizada em www.nexoleiloes.com.br.',
    'Ao utilizar a plataforma, o usuário declara ter lido, compreendido e concordado com esta Política de Privacidade.',
  ],
  sections: [
    {
      title: '1. Controladora dos Dados',
      paragraphs: [
        'A NEXO LEILÕES atua como Controladora dos Dados Pessoais, sendo responsável pelas decisões referentes ao tratamento das informações coletadas por meio da plataforma.',
        'Contato para assuntos relacionados à privacidade: contato@nexoleiloes.com.br',
      ],
    },
    {
      title: '2. Dados Pessoais Coletados',
      paragraphs: [
        'A NEXO poderá coletar dados fornecidos diretamente pelo usuário ou obtidos automaticamente durante a utilização da plataforma.',
      ],
      items: [
        'Nome completo, e-mail, telefone, CPF quando necessário para contratação de serviços, dados de cadastro, informações de perfil e preferências de investimento.',
        'Informações fornecidas em formulários, chats, e-mails ou atendimento.',
        'Endereço IP, data e horário de acesso, histórico de navegação, cookies, tipo de dispositivo, navegador utilizado, sistema operacional, geolocalização aproximada e tempo de permanência na plataforma.',
        'Imóveis favoritados, histórico de pesquisas, simulações realizadas, relatórios consultados, perguntas realizadas à Inteligência Artificial e histórico de utilização da plataforma.',
      ],
    },
    {
      title: '3. Finalidade do Tratamento',
      paragraphs: ['Os dados pessoais poderão ser utilizados para:'],
      items: [
        'Realizar cadastro e autenticação do usuário.',
        'Disponibilizar acesso aos planos contratados.',
        'Personalizar oportunidades imobiliárias.',
        'Gerar análises e relatórios automatizados.',
        'Responder perguntas realizadas por meio da Inteligência Artificial.',
        'Prestar serviços de assessoria imobiliária e suporte ao usuário.',
        'Enviar comunicações relevantes.',
        'Prevenir fraudes, garantir a segurança da plataforma, cumprir obrigações legais e regulatórias e melhorar continuamente os serviços e funcionalidades.',
      ],
    },
    {
      title: '4. Bases Legais para o Tratamento',
      paragraphs: [
        'O tratamento dos dados poderá ocorrer com fundamento nas hipóteses previstas no artigo 7º da LGPD, especialmente execução de contrato, cumprimento de obrigação legal, exercício regular de direitos, legítimo interesse e consentimento do titular.',
      ],
    },
    {
      title: '5. Compartilhamento de Dados',
      paragraphs: [
        'Os dados poderão ser compartilhados, quando necessário, com advogados parceiros, corretores de imóveis regularmente inscritos no CRECI, instituições financeiras parceiras, empresas de hospedagem e computação em nuvem, provedores de Inteligência Artificial, gateways de pagamento, plataformas de atendimento e CRM, fornecedores de tecnologia, parceiros operacionais envolvidos na prestação dos serviços e autoridades públicas, mediante determinação legal.',
        'O compartilhamento ocorrerá sempre na medida necessária para execução dos serviços. A NEXO não comercializa dados pessoais de seus usuários.',
      ],
    },
    {
      title: '6. Inteligência Artificial',
      paragraphs: [
        'A plataforma poderá utilizar ferramentas de Inteligência Artificial para responder dúvidas dos usuários, interpretar documentos, elaborar resumos, gerar relatórios automatizados e auxiliar na análise de imóveis.',
        'As respostas geradas possuem caráter exclusivamente informativo e são produzidas com base nas informações disponíveis na plataforma.',
        'Embora sejam adotadas medidas para garantir qualidade e precisão, as respostas geradas por Inteligência Artificial podem conter limitações ou imprecisões e não substituem análise jurídica, técnica ou profissional especializada.',
      ],
    },
    {
      title: '7. Transferência Internacional de Dados',
      paragraphs: [
        'Parte dos serviços utilizados pela NEXO poderá ser fornecida por empresas sediadas no exterior. Nesses casos, os dados poderão ser processados ou armazenados fora do Brasil, sempre mediante adoção de medidas de segurança compatíveis com a legislação brasileira e observando os requisitos da LGPD.',
      ],
    },
    {
      title: '8. Cookies',
      paragraphs: [
        'Utilizamos cookies e tecnologias semelhantes para autenticação de usuários, segurança da conta, análise de utilização da plataforma, melhoria da experiência do usuário, personalização de conteúdo, estatísticas de acesso e campanhas de marketing.',
        'O usuário poderá configurar seu navegador para bloquear ou remover cookies, podendo haver limitação de algumas funcionalidades.',
      ],
    },
    {
      title: '9. Segurança da Informação',
      paragraphs: [
        'A NEXO adota medidas técnicas e administrativas compatíveis com as melhores práticas de mercado para proteger os dados pessoais contra acesso não autorizado, perda, destruição, alteração, vazamento e uso indevido.',
        'Apesar disso, nenhum ambiente digital é absolutamente seguro, motivo pelo qual também recomendamos que o usuário adote boas práticas de segurança.',
      ],
    },
    {
      title: '10. Retenção dos Dados',
      paragraphs: [
        'Os dados serão mantidos durante a vigência da relação contratual, enquanto necessários para prestação dos serviços, durante os prazos previstos em lei e enquanto houver obrigação regulatória. Após esse período, poderão ser eliminados ou anonimizados.',
      ],
    },
    {
      title: '11. Direitos do Titular',
      paragraphs: [
        'Nos termos da LGPD, o titular poderá solicitar confirmação da existência de tratamento, acesso aos dados pessoais, correção de dados incompletos ou desatualizados, anonimização, bloqueio ou eliminação dos dados quando cabível, portabilidade dos dados, revogação do consentimento e informações sobre compartilhamento de dados.',
        'As solicitações deverão ser encaminhadas para: contato@nexoleiloes.com.br',
      ],
    },
    {
      title: '12. Comunicações',
      paragraphs: [
        'A NEXO poderá enviar comunicados sobre a plataforma, novidades, conteúdos educacionais, oportunidades imobiliárias, alertas personalizados e ofertas relacionadas aos serviços.',
        'O usuário poderá cancelar comunicações promocionais a qualquer momento, sem prejuízo das mensagens necessárias à execução do contrato.',
      ],
    },
    {
      title: '13. Dados de Terceiros',
      paragraphs: [
        'Caso o usuário forneça dados pessoais de terceiros, declara possuir autorização ou outra base legal adequada para tanto, responsabilizando-se integralmente por essa utilização.',
      ],
    },
    {
      title: '14. Alterações desta Política',
      paragraphs: [
        'Esta Política poderá ser alterada periodicamente para refletir mudanças na legislação, nos serviços ou nas práticas da NEXO.',
        'A versão vigente estará sempre disponível em www.nexoleiloes.com.br. A continuidade da utilização da plataforma após a publicação das alterações será interpretada como concordância com a versão atualizada.',
      ],
    },
  ],
};

export const termsOfUse: LegalDocument = {
  title: 'Termos de Uso - Nexo Leilões',
  updatedAt: '22/07/2026',
  intro: [
    'Este Termo de Uso estabelece as regras, direitos, deveres e responsabilidades aplicáveis à utilização da plataforma NEXO LEILÕES, disponibilizada por meio do site www.nexoleiloes.com.br.',
    'Ao acessar, navegar, cadastrar-se ou utilizar qualquer funcionalidade da plataforma, o usuário declara ter lido, compreendido e concordado integralmente com estes Termos, manifestando consentimento livre, informado e inequívoco para sua vinculação jurídica. A utilização da plataforma implica aceitação plena e irrestrita destas condições.',
    'A plataforma é operada por NEXO LEILÕES, doravante denominada apenas NEXO, sendo o canal oficial de contato o e-mail contato@nexoleiloes.com.br.',
    'Somente poderão utilizar a plataforma pessoas maiores de 18 anos e com plena capacidade civil. O uso por menores ou incapazes é vedado. Caso o usuário não atenda a esses requisitos ou discorde de qualquer cláusula deste Termo, deverá se abster de utilizar os serviços.',
  ],
  sections: [
    {
      title: '1. Objeto da Plataforma',
      paragraphs: [
        'A NEXO é uma plataforma tecnológica especializada em oportunidades de imóveis em leilão, retomadas bancárias e demais ativos imobiliários, reunindo, organizando e disponibilizando informações, documentos, análises e ferramentas voltadas à tomada de decisão.',
        'A atuação da NEXO limita-se à disponibilização de tecnologia, inteligência artificial, dados, relatórios automatizados, ferramentas de análise e suporte informacional aos usuários.',
        'A plataforma não realiza leilões, não representa leiloeiros oficiais e não substitui a leitura integral dos editais, matrículas ou demais documentos oficiais.',
      ],
    },
    {
      title: '2. Assessoria Especializada',
      paragraphs: [
        'Além da plataforma tecnológica, a NEXO poderá oferecer, mediante contratação específica, serviços de assessoria especializada para participação em leilões imobiliários, incluindo análise documental, estudo de viabilidade, estratégia de arrematação, acompanhamento do processo e suporte até a conclusão da aquisição.',
        'Quando necessária atuação jurídica, esta será realizada exclusivamente por advogados regularmente inscritos na Ordem dos Advogados do Brasil (OAB).',
        'A eventual intermediação imobiliária será realizada por profissionais devidamente registrados no Conselho Regional de Corretores de Imóveis (CRECI), quando exigido pela legislação.',
      ],
    },
    {
      title: '3. Origem das Informações',
      paragraphs: [
        'Os imóveis, documentos e informações disponibilizados na plataforma podem ser provenientes de leiloeiros oficiais, instituições financeiras, Poder Judiciário, cartórios, parceiros, órgãos públicos, bases públicas e privadas e terceiros.',
        'Quando as informações forem fornecidas por terceiros, estes permanecem responsáveis por sua veracidade, atualização e legalidade.',
      ],
    },
    {
      title: '4. Natureza das Informações',
      paragraphs: [
        'Os dados, relatórios, estimativas de mercado, análises de risco, projeções financeiras, simulações de custos, avaliações mercadológicas e demais informações disponibilizadas pela plataforma possuem caráter exclusivamente informativo.',
        'Essas informações poderão ser elaboradas por meio de inteligência artificial, modelos estatísticos, bases públicas e privadas, algoritmos e análise humana.',
        'Nenhuma informação disponibilizada constitui recomendação de investimento, parecer jurídico, laudo técnico oficial, garantia de valorização, promessa de lucro ou garantia de sucesso na arrematação.',
      ],
    },
    {
      title: '5. Riscos dos Leilões',
      paragraphs: [
        'O usuário reconhece que a aquisição de imóveis em leilão envolve riscos inerentes, incluindo ocupação do imóvel, débitos existentes, ônus não identificados, demora judicial, necessidade de regularização documental, despesas imprevistas, alterações em editais, cancelamento de leilões e variações de mercado.',
        'A decisão de participar de qualquer leilão é de responsabilidade exclusiva do usuário.',
      ],
    },
    {
      title: '6. Planos e Assinaturas',
      paragraphs: [
        'Os serviços poderão ser disponibilizados por meio de assinatura recorrente, contratação avulsa, aquisição individual de análises e contratação de assessoria especializada.',
        'Cada plano poderá possuir funcionalidades específicas.',
        'O cancelamento da assinatura impedirá novas cobranças recorrentes, permanecendo válido o acesso até o término do período contratado, não havendo devolução de valores já pagos, salvo nas hipóteses previstas em lei.',
        'Os valores poderão ser reajustados mediante comunicação prévia.',
      ],
    },
    {
      title: '7. Direito de Arrependimento',
      paragraphs: [
        'Nos termos do Código de Defesa do Consumidor, o usuário poderá exercer o direito de arrependimento no prazo de até 7 dias da contratação, desde que não tenha utilizado substancialmente os serviços digitais disponibilizados.',
        'Após o início efetivo da utilização das funcionalidades da plataforma, considera-se iniciado o consumo do serviço.',
      ],
    },
    {
      title: '8. Obrigações do Usuário',
      paragraphs: [
        'O usuário compromete-se a fornecer informações verdadeiras, manter seus dados atualizados, analisar cuidadosamente toda a documentação dos imóveis, respeitar a legislação vigente, não compartilhar credenciais de acesso e utilizar a plataforma de forma ética e lícita.',
        'O usuário é integralmente responsável pelas decisões de investimento tomadas com base nas informações disponibilizadas.',
      ],
    },
    {
      title: '9. Limitação de Responsabilidade',
      paragraphs: [
        'A plataforma é fornecida no estado em que se encontra ("as is"), sem garantias de disponibilidade contínua, adequação a objetivos específicos ou obtenção de resultados financeiros.',
        'A NEXO não responde por decisões de investimento do usuário, perdas financeiras, lucros cessantes, alterações em editais, falhas de terceiros, atos de leiloeiros, cartórios, instituições financeiras, órgãos públicos ou indisponibilidade temporária da plataforma.',
        'A responsabilidade da NEXO, quando existente, limita-se ao valor efetivamente pago pelo usuário pelos serviços contratados.',
      ],
    },
    {
      title: '10. Propriedade Intelectual',
      paragraphs: [
        'Toda a propriedade intelectual relacionada à plataforma, incluindo marca, logotipo, identidade visual, metodologia, tecnologia, inteligência artificial, banco de dados, layout, relatórios, sistemas e funcionalidades, pertence exclusivamente à NEXO LEILÕES.',
        'É proibida a reprodução, distribuição, comercialização ou utilização sem autorização prévia e expressa.',
      ],
    },
    {
      title: '11. Atualizações',
      paragraphs: [
        'Estes Termos poderão ser alterados a qualquer momento. As alterações entrarão em vigor após sua publicação na plataforma. A continuidade da utilização dos serviços implica concordância com a versão vigente.',
      ],
    },
    {
      title: '12. Lei Aplicável e Foro',
      paragraphs: [
        'Este Termo será regido pelas leis da República Federativa do Brasil.',
        'Fica eleito o foro da comarca da sede da NEXO LEILÕES, com renúncia expressa a qualquer outro, por mais privilegiado que seja, para dirimir eventuais controvérsias decorrentes deste instrumento.',
      ],
    },
  ],
};
