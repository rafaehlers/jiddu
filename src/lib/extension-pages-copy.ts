import type { Lang } from "@/lib/fallacies";

export type ExtensionLandingCopy = {
  eyebrow: string;
  title: string;
  description: string;
  addToChrome: string;
  comingSoon: string;
  createKey: string;
  requirement: string;
  demoEyebrow: string;
  demoTitle: string;
  demoPassage: string;
  selectedPassage: string;
  lenses: Array<{ name: string; description: string }>;
  resultEyebrow: string;
  resultTitle: string;
  resultBody: string;
  resultTag: string;
  features: Array<{ title: string; description: string }>;
  stepsEyebrow: string;
  stepsTitle: string;
  steps: Array<{ title: string; description: string }>;
  privacyEyebrow: string;
  privacyTitle: string;
  privacyDescription: string;
  privacyPoints: string[];
  privacyLink: string;
  faqEyebrow: string;
  faqTitle: string;
  faq: Array<{ question: string; answer: string }>;
  closingTitle: string;
  closingDescription: string;
};

export type ExtensionPrivacyCopy = {
  eyebrow: string;
  title: string;
  subtitle: string;
  updated: string;
  limitedUseTitle: string;
  limitedUse: string;
  sections: Array<{ title: string; paragraphs: string[] }>;
  back: string;
};

export const EXTENSION_PAGES_COPY: Record<
  Lang,
  { landing: ExtensionLandingCopy; privacy: ExtensionPrivacyCopy }
