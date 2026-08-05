import type { Lang } from "@/lib/fallacies";

export type PolicyPageCopy = {
  title: string;
  subtitle: string;
  updated: string;
  sections: Array<{
    title: string;
    paragraphs: string[];
  }>;
};

export const POLICY_PAGES_COPY: Record<
  Lang,
  { privacy: PolicyPageCopy; terms: PolicyPageCopy }
> = {
  en: {
    privacy: {
      title: "Privacy policy",
      subtitle:
        "How Jiddu handles account data, submitted content, payments, analytics, and service usage across the website, API, MCP, and Live.",
      updated: "Last updated: August 5, 2026",
      sections: [
        {
          title: "1. Scope and controller",
          paragraphs: [
            "This policy applies to jiddu.app, Jiddu accounts, the public API, hosted MCP tools, and Live. The Chrome extension has a separate [extension privacy policy](/extension/privacy) that explains its browser permissions and local storage.",
            "Jiddu is operated by Rafael de Menezes Ehlers in Brazil. For privacy questions or requests, use the [Jiddu contact form](/contact) or email support@emails.jiddu.app.",
          ],
        },
        {
          title: "2. Information Jiddu handles",
          paragraphs: [
            "Account and contact data can include the user id, name, email address, session information received from WorkOS AuthKit, API-key labels and hashes, support messages, feedback, and invitation details.",
            "Submitted content can include pasted text, public URLs, filenames, extracted PDF or image text, selected rendered PDF pages, Live transcripts, analysis settings, generated results, and the language you choose. Uploaded PDF and screenshot files are processed in memory rather than retained as original files; extracted content and results are stored with the analysis.",
            "Usage and security data can include request IP addresses, timestamps, feature and model choices, token and credit usage, error and reliability data, and feedback about a result. Google Analytics receives ordinary page-traffic and device/browser information.",
            "Purchase records can include your WorkOS user id, email, Stripe customer, Checkout Session and Payment Intent identifiers, package, amount, currency, and purchase status. Stripe processes payment-card details; Jiddu does not store full card numbers or security codes.",
          ],
        },
        {
          title: "3. Why the information is used",
          paragraphs: [
            "Jiddu uses information to authenticate users and API clients, provide requested analyses, maintain account history and share links, meter credits, complete purchases, deliver emails, answer support requests, prevent abuse, secure and troubleshoot the service, and comply with legal obligations.",
            "Depending on the context, processing is necessary to provide the service you requested, to comply with law, for Jiddu's legitimate interests in security and reliable operation, or based on consent where the law requires it.",
          ],
        },
        {
          title: "4. Submitted content and AI providers",
          paragraphs: [
            "Submitted content is sent through OpenRouter to the upstream provider serving the chosen model. Fact verification and finalized Live Context reports can use Perplexity Sonar through OpenRouter to search public sources. Venue autocomplete sends only the typed venue query, not the manuscript, to DBLP.",
            "In Live, raw audio streams directly from the browser to OpenAI's Realtime API over WebRTC. Jiddu does not receive or retain the raw audio. A temporary replay copy remains only in the current browser tab until a new session starts or the tab closes; Jiddu stores the transcript and selected analysis results.",
            "Paper Explainer and adversarial review can send selected rendered PDF page images when figures or tables require visual inspection. Do not submit confidential, proprietary, embargoed, or personal data unless you are authorized to have it processed by these providers.",
          ],
        },
        {
          title: "5. Storage, visibility, and retention",
          paragraphs: [
            "Completed analyses are stored on Hostinger infrastructure in Boston, Massachusetts, United States, and receive an unlisted share URL. They are not placed in the public sitemap, but anyone who has the URL can view the final result. Signing in associates eligible analyses with your account history; it does not make an existing share URL private.",
            "Analysis history is retained while the account remains active unless earlier deletion is requested. Purchase, credit-ledger, security, and operational records can be kept for as long as reasonably necessary for accounting, fraud prevention, dispute handling, legal compliance, and service integrity. Expired caches and temporary processing data are removed or overwritten as part of normal operation.",
          ],
        },
        {
          title: "6. Service providers, sharing, and international transfers",
          paragraphs: [
            "Jiddu shares only the information needed for a function with providers such as Hostinger for hosting, WorkOS for authentication, Stripe for payments, OpenRouter and upstream model providers for analysis, OpenAI for Live transcription, Resend for email delivery, and Google Analytics for traffic measurement.",
            "Some providers process data outside Brazil. Jiddu can also disclose information when required by law, to investigate abuse or protect rights and safety, or as part of a protected merger, financing, acquisition, or transfer of the service. Jiddu does not sell personal information or use submitted content for personalized advertising.",
          ],
        },
        {
          title: "7. Cookies, local storage, and analytics",
          paragraphs: [
            "Jiddu and WorkOS use cookies needed for sign-in and account security. Jiddu also stores language and theme preferences, invitation state, and short-lived one-time API-key display state. Browser local storage supports preferences and interface features such as dismissed notices and Live glossary state.",
            "Google Analytics measures page traffic. Browser settings or privacy tools can block or remove cookies and local storage, although disabling required storage can prevent sign-in or other features from working correctly.",
          ],
        },
        {
          title: "8. Security",
          paragraphs: [
            "Jiddu uses HTTPS, access controls, server-side provider credentials, hashed REST API secrets, and operational safeguards intended to protect information. No internet service can guarantee absolute security. Revoke a REST key immediately if you believe it has been exposed and contact Jiddu about suspected account or data misuse.",
          ],
        },
        {
          title: "9. Your choices and rights",
          paragraphs: [
            "Depending on applicable law, including Brazil's LGPD, you can request confirmation of processing, access, correction, information about sharing, portability where available, revocation of consent, or anonymization, blocking, or deletion of eligible data. Some information can be retained where the law permits or requires it, including records needed for legal obligations and transaction disputes.",
            "Submit a request through the [Jiddu contact form](/contact). Jiddu may ask for information needed to verify that the requester is the account holder or otherwise authorized. Material changes to this policy will be reflected on this page with a new update date.",
          ],
        },
      ],
    },
    terms: {
      title: "Terms of service",
      subtitle:
        "The rules that apply when you use Jiddu's website, accounts, API, MCP tools, Live features, and paid credits.",
      updated: "Last updated: August 5, 2026",
      sections: [
        {
          title: "1. Acceptance and scope",
          paragraphs: [
            "These Terms govern your use of Jiddu's website, accounts, API, hosted MCP tools, Live, Chrome extension, analyses, and related services (the “Services”). By accessing or using the Services, you agree to these Terms and the [Privacy Policy](/privacy). If you do not agree, do not use the Services.",
            "Jiddu is operated by Rafael de Menezes Ehlers in Brazil. If you use the Services for an organization, you confirm that you have authority to accept these Terms for it.",
          ],
        },
        {
          title: "2. Accounts and access",
          paragraphs: [
            "You must provide accurate account information, keep your sign-in methods and API keys secure, and remain responsible for activity performed through your account or credentials. Notify Jiddu promptly if you suspect unauthorized access.",
            "You may not sell, share publicly, or transfer personal credentials. Jiddu can apply reasonable rate limits, credit requirements, and technical restrictions to protect the Services and other users.",
          ],
        },
        {
          title: "3. Your content and share links",
          paragraphs: [
            "You retain your rights in content you submit. You grant Jiddu a limited permission to host, copy, parse, transmit, and process that content only as needed to provide, secure, support, and operate the Services.",
            "You confirm that you have the rights and permissions needed to submit the content and send it to third-party model providers. Do not submit confidential peer-review manuscripts, personal data, copyrighted material, or other restricted content unless you are authorized to do so.",
            "Completed results receive unlisted share URLs. Anyone with a share URL can view the final result, so you are responsible for deciding whether and with whom to share it.",
          ],
        },
        {
          title: "4. Automated analysis and third-party services",
          paragraphs: [
            "Every Jiddu analysis is automated. Labels, scores, explanations, cited sources, paper-review findings, and verdicts can be incomplete, outdated, biased, or wrong. They are tools for critical reading, not professional, legal, medical, financial, academic, or editorial advice and not a substitute for qualified human review.",
            "The Services depend on providers including WorkOS, Stripe, OpenRouter, upstream model providers, OpenAI, Perplexity, Resend, DBLP, and web sources. Their availability and outputs are outside Jiddu's complete control. Additional analysis limitations are described on the [Legal page](/legal).",
          ],
        },
        {
          title: "5. Credits, prices, and payments",
          paragraphs: [
            "Current paid credit packages are one-time purchases processed by Stripe, not recurring subscriptions. The price and currency displayed at Stripe Checkout control the transaction. Credits are added only after Jiddu verifies that Stripe marked the payment complete.",
            "Jiddu Credits are limited, non-transferable service units. They are not money, cannot be redeemed for cash, and are consumed by eligible usage. Initial reservations are estimates; the final debit can depend on document length, selected features, provider usage, retries, and completed work. Current estimates are described on [How Jiddu works](/how-it-works#credits-billing).",
            "Refunds and cancellations are handled as required by applicable law. Contact Jiddu promptly about duplicate, unauthorized, or technically failed purchases. Jiddu may change future package prices or usage rates, but changes do not retroactively reduce completed purchases or rewrite past ledger entries.",
          ],
        },
        {
          title: "6. Acceptable use",
          paragraphs: [
            "You may not use the Services to violate law or another person's rights; submit material you are not authorized to process; harass, defame, threaten, deceive, or facilitate harm; distribute malware; probe or disrupt the Services; bypass access, safety, or rate controls; scrape at abusive scale; reverse engineer protected components; or use another person's credentials without permission.",
            "You are responsible for reviewing outputs before publishing or acting on them. If you republish a result or use it in a decision, you are responsible for that use and for providing appropriate context about its automated nature.",
          ],
        },
        {
          title: "7. Jiddu materials and feedback",
          paragraphs: [
            "Jiddu and its licensors retain rights in the Services, interface, software, branding, original taxonomies, and documentation. These Terms do not transfer those rights to you. Third-party sources, papers, libraries, and trademarks remain subject to their own rights and licenses.",
            "If you send feedback, you allow Jiddu to use it without payment or obligation, provided that doing so does not grant Jiddu ownership of your submitted documents or personal information.",
          ],
        },
        {
          title: "8. Availability and changes",
          paragraphs: [
            "Jiddu can add, change, suspend, or discontinue features and model routes, and can perform maintenance without guaranteeing uninterrupted availability. Jiddu will make reasonable efforts to avoid unnecessary disruption and to disclose material changes.",
            "These Terms can be updated to reflect service, legal, or security changes. The update date appears above. Continued use after revised Terms take effect means you accept the revised Terms to the extent permitted by law.",
          ],
        },
        {
          title: "9. Disclaimers and limitation of liability",
          paragraphs: [
            "To the extent permitted by law, the Services are provided on an “as is” and “as available” basis without guarantees that any analysis, source, model output, or feature will be accurate, complete, secure, or continuously available.",
            "To the extent permitted by law, Jiddu is not liable for indirect, incidental, special, consequential, or punitive losses, or for decisions, publications, disputes, lost data, or lost profits arising from reliance on automated output or unauthorized sharing of a result URL. Nothing in these Terms excludes rights or liability that applicable law does not allow to be excluded.",
          ],
        },
        {
          title: "10. Suspension, termination, law, and contact",
          paragraphs: [
            "Jiddu can suspend or terminate access when reasonably necessary to address a material breach, fraud, security risk, unlawful use, nonpayment, or harm to the Services or others. You can stop using the Services at any time and request eligible account-data deletion under the Privacy Policy.",
            "Brazilian law governs these Terms, subject to any mandatory consumer or data-protection rights that apply to you. Disputes will be handled by the competent courts determined under applicable law.",
            "Questions about these Terms can be sent through the [Jiddu contact form](/contact) or to support@emails.jiddu.app.",
          ],
        },
      ],
    },
  },
  pt: {
    privacy: {
      title: "Política de privacidade",
      subtitle:
        "Como o Jiddu trata dados da conta, conteúdo enviado, pagamentos, analytics e uso do serviço no site, API, MCP e Live.",
      updated: "Última atualização: 5 de agosto de 2026",
      sections: [
        {
          title: "1. Escopo e controlador",
          paragraphs: [
            "Esta política se aplica ao jiddu.app, às contas Jiddu, à API pública, às ferramentas MCP hospedadas e ao Live. A extensão do Chrome tem uma [política de privacidade própria](/extension/privacy), que explica as permissões do navegador e o armazenamento local.",
            "O Jiddu é operado por Rafael de Menezes Ehlers no Brasil. Para dúvidas ou solicitações de privacidade, use o [formulário de contato do Jiddu](/contact) ou escreva para support@emails.jiddu.app.",
          ],
        },
        {
          title: "2. Informações tratadas pelo Jiddu",
          paragraphs: [
            "Dados de conta e contato podem incluir id de usuário, nome, email, informações de sessão recebidas do WorkOS AuthKit, rótulos e hashes de chaves de API, mensagens de suporte, feedback e dados de convites.",
            "O conteúdo enviado pode incluir texto colado, URLs públicas, nomes de arquivos, texto extraído de PDFs ou imagens, páginas renderizadas selecionadas de PDFs, transcrições do Live, configurações da análise, resultados gerados e o idioma escolhido. PDFs e screenshots enviados são processados em memória, sem retenção do arquivo original; o conteúdo extraído e os resultados ficam armazenados com a análise.",
            "Dados de uso e segurança podem incluir IP da requisição, horários, recursos e modelos escolhidos, consumo de tokens e créditos, erros, dados de confiabilidade e feedback sobre resultados. O Google Analytics recebe informações usuais de tráfego, dispositivo e navegador.",
            "Registros de compra podem incluir seu id WorkOS, email, identificadores de cliente, Checkout Session e Payment Intent do Stripe, pacote, valor, moeda e status. O Stripe processa os dados do cartão; o Jiddu não armazena o número completo nem o código de segurança.",
          ],
        },
        {
          title: "3. Por que as informações são usadas",
          paragraphs: [
            "O Jiddu usa informações para autenticar usuários e clientes de API, fornecer as análises solicitadas, manter o histórico e links compartilháveis, contabilizar créditos, concluir compras, entregar emails, responder ao suporte, prevenir abuso, proteger e diagnosticar o serviço e cumprir obrigações legais.",
            "Conforme o contexto, o tratamento é necessário para prestar o serviço solicitado, cumprir a lei, atender aos interesses legítimos do Jiddu em segurança e operação confiável ou se baseia em consentimento quando exigido.",
          ],
        },
        {
          title: "4. Conteúdo enviado e provedores de IA",
          paragraphs: [
            "O conteúdo enviado passa pelo OpenRouter ao provedor upstream do modelo escolhido. A verificação de fatos e relatórios finalizados do Context no Live podem usar o Perplexity Sonar via OpenRouter para pesquisar fontes públicas. O autocomplete de venues envia ao DBLP apenas a consulta digitada, não o manuscrito.",
            "No Live, o áudio bruto é transmitido diretamente do navegador para a Realtime API da OpenAI via WebRTC. O Jiddu não recebe nem retém esse áudio. Uma cópia temporária para replay fica apenas na aba atual até o início de uma nova sessão ou o fechamento da aba; o Jiddu armazena a transcrição e os resultados selecionados.",
            "O Paper Explainer e a revisão adversarial podem enviar imagens renderizadas de páginas selecionadas do PDF quando figuras ou tabelas exigem inspeção visual. Não envie dados confidenciais, proprietários, sob embargo ou pessoais sem autorização para que esses provedores os processem.",
          ],
        },
        {
          title: "5. Armazenamento, visibilidade e retenção",
          paragraphs: [
            "Análises concluídas são armazenadas na infraestrutura da Hostinger em Boston, Massachusetts, Estados Unidos, e recebem uma URL compartilhável não listada. Elas não entram no sitemap público, mas qualquer pessoa com a URL pode visualizar o resultado final. O login associa análises elegíveis ao histórico da conta; ele não torna privada uma URL já existente.",
            "O histórico é mantido enquanto a conta permanecer ativa, salvo solicitação de exclusão anterior. Registros de compras, ledger de créditos, segurança e operação podem ser mantidos pelo tempo razoavelmente necessário para contabilidade, prevenção de fraude, disputas, cumprimento legal e integridade do serviço. Caches expirados e dados temporários são removidos ou sobrescritos na operação normal.",
          ],
        },
        {
          title: "6. Provedores, compartilhamento e transferências internacionais",
          paragraphs: [
            "O Jiddu compartilha apenas as informações necessárias a cada função com provedores como Hostinger para hospedagem, WorkOS para autenticação, Stripe para pagamentos, OpenRouter e provedores upstream para análises, OpenAI para transcrição do Live, Resend para emails e Google Analytics para medição de tráfego.",
            "Alguns provedores tratam dados fora do Brasil. O Jiddu também pode divulgar informações quando exigido por lei, para investigar abuso ou proteger direitos e segurança, ou em uma fusão, financiamento, aquisição ou transferência protegida do serviço. O Jiddu não vende dados pessoais nem usa o conteúdo enviado para publicidade personalizada.",
          ],
        },
        {
          title: "7. Cookies, armazenamento local e analytics",
          paragraphs: [
            "O Jiddu e o WorkOS usam cookies necessários para login e segurança da conta. O Jiddu também guarda preferências de idioma e tema, estado de convites e o estado temporário de exibição única de chaves de API. O armazenamento local do navegador sustenta preferências e recursos como avisos dispensados e o glossário do Live.",
            "O Google Analytics mede o tráfego das páginas. Configurações do navegador ou ferramentas de privacidade podem bloquear ou apagar cookies e dados locais, embora desativar o armazenamento necessário possa impedir o login ou o funcionamento de recursos.",
          ],
        },
        {
          title: "8. Segurança",
          paragraphs: [
            "O Jiddu usa HTTPS, controles de acesso, credenciais de provedores mantidas no servidor, segredos de API REST em hash e salvaguardas operacionais para proteger as informações. Nenhum serviço na internet garante segurança absoluta. Revogue imediatamente uma chave REST que possa ter sido exposta e avise o Jiddu sobre suspeitas de uso indevido da conta ou dos dados.",
          ],
        },
        {
          title: "9. Suas escolhas e direitos",
          paragraphs: [
            "Conforme a lei aplicável, inclusive a LGPD, você pode solicitar confirmação do tratamento, acesso, correção, informação sobre compartilhamento, portabilidade quando disponível, revogação do consentimento ou anonimização, bloqueio ou exclusão de dados elegíveis. Algumas informações podem ser mantidas quando a lei permite ou exige, inclusive registros necessários a obrigações legais e disputas de transações.",
            "Envie a solicitação pelo [formulário de contato do Jiddu](/contact). O Jiddu pode pedir informações necessárias para confirmar que o solicitante é titular da conta ou está autorizado. Mudanças relevantes nesta política aparecerão nesta página com uma nova data de atualização.",
          ],
        },
      ],
    },
    terms: {
      title: "Termos de serviço",
      subtitle:
        "As regras aplicáveis ao uso do site, contas, API, ferramentas MCP, Live e créditos pagos do Jiddu.",
      updated: "Última atualização: 5 de agosto de 2026",
      sections: [
        {
          title: "1. Aceitação e escopo",
          paragraphs: [
            "Estes Termos regem o uso do site, contas, API, ferramentas MCP hospedadas, Live, extensão do Chrome, análises e serviços relacionados do Jiddu (os “Serviços”). Ao acessar ou usar os Serviços, você concorda com estes Termos e com a [Política de Privacidade](/privacy). Se não concordar, não use os Serviços.",
            "O Jiddu é operado por Rafael de Menezes Ehlers no Brasil. Se você usa os Serviços em nome de uma organização, confirma que tem autoridade para aceitar estes Termos por ela.",
          ],
        },
        {
          title: "2. Contas e acesso",
          paragraphs: [
            "Você deve fornecer informações corretas, proteger seus métodos de login e chaves de API e permanece responsável pelas atividades realizadas com sua conta ou credenciais. Avise o Jiddu imediatamente se suspeitar de acesso não autorizado.",
            "Você não pode vender, publicar ou transferir credenciais pessoais. O Jiddu pode aplicar limites razoáveis, exigências de créditos e restrições técnicas para proteger os Serviços e outros usuários.",
          ],
        },
        {
          title: "3. Seu conteúdo e links compartilháveis",
          paragraphs: [
            "Você mantém seus direitos sobre o conteúdo enviado. Você concede ao Jiddu permissão limitada para hospedar, copiar, extrair, transmitir e processar esse conteúdo apenas quando necessário para fornecer, proteger, apoiar e operar os Serviços.",
            "Você confirma que possui os direitos e autorizações necessários para enviar o conteúdo e encaminhá-lo a provedores de modelos. Não envie manuscritos confidenciais de peer review, dados pessoais, material protegido ou outro conteúdo restrito sem autorização.",
            "Resultados concluídos recebem URLs compartilháveis não listadas. Qualquer pessoa com a URL pode ver o resultado final; portanto, você é responsável por decidir se e com quem compartilhá-la.",
          ],
        },
        {
          title: "4. Análise automatizada e serviços de terceiros",
          paragraphs: [
            "Toda análise do Jiddu é automatizada. Rótulos, pontuações, explicações, fontes citadas, findings de revisão e vereditos podem estar incompletos, desatualizados, enviesados ou errados. São ferramentas de leitura crítica, não aconselhamento profissional, jurídico, médico, financeiro, acadêmico ou editorial, nem substituem revisão humana qualificada.",
            "Os Serviços dependem de provedores como WorkOS, Stripe, OpenRouter, provedores upstream, OpenAI, Perplexity, Resend, DBLP e fontes da web. A disponibilidade e as saídas desses terceiros não estão sob controle integral do Jiddu. Outras limitações estão na página [Legal](/legal).",
          ],
        },
        {
          title: "5. Créditos, preços e pagamentos",
          paragraphs: [
            "Os pacotes pagos atuais são compras únicas processadas pelo Stripe, não assinaturas recorrentes. O preço e a moeda exibidos no Stripe Checkout regem a transação. Os créditos só são adicionados após o Jiddu confirmar que o Stripe marcou o pagamento como concluído.",
            "Créditos Jiddu são unidades limitadas e intransferíveis de serviço. Não são dinheiro, não podem ser resgatados por valor em espécie e são consumidos pelo uso elegível. Reservas iniciais são estimativas; o débito final pode depender do tamanho do documento, recursos escolhidos, uso do provedor, tentativas e trabalho concluído. As estimativas atuais estão em [Como o Jiddu funciona](/how-it-works#credits-billing).",
            "Reembolsos e cancelamentos seguem a lei aplicável. Entre em contato rapidamente em caso de compra duplicada, não autorizada ou com falha técnica. O Jiddu pode alterar preços de pacotes ou taxas de uso futuras, mas mudanças não reduzem retroativamente compras concluídas nem reescrevem lançamentos anteriores do ledger.",
          ],
        },
        {
          title: "6. Uso aceitável",
          paragraphs: [
            "Você não pode usar os Serviços para violar a lei ou direitos de terceiros; enviar material sem autorização; assediar, difamar, ameaçar, enganar ou facilitar dano; distribuir malware; sondar ou interromper os Serviços; contornar controles de acesso, segurança ou limites; fazer scraping em escala abusiva; realizar engenharia reversa de componentes protegidos; ou usar credenciais de outra pessoa sem permissão.",
            "Você é responsável por revisar as saídas antes de publicá-las ou agir com base nelas. Ao republicar um resultado ou usá-lo em uma decisão, você responde por esse uso e por contextualizar adequadamente sua natureza automatizada.",
          ],
        },
        {
          title: "7. Materiais do Jiddu e feedback",
          paragraphs: [
            "O Jiddu e seus licenciadores mantêm os direitos sobre os Serviços, interface, software, marca, taxonomias originais e documentação. Estes Termos não transferem esses direitos. Fontes, papers, bibliotecas e marcas de terceiros continuam sujeitos aos respectivos direitos e licenças.",
            "Ao enviar feedback, você permite que o Jiddu o utilize sem pagamento ou obrigação, sem que isso conceda ao Jiddu propriedade sobre seus documentos ou informações pessoais.",
          ],
        },
        {
          title: "8. Disponibilidade e mudanças",
          paragraphs: [
            "O Jiddu pode adicionar, alterar, suspender ou encerrar recursos e rotas de modelos e realizar manutenção sem garantir disponibilidade ininterrupta. O Jiddu fará esforços razoáveis para evitar interrupções desnecessárias e divulgar mudanças relevantes.",
            "Estes Termos podem ser atualizados para refletir mudanças no serviço, na lei ou na segurança. A data aparece acima. Continuar usando após a entrada em vigor dos Termos revisados significa aceitá-los na medida permitida por lei.",
          ],
        },
        {
          title: "9. Isenções e limitação de responsabilidade",
          paragraphs: [
            "Na medida permitida por lei, os Serviços são fornecidos “no estado em que se encontram” e “conforme disponíveis”, sem garantia de que análises, fontes, saídas de modelos ou recursos sejam corretos, completos, seguros ou continuamente disponíveis.",
            "Na medida permitida por lei, o Jiddu não responde por perdas indiretas, incidentais, especiais, consequenciais ou punitivas, nem por decisões, publicações, disputas, perda de dados ou lucros decorrentes da confiança em saídas automatizadas ou do compartilhamento não autorizado de uma URL. Nada nestes Termos exclui direitos ou responsabilidades que a lei não permite excluir.",
          ],
        },
        {
          title: "10. Suspensão, encerramento, lei e contato",
          paragraphs: [
            "O Jiddu pode suspender ou encerrar o acesso quando razoavelmente necessário para lidar com violação relevante, fraude, risco de segurança, uso ilegal, falta de pagamento ou dano aos Serviços ou a terceiros. Você pode parar de usar a qualquer momento e solicitar a exclusão dos dados elegíveis conforme a Política de Privacidade.",
            "A lei brasileira rege estes Termos, preservados os direitos obrigatórios de consumo e proteção de dados aplicáveis. Disputas serão tratadas pelos tribunais competentes definidos pela legislação aplicável.",
            "Dúvidas sobre estes Termos podem ser enviadas pelo [formulário de contato do Jiddu](/contact) ou para support@emails.jiddu.app.",
          ],
        },
      ],
    },
  },
  es: {
    privacy: {
      title: "Política de privacidad",
      subtitle:
        "Cómo Jiddu trata datos de cuenta, contenido enviado, pagos, analítica y uso del servicio en el sitio, API, MCP y Live.",
      updated: "Última actualización: 5 de agosto de 2026",
      sections: [
        {
          title: "1. Alcance y responsable",
          paragraphs: [
            "Esta política se aplica a jiddu.app, las cuentas de Jiddu, la API pública, las herramientas MCP alojadas y Live. La extensión de Chrome tiene una [política de privacidad propia](/extension/privacy) que explica sus permisos y almacenamiento local.",
            "Jiddu es operado por Rafael de Menezes Ehlers en Brasil. Para preguntas o solicitudes de privacidad, usa el [formulario de contacto de Jiddu](/contact) o escribe a support@emails.jiddu.app.",
          ],
        },
        {
          title: "2. Información que trata Jiddu",
          paragraphs: [
            "Los datos de cuenta y contacto pueden incluir id de usuario, nombre, email, información de sesión recibida de WorkOS AuthKit, etiquetas y hashes de claves API, mensajes de soporte, comentarios y datos de invitaciones.",
            "El contenido enviado puede incluir texto pegado, URL públicas, nombres de archivo, texto extraído de PDF o imágenes, páginas renderizadas seleccionadas de PDF, transcripciones de Live, ajustes del análisis, resultados generados y el idioma elegido. Los PDF y screenshots se procesan en memoria sin conservar el archivo original; el contenido extraído y los resultados se guardan con el análisis.",
            "Los datos de uso y seguridad pueden incluir IP de la solicitud, horas, funciones y modelos elegidos, consumo de tokens y créditos, errores, datos de fiabilidad y comentarios sobre resultados. Google Analytics recibe información habitual de tráfico, dispositivo y navegador.",
            "Los registros de compra pueden incluir tu id de WorkOS, email, identificadores de cliente, Checkout Session y Payment Intent de Stripe, paquete, importe, moneda y estado. Stripe procesa los datos de la tarjeta; Jiddu no guarda el número completo ni el código de seguridad.",
          ],
        },
        {
          title: "3. Por qué se usa la información",
          paragraphs: [
            "Jiddu usa información para autenticar usuarios y clientes API, brindar los análisis solicitados, mantener historial y enlaces compartibles, contabilizar créditos, completar compras, enviar emails, responder al soporte, prevenir abusos, proteger y diagnosticar el servicio y cumplir obligaciones legales.",
            "Según el contexto, el tratamiento es necesario para prestar el servicio solicitado, cumplir la ley, atender los intereses legítimos de Jiddu en seguridad y operación fiable o se basa en el consentimiento cuando la ley lo exige.",
          ],
        },
        {
          title: "4. Contenido enviado y proveedores de IA",
          paragraphs: [
            "El contenido enviado pasa por OpenRouter al proveedor upstream del modelo elegido. La verificación de hechos y los informes finalizados de Context en Live pueden usar Perplexity Sonar mediante OpenRouter para buscar fuentes públicas. El autocompletado de venues envía a DBLP solo la consulta escrita, no el manuscrito.",
            "En Live, el audio sin procesar se transmite directamente del navegador a la Realtime API de OpenAI mediante WebRTC. Jiddu no recibe ni conserva ese audio. Una copia temporal para repetición permanece solo en la pestaña actual hasta iniciar otra sesión o cerrarla; Jiddu guarda la transcripción y los resultados seleccionados.",
            "Paper Explainer y la revisión adversarial pueden enviar imágenes renderizadas de páginas seleccionadas cuando figuras o tablas requieren inspección visual. No envíes datos confidenciales, propietarios, bajo embargo o personales sin autorización para que estos proveedores los procesen.",
          ],
        },
        {
          title: "5. Almacenamiento, visibilidad y conservación",
          paragraphs: [
            "Los análisis terminados se guardan en la infraestructura de Hostinger en Boston, Massachusetts, Estados Unidos, y reciben una URL compartible no listada. No aparecen en el sitemap público, pero cualquiera con la URL puede ver el resultado final. Iniciar sesión asocia los análisis elegibles al historial de la cuenta; no convierte en privada una URL existente.",
            "El historial se conserva mientras la cuenta siga activa, salvo solicitud de eliminación anterior. Los registros de compras, ledger de créditos, seguridad y operación pueden mantenerse durante el tiempo razonablemente necesario para contabilidad, prevención del fraude, disputas, cumplimiento legal e integridad del servicio. Las cachés vencidas y los datos temporales se eliminan o sobrescriben durante la operación normal.",
          ],
        },
        {
          title: "6. Proveedores, transferencias y procesamiento internacional",
          paragraphs: [
            "Jiddu comparte solo la información necesaria para cada función con proveedores como Hostinger para alojamiento, WorkOS para autenticación, Stripe para pagos, OpenRouter y proveedores upstream para análisis, OpenAI para transcripción de Live, Resend para emails y Google Analytics para medir tráfico.",
            "Algunos proveedores tratan datos fuera de Brasil. Jiddu también puede divulgar información cuando la ley lo exija, para investigar abusos o proteger derechos y seguridad, o en una fusión, financiación, adquisición o transferencia protegida del servicio. Jiddu no vende datos personales ni usa el contenido enviado para publicidad personalizada.",
          ],
        },
        {
          title: "7. Cookies, almacenamiento local y analítica",
          paragraphs: [
            "Jiddu y WorkOS usan cookies necesarias para el inicio de sesión y la seguridad. Jiddu también guarda preferencias de idioma y tema, estado de invitaciones y el estado temporal de visualización única de claves API. El almacenamiento local sustenta preferencias y funciones como avisos descartados y el glosario de Live.",
            "Google Analytics mide el tráfico de las páginas. La configuración del navegador o herramientas de privacidad pueden bloquear o borrar cookies y datos locales, aunque desactivar el almacenamiento necesario puede impedir el inicio de sesión u otras funciones.",
          ],
        },
        {
          title: "8. Seguridad",
          paragraphs: [
            "Jiddu usa HTTPS, controles de acceso, credenciales de proveedores mantenidas en el servidor, secretos API REST con hash y salvaguardas operativas para proteger la información. Ningún servicio en internet garantiza seguridad absoluta. Revoca de inmediato una clave REST que pueda haber sido expuesta y avisa a Jiddu ante sospechas de uso indebido de la cuenta o los datos.",
          ],
        },
        {
          title: "9. Tus opciones y derechos",
          paragraphs: [
            "Según la ley aplicable, incluida la LGPD de Brasil, puedes solicitar confirmación del tratamiento, acceso, corrección, información sobre transferencias, portabilidad cuando esté disponible, revocación del consentimiento o anonimización, bloqueo o eliminación de datos elegibles. Cierta información puede conservarse cuando la ley lo permita o exija, incluidos registros necesarios para obligaciones legales y disputas de transacciones.",
            "Envía la solicitud mediante el [formulario de contacto de Jiddu](/contact). Jiddu puede pedir información necesaria para verificar que el solicitante sea titular de la cuenta o esté autorizado. Los cambios relevantes aparecerán en esta página con una nueva fecha de actualización.",
          ],
        },
      ],
    },
    terms: {
      title: "Términos de servicio",
      subtitle:
        "Las reglas aplicables al uso del sitio, cuentas, API, herramientas MCP, Live y créditos pagados de Jiddu.",
      updated: "Última actualización: 5 de agosto de 2026",
      sections: [
        {
          title: "1. Aceptación y alcance",
          paragraphs: [
            "Estos Términos rigen el uso del sitio, cuentas, API, herramientas MCP alojadas, Live, extensión de Chrome, análisis y servicios relacionados de Jiddu (los “Servicios”). Al acceder o usar los Servicios, aceptas estos Términos y la [Política de Privacidad](/privacy). Si no estás de acuerdo, no uses los Servicios.",
            "Jiddu es operado por Rafael de Menezes Ehlers en Brasil. Si usas los Servicios para una organización, confirmas que tienes autoridad para aceptar estos Términos en su nombre.",
          ],
        },
        {
          title: "2. Cuentas y acceso",
          paragraphs: [
            "Debes proporcionar información correcta, proteger tus métodos de acceso y claves API y sigues siendo responsable por las actividades realizadas con tu cuenta o credenciales. Avisa a Jiddu de inmediato si sospechas acceso no autorizado.",
            "No puedes vender, publicar ni transferir credenciales personales. Jiddu puede aplicar límites razonables, requisitos de créditos y restricciones técnicas para proteger los Servicios y a otros usuarios.",
          ],
        },
        {
          title: "3. Tu contenido y enlaces compartibles",
          paragraphs: [
            "Conservas tus derechos sobre el contenido enviado. Concedes a Jiddu un permiso limitado para alojar, copiar, extraer, transmitir y procesar ese contenido solo cuando sea necesario para brindar, proteger, apoyar y operar los Servicios.",
            "Confirmas que tienes los derechos y autorizaciones necesarios para enviar el contenido y remitirlo a proveedores de modelos. No envíes manuscritos confidenciales de peer review, datos personales, material protegido u otro contenido restringido sin autorización.",
            "Los resultados terminados reciben URL compartibles no listadas. Cualquiera con la URL puede ver el resultado final; eres responsable de decidir si compartirla y con quién.",
          ],
        },
        {
          title: "4. Análisis automatizado y servicios de terceros",
          paragraphs: [
            "Todos los análisis de Jiddu son automatizados. Etiquetas, puntuaciones, explicaciones, fuentes citadas, hallazgos de revisión y veredictos pueden estar incompletos, desactualizados, sesgados o equivocados. Son herramientas de lectura crítica, no asesoramiento profesional, legal, médico, financiero, académico o editorial, ni sustituyen una revisión humana cualificada.",
            "Los Servicios dependen de proveedores como WorkOS, Stripe, OpenRouter, proveedores upstream, OpenAI, Perplexity, Resend, DBLP y fuentes web. Su disponibilidad y resultados no están bajo el control completo de Jiddu. Otras limitaciones se describen en la página [Legal](/legal).",
          ],
        },
        {
          title: "5. Créditos, precios y pagos",
          paragraphs: [
            "Los paquetes pagados actuales son compras únicas procesadas por Stripe, no suscripciones recurrentes. El precio y la moneda mostrados en Stripe Checkout rigen la transacción. Los créditos se agregan solo después de que Jiddu confirme que Stripe marcó el pago como completo.",
            "Los Créditos Jiddu son unidades de servicio limitadas e intransferibles. No son dinero, no pueden canjearse por efectivo y se consumen mediante el uso elegible. Las reservas iniciales son estimaciones; el débito final puede depender del tamaño del documento, funciones elegidas, uso del proveedor, reintentos y trabajo completado. Las estimaciones actuales están en [Cómo funciona Jiddu](/how-it-works#credits-billing).",
            "Los reembolsos y cancelaciones se manejan según la ley aplicable. Contacta rápidamente en caso de compra duplicada, no autorizada o con fallo técnico. Jiddu puede cambiar precios o tasas de uso futuras, pero los cambios no reducen retroactivamente compras completadas ni reescriben entradas pasadas del ledger.",
          ],
        },
        {
          title: "6. Uso aceptable",
          paragraphs: [
            "No puedes usar los Servicios para infringir la ley o derechos ajenos; enviar material sin autorización; acosar, difamar, amenazar, engañar o facilitar daños; distribuir malware; sondear o interrumpir los Servicios; eludir controles de acceso, seguridad o límites; hacer scraping a escala abusiva; aplicar ingeniería inversa a componentes protegidos; o usar credenciales ajenas sin permiso.",
            "Eres responsable de revisar los resultados antes de publicarlos o actuar con base en ellos. Si republicas un resultado o lo usas en una decisión, respondes por ese uso y por contextualizar adecuadamente su naturaleza automatizada.",
          ],
        },
        {
          title: "7. Materiales de Jiddu y comentarios",
          paragraphs: [
            "Jiddu y sus licenciantes conservan los derechos sobre los Servicios, interfaz, software, marca, taxonomías originales y documentación. Estos Términos no transfieren esos derechos. Fuentes, papers, bibliotecas y marcas de terceros siguen sujetos a sus propios derechos y licencias.",
            "Si envías comentarios, permites que Jiddu los use sin pago u obligación, sin que ello otorgue a Jiddu propiedad sobre tus documentos o datos personales.",
          ],
        },
        {
          title: "8. Disponibilidad y cambios",
          paragraphs: [
            "Jiddu puede agregar, cambiar, suspender o retirar funciones y rutas de modelos y realizar mantenimiento sin garantizar disponibilidad ininterrumpida. Jiddu hará esfuerzos razonables para evitar interrupciones innecesarias y divulgar cambios relevantes.",
            "Estos Términos pueden actualizarse para reflejar cambios del servicio, legales o de seguridad. La fecha aparece arriba. Seguir usando los Servicios tras la entrada en vigor de los Términos revisados significa aceptarlos en la medida permitida por la ley.",
          ],
        },
        {
          title: "9. Descargos y limitación de responsabilidad",
          paragraphs: [
            "En la medida permitida por la ley, los Servicios se prestan “tal cual” y “según disponibilidad”, sin garantía de que análisis, fuentes, resultados de modelos o funciones sean correctos, completos, seguros o estén disponibles continuamente.",
            "En la medida permitida por la ley, Jiddu no responde por pérdidas indirectas, incidentales, especiales, consecuentes o punitivas, ni por decisiones, publicaciones, disputas, pérdida de datos o beneficios derivados de confiar en resultados automatizados o compartir sin autorización una URL. Nada en estos Términos excluye derechos o responsabilidades que la ley no permita excluir.",
          ],
        },
        {
          title: "10. Suspensión, terminación, ley y contacto",
          paragraphs: [
            "Jiddu puede suspender o terminar el acceso cuando sea razonablemente necesario para abordar un incumplimiento importante, fraude, riesgo de seguridad, uso ilegal, impago o daño a los Servicios o terceros. Puedes dejar de usar los Servicios en cualquier momento y solicitar la eliminación de datos elegibles según la Política de Privacidad.",
            "La ley brasileña rige estos Términos, preservando los derechos obligatorios de consumo y protección de datos aplicables. Las disputas se tratarán ante los tribunales competentes definidos por la legislación aplicable.",
            "Las preguntas sobre estos Términos pueden enviarse mediante el [formulario de contacto de Jiddu](/contact) o a support@emails.jiddu.app.",
          ],
        },
      ],
    },
  },
};