> = {
  en: {
    landing: {
      eyebrow: "JIDDU FOR CHROME",
      title: "Critical reading, without leaving the page.",
      description:
        "Select a passage on any website and examine its reasoning, factual claims, or framing in a focused side panel.",
      addToChrome: "Add to Chrome",
      comingSoon: "Chrome Web Store beta coming soon",
      createKey: "Create an API key",
      requirement: "Requires a Jiddu account and a personal API key.",
      demoEyebrow: "ONE PASSAGE · THREE LENSES",
      demoTitle: "Choose exactly what you want to question.",
      demoPassage:
        "Everyone knows this policy failed, so only a reckless person could still defend it.",
      selectedPassage: "Selected passage",
      lenses: [
        { name: "Fallacies", description: "Inspect the reasoning" },
        { name: "Facts", description: "Check claims with sources" },
        { name: "Bias", description: "Surface framing and omissions" },
      ],
      resultEyebrow: "FALLACY FOUND",
      resultTitle: "Appeal to popularity",
      resultBody:
        "“Everyone knows” replaces evidence with an assumed consensus, while the second clause dismisses disagreement before examining it.",
      resultTag: "Reasoning",
      features: [
        {
          title: "Intentional by design",
          description:
            "Jiddu reads nothing until you click its icon, select a passage, and choose an analysis.",
        },
        {
          title: "Bound to the original tab",
          description:
            "The side panel stays with the page being analyzed instead of following you around the browser.",
        },
        {
          title: "Reports you can keep",
          description:
            "Print a clean report from a temporary tab, then continue reading where you left off.",
        },
      ],
      stepsEyebrow: "SETUP",
      stepsTitle: "From installation to first analysis in three steps.",
      steps: [
        {
          title: "Install the extension",
          description:
            "Add Jiddu from the Chrome Web Store and pin it to the toolbar.",
        },
        {
          title: "Create your API key",
          description:
            "Sign in to Jiddu and generate a personal key in your account.",
        },
        {
          title: "Select a passage",
          description:
            "Click the Jiddu icon, choose text, then pick Fallacies, Facts, or Bias.",
        },
      ],
      privacyEyebrow: "PRIVACY",
      privacyTitle: "Selection is local. Analysis is deliberate.",
      privacyDescription:
        "Hovering and selecting stay inside Chrome. The passage is sent to Jiddu only after you explicitly choose an analysis.",
      privacyPoints: [
        "Your API key is stored only in this Chrome installation.",
        "The selected passage is transmitted over HTTPS and stored in your account analysis history.",
        "The page title and URL remain in temporary Chrome session storage and are not sent to Jiddu.",
        "Jiddu does not sell extension data or use it for advertising.",
      ],
      privacyLink: "Read the extension privacy policy",
      faqEyebrow: "FAQ",
      faqTitle: "Before you install.",
      faq: [
        {
          question: "Does Jiddu read every page I visit?",
          answer:
            "No. It activates only after you click the Jiddu icon or its shortcut. Nothing is sent until you choose a passage and an analysis.",
        },
        {
          question: "Why does the extension need an API key?",
          answer:
            "The key connects requests to your account, credits, and history. You can revoke it from your account at any time.",
        },
        {
          question: "Which text is stored?",
          answer:
            "The passage you deliberately submit and its result are stored in Jiddu. Page titles and URLs remain only in Chrome session storage.",
        },
        {
          question: "Can I choose the two languages separately?",
          answer:
            "Yes. English is the default interface; English, Portuguese, and Spanish are available independently for interface and explanations.",
        },
        {
          question: "Can Jiddu be wrong?",
          answer:
            "Yes. Analyses are automated aids, not final judgments. Review the language and open the cited fact-check sources.",
        },
      ],
      closingTitle: "Keep a second reading beside the first.",
      closingDescription:
        "Install the beta, connect your key, and question one passage at a time.",
    },
    privacy: {
      eyebrow: "JIDDU CHROME EXTENSION",
      title: "Privacy policy",
      subtitle:
        "How the Jiddu Chrome extension handles selected website content, API credentials, settings, and results.",
      updated: "Last updated: August 2, 2026",
      limitedUseTitle: "Chrome Web Store Limited Use disclosure",
      limitedUse:
        "Jiddu's use and transfer of information received from Chrome APIs complies with the Chrome Web Store User Data Policy, including the Limited Use requirements. Data is used only to provide or improve the extension's user-facing critical-reading features and never for personalized advertising.",
      sections: [
        {
          title: "1. Scope and single purpose",
          paragraphs: [
            "The extension's single purpose is to let a user deliberately select a passage on a webpage and request a fallacy, fact, or bias analysis. It does not monitor browsing in the background, alter search settings, inject advertising, or collect page content automatically.",
          ],
        },
        {
          title: "2. Information handled in Chrome",
          paragraphs: [
            "The extension handles the personal Jiddu API key, language settings, the deliberately selected passage, the page title and URL used to label the local report, and the generated analysis.",
            "The API key and preferences use chrome.storage.local. The current report, page title, and URL use chrome.storage.session and are cleared when the relevant tab closes or navigates away.",
          ],
        },
        {
          title: "3. When information leaves Chrome",
          paragraphs: [
            "Nothing is transmitted when the user merely opens Jiddu, hovers, or selects an element. After the user chooses Fallacies, Facts, or Bias, the selected passage and requested language are sent over HTTPS to https://jiddu.app. The API key is sent in an authentication header.",
            "The page title and URL are not included in the Jiddu API request.",
          ],
        },
        {
          title: "4. Processing and service providers",
          paragraphs: [
            "Jiddu uses the passage only to authenticate the request, produce the requested analysis, prevent abuse, account for usage, and maintain the user's analysis history.",
            "Jiddu sends the passage through OpenRouter to the upstream model provider selected by Jiddu. Fact checks can also use web-search-capable models to retrieve supporting sources. These transfers are necessary to provide the stated function.",
          ],
        },
        {
          title: "5. Server storage and retention",
          paragraphs: [
            "Jiddu stores the submitted passage and result in the API key owner's account history. API secrets are stored by Jiddu only as hashes; the raw key remains in the user's Chrome installation.",
            "Analysis history is retained while the account remains active unless the user requests earlier deletion through https://jiddu.app/contact. Operational logs may retain IP addresses and request metadata only as needed for security, abuse prevention, reliability, and legal compliance.",
          ],
        },
        {
          title: "6. Sharing, advertising, and human access",
          paragraphs: [
            "Jiddu does not sell extension data and does not use or transfer it for personalized, retargeted, or interest-based advertising.",
            "Data is transferred only to providers needed for the analysis, for security, to comply with law, or in a protected corporate transaction. Humans do not read passages except with specific support consent, for security, when required by law, or after aggregation and anonymization for internal operations.",
          ],
        },
        {
          title: "7. Security, control, and changes",
          paragraphs: [
            "The production extension communicates only with https://jiddu.app. Users can revoke a key, remove the extension to clear local storage, and request deletion or support at https://jiddu.app/contact.",
            "Do not submit confidential, proprietary, embargoed, or personal information unless you are authorized to have it processed by third-party model providers. Material policy changes will be disclosed before they take effect.",
          ],
        },
      ],
      back: "Back to Jiddu for Chrome",
    },
  },
  pt: {
    landing: {
      eyebrow: "JIDDU PARA CHROME",
      title: "Leitura crítica, sem sair da página.",
      description:
        "Selecione um trecho em qualquer site e examine o raciocínio, as afirmações factuais ou o enquadramento em uma side panel focada.",
      addToChrome: "Adicionar ao Chrome",
      comingSoon: "Beta na Chrome Web Store em breve",
      createKey: "Criar uma chave de API",
      requirement: "Requer uma conta Jiddu e uma chave de API pessoal.",
      demoEyebrow: "UM TRECHO · TRÊS LENTES",
      demoTitle: "Escolha exatamente o que você quer questionar.",
      demoPassage:
        "Todo mundo sabe que essa política fracassou, então somente uma pessoa irresponsável ainda poderia defendê-la.",
      selectedPassage: "Trecho selecionado",
      lenses: [
        { name: "Falácias", description: "Examine o raciocínio" },
        { name: "Fatos", description: "Cheque afirmações com fontes" },
        { name: "Parcialidade", description: "Revele enquadramentos e omissões" },
      ],
      resultEyebrow: "FALÁCIA ENCONTRADA",
      resultTitle: "Apelo à popularidade",
      resultBody:
        "“Todo mundo sabe” substitui evidências por um consenso presumido, enquanto a segunda parte descarta a discordância antes de examiná-la.",
      resultTag: "Raciocínio",
      features: [
        {
          title: "Intencional por design",
          description:
            "O Jiddu não lê nada até você clicar no ícone, selecionar um trecho e escolher uma análise.",
        },
        {
          title: "Vinculado à aba original",
          description:
            "A side panel permanece com a página analisada em vez de seguir você pelo navegador.",
        },
        {
          title: "Relatórios que você pode guardar",
          description:
            "Imprima um relatório limpo em uma aba temporária e continue lendo de onde parou.",
        },
      ],
      stepsEyebrow: "CONFIGURAÇÃO",
      stepsTitle: "Da instalação à primeira análise em três passos.",
      steps: [
        {
          title: "Instale a extensão",
          description:
            "Adicione o Jiddu pela Chrome Web Store e fixe-o na barra de ferramentas.",
        },
        {
          title: "Crie sua chave de API",
          description:
            "Entre no Jiddu e gere uma chave pessoal na sua conta.",
        },
        {
          title: "Selecione um trecho",
          description:
            "Clique no ícone, escolha um texto e selecione Falácias, Fatos ou Parcialidade.",
        },
      ],
      privacyEyebrow: "PRIVACIDADE",
      privacyTitle: "A seleção é local. A análise é deliberada.",
      privacyDescription:
        "Passar o cursor e selecionar acontecem dentro do Chrome. O trecho só é enviado depois que você escolhe uma análise.",
      privacyPoints: [
        "Sua chave de API fica somente nesta instalação do Chrome.",
        "O trecho enviado passa por HTTPS e fica no histórico da sua conta.",
        "O título e a URL ficam na sessão temporária do Chrome e não são enviados ao Jiddu.",
        "O Jiddu não vende dados da extensão nem os utiliza para publicidade.",
      ],
      privacyLink: "Ler a política de privacidade da extensão",
      faqEyebrow: "PERGUNTAS FREQUENTES",
      faqTitle: "Antes de instalar.",
      faq: [
        {
          question: "O Jiddu lê todas as páginas que visito?",
          answer:
            "Não. A extensão só é ativada após o clique no ícone ou uso do atalho. Nada é enviado até você escolher um trecho e uma análise.",
        },
        {
          question: "Por que a extensão precisa de uma chave?",
          answer:
            "A chave conecta as solicitações à sua conta, créditos e histórico. Ela pode ser revogada a qualquer momento.",
        },
        {
          question: "Qual texto fica armazenado?",
          answer:
            "O trecho enviado e o resultado ficam no histórico do Jiddu. Títulos e URLs permanecem somente na sessão do Chrome.",
        },
        {
          question: "Posso escolher separadamente os dois idiomas?",
          answer:
            "Sim. Inglês é o padrão, e inglês, português e espanhol estão disponíveis independentemente para interface e explicações.",
        },
        {
          question: "O Jiddu pode errar?",
          answer:
            "Sim. As análises são auxílios automatizados, não julgamentos finais. Revise a linguagem e abra as fontes citadas.",
        },
      ],
      closingTitle: "Mantenha uma segunda leitura ao lado da primeira.",
      closingDescription:
        "Instale a beta, conecte sua chave e questione um trecho por vez.",
    },
    privacy: {
      eyebrow: "EXTENSÃO JIDDU PARA CHROME",
      title: "Política de privacidade",
      subtitle:
        "Como a extensão trata conteúdo selecionado, credenciais de API, configurações e resultados.",
      updated: "Última atualização: 2 de agosto de 2026",
      limitedUseTitle: "Declaração de Uso Limitado da Chrome Web Store",
      limitedUse:
        "O uso e a transferência pelo Jiddu das informações recebidas das APIs do Chrome obedecem à Política de Dados do Usuário da Chrome Web Store, inclusive aos requisitos de Uso Limitado. Os dados são usados somente para oferecer ou melhorar os recursos de leitura crítica e nunca para publicidade personalizada.",
      sections: [
        {
          title: "1. Escopo e finalidade única",
          paragraphs: [
            "A finalidade única da extensão é permitir que o usuário selecione deliberadamente um trecho e solicite uma análise de falácias, fatos ou parcialidade. Ela não monitora a navegação em segundo plano, não altera buscas, não injeta anúncios e não coleta automaticamente o conteúdo das páginas.",
          ],
        },
        {
          title: "2. Informações tratadas no Chrome",
          paragraphs: [
            "A extensão trata a chave pessoal de API, os idiomas, o trecho selecionado, o título e a URL usados para identificar o relatório local e a análise gerada.",
            "A chave e as preferências ficam no chrome.storage.local. O relatório, o título e a URL ficam no chrome.storage.session e são apagados quando a aba é fechada ou navega para outra página.",
          ],
        },
        {
          title: "3. Quando as informações saem do Chrome",
          paragraphs: [
            "Nada é transmitido quando o usuário apenas abre o Jiddu, passa o cursor ou seleciona um elemento. Depois que escolhe Falácias, Fatos ou Parcialidade, o trecho e o idioma são enviados por HTTPS para https://jiddu.app. A chave segue em um cabeçalho de autenticação.",
            "O título e a URL da página não fazem parte da solicitação enviada à API.",
          ],
        },
        {
          title: "4. Processamento e provedores",
          paragraphs: [
            "O Jiddu usa o trecho apenas para autenticar, produzir a análise, prevenir abuso, contabilizar uso e manter o histórico.",
            "O trecho passa pelo OpenRouter ao provedor upstream escolhido. Checagens de fatos também podem usar modelos com busca na web. Essas transferências são necessárias para a função declarada.",
          ],
        },
        {
          title: "5. Armazenamento e retenção",
          paragraphs: [
            "O trecho e o resultado ficam no histórico associado ao titular da chave. Segredos de API são armazenados no servidor somente como hashes; a chave bruta permanece no Chrome.",
            "O histórico é mantido enquanto a conta estiver ativa, salvo pedido de exclusão em https://jiddu.app/contact. Logs operacionais podem manter IP e metadados somente pelo tempo necessário para segurança, prevenção de abuso, confiabilidade e obrigações legais.",
          ],
        },
        {
          title: "6. Compartilhamento, publicidade e acesso humano",
          paragraphs: [
            "O Jiddu não vende dados da extensão e não os utiliza nem transfere para publicidade personalizada, retargeting ou anúncios baseados em interesses.",
            "Os dados só vão aos provedores necessários, para segurança, cumprimento legal ou uma operação societária protegida. Pessoas não leem os trechos, salvo consentimento para suporte, segurança, exigência legal ou após agregação e anonimização.",
          ],
        },
        {
          title: "7. Segurança, controle e alterações",
          paragraphs: [
            "A extensão de produção se comunica apenas com https://jiddu.app. O usuário pode revogar a chave, remover a extensão e pedir exclusão ou suporte em https://jiddu.app/contact.",
            "Não envie informações confidenciais, proprietárias, sob embargo ou pessoais sem autorização. Mudanças relevantes serão divulgadas antes de entrar em vigor.",
          ],
        },
      ],
      back: "Voltar ao Jiddu para Chrome",
    },
  },
  es: {
    landing: {
      eyebrow: "JIDDU PARA CHROME",
      title: "Lectura crítica, sin salir de la página.",
      description:
        "Selecciona un pasaje en cualquier sitio y examina su razonamiento, afirmaciones factuales o encuadre en un panel lateral enfocado.",
      addToChrome: "Añadir a Chrome",
      comingSoon: "Beta en Chrome Web Store próximamente",
      createKey: "Crear una clave de API",
      requirement: "Requiere una cuenta de Jiddu y una clave de API personal.",
      demoEyebrow: "UN PASAJE · TRES LENTES",
      demoTitle: "Elige exactamente lo que quieres cuestionar.",
      demoPassage:
        "Todo el mundo sabe que esta política fracasó, así que solo una persona irresponsable podría seguir defendiéndola.",
      selectedPassage: "Pasaje seleccionado",
      lenses: [
        { name: "Falacias", description: "Examina el razonamiento" },
        { name: "Hechos", description: "Verifica afirmaciones con fuentes" },
        { name: "Sesgo", description: "Revela encuadres y omisiones" },
      ],
      resultEyebrow: "FALACIA ENCONTRADA",
      resultTitle: "Apelación a la popularidad",
      resultBody:
        "“Todo el mundo sabe” sustituye las pruebas por un consenso supuesto, mientras la segunda parte descarta el desacuerdo antes de examinarlo.",
      resultTag: "Razonamiento",
      features: [
        {
          title: "Intencional por diseño",
          description:
            "Jiddu no lee nada hasta que pulsas el icono, seleccionas un pasaje y eliges un análisis.",
        },
        {
          title: "Vinculado a la pestaña original",
          description:
            "El panel permanece con la página analizada en lugar de seguirte por el navegador.",
        },
        {
          title: "Informes que puedes conservar",
          description:
            "Imprime un informe limpio desde una pestaña temporal y continúa donde lo dejaste.",
        },
      ],
      stepsEyebrow: "CONFIGURACIÓN",
      stepsTitle: "De la instalación al primer análisis en tres pasos.",
      steps: [
        {
          title: "Instala la extensión",
          description:
            "Añade Jiddu desde Chrome Web Store y fíjalo en la barra de herramientas.",
        },
        {
          title: "Crea tu clave de API",
          description:
            "Inicia sesión en Jiddu y genera una clave personal en tu cuenta.",
        },
        {
          title: "Selecciona un pasaje",
          description:
            "Pulsa el icono, elige texto y selecciona Falacias, Hechos o Sesgo.",
        },
      ],
      privacyEyebrow: "PRIVACIDAD",
      privacyTitle: "La selección es local. El análisis es deliberado.",
      privacyDescription:
        "Pasar el cursor y seleccionar ocurren dentro de Chrome. El pasaje solo se envía después de elegir un análisis.",
      privacyPoints: [
        "Tu clave de API se guarda únicamente en esta instalación de Chrome.",
        "El pasaje se transmite por HTTPS y se guarda en el historial de tu cuenta.",
        "El título y la URL permanecen en la sesión de Chrome y no se envían a Jiddu.",
        "Jiddu no vende datos de la extensión ni los usa para publicidad.",
      ],
      privacyLink: "Leer la política de privacidad de la extensión",
      faqEyebrow: "PREGUNTAS FRECUENTES",
      faqTitle: "Antes de instalar.",
      faq: [
        {
          question: "¿Jiddu lee todas las páginas que visito?",
          answer:
            "No. Solo se activa tras pulsar el icono o usar el atajo. Nada se envía hasta que eliges un pasaje y un análisis.",
        },
        {
          question: "¿Por qué necesita una clave?",
          answer:
            "La clave conecta las solicitudes con tu cuenta, créditos e historial. Puedes revocarla en cualquier momento.",
        },
        {
          question: "¿Qué texto se guarda?",
          answer:
            "El pasaje enviado y el resultado se guardan en Jiddu. Los títulos y las URL permanecen solo en la sesión de Chrome.",
        },
        {
          question: "¿Puedo elegir los dos idiomas por separado?",
          answer:
            "Sí. Inglés es el predeterminado; inglés, portugués y español están disponibles independientemente.",
        },
        {
          question: "¿Jiddu puede equivocarse?",
          answer:
            "Sí. Los análisis son ayudas automatizadas, no juicios finales. Revisa el lenguaje y abre las fuentes citadas.",
        },
      ],
      closingTitle: "Mantén una segunda lectura junto a la primera.",
      closingDescription:
        "Instala la beta, conecta tu clave y cuestiona un pasaje cada vez.",
    },
    privacy: {
      eyebrow: "EXTENSIÓN JIDDU PARA CHROME",
      title: "Política de privacidad",
      subtitle:
        "Cómo la extensión trata contenido seleccionado, credenciales de API, configuración y resultados.",
      updated: "Última actualización: 2 de agosto de 2026",
      limitedUseTitle: "Declaración de Uso Limitado de Chrome Web Store",
      limitedUse:
        "El uso y la transferencia por Jiddu de la información recibida de las APIs de Chrome cumplen la Política de Datos del Usuario de Chrome Web Store, incluidos los requisitos de Uso Limitado. Los datos se usan solo para ofrecer o mejorar las funciones de lectura crítica y nunca para publicidad personalizada.",
      sections: [
        {
          title: "1. Alcance y propósito único",
          paragraphs: [
            "El único propósito es permitir que el usuario seleccione deliberadamente un pasaje y solicite un análisis de falacias, hechos o sesgo. No vigila la navegación en segundo plano, no modifica búsquedas, no inyecta anuncios ni recopila contenido automáticamente.",
          ],
        },
        {
          title: "2. Información tratada en Chrome",
          paragraphs: [
            "La extensión trata la clave personal, los idiomas, el pasaje seleccionado, el título y la URL usados para identificar el informe local y el análisis generado.",
            "La clave y las preferencias se guardan en chrome.storage.local. El informe, título y URL se guardan en chrome.storage.session y se eliminan al cerrar la pestaña o navegar a otra página.",
          ],
        },
        {
          title: "3. Cuándo la información sale de Chrome",
          paragraphs: [
            "Nada se transmite cuando el usuario solo abre Jiddu, pasa el cursor o selecciona un elemento. Tras elegir Falacias, Hechos o Sesgo, el pasaje y el idioma se envían por HTTPS a https://jiddu.app. La clave se envía en un encabezado de autenticación.",
            "El título y la URL no forman parte de la solicitud enviada a la API.",
          ],
        },
        {
          title: "4. Procesamiento y proveedores",
          paragraphs: [
            "Jiddu usa el pasaje solo para autenticar, producir el análisis, prevenir abusos, contabilizar el uso y mantener el historial.",
            "El pasaje se envía mediante OpenRouter al proveedor upstream elegido. Las verificaciones también pueden usar modelos con búsqueda web. Estas transferencias son necesarias para la función declarada.",
          ],
        },
        {
          title: "5. Almacenamiento y retención",
          paragraphs: [
            "El pasaje y el resultado se guardan en el historial asociado al titular de la clave. Los secretos se almacenan en el servidor solo como hashes; la clave sin transformar permanece en Chrome.",
            "El historial se conserva mientras la cuenta esté activa, salvo solicitud de eliminación en https://jiddu.app/contact. Los registros pueden conservar IP y metadatos solo durante el tiempo necesario para seguridad, prevención de abusos, fiabilidad y obligaciones legales.",
          ],
        },
        {
          title: "6. Transferencia, publicidad y acceso humano",
          paragraphs: [
            "Jiddu no vende datos de la extensión ni los usa o transfiere para publicidad personalizada, retargeting o anuncios basados en intereses.",
            "Los datos solo se transfieren a proveedores necesarios, por seguridad, cumplimiento legal o una operación societaria protegida. Las personas no leen los pasajes salvo consentimiento para soporte, seguridad, exigencia legal o tras agregarlos y anonimizarlos.",
          ],
        },
        {
          title: "7. Seguridad, control y cambios",
          paragraphs: [
            "La extensión de producción se comunica únicamente con https://jiddu.app. El usuario puede revocar la clave, eliminar la extensión y pedir eliminación o soporte en https://jiddu.app/contact.",
            "No envíes información confidencial, propietaria, bajo embargo o personal sin autorización. Los cambios relevantes se divulgarán antes de entrar en vigor.",
          ],
        },
      ],
      back: "Volver a Jiddu para Chrome",
    },
  },
};
