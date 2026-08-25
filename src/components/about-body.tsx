"use client";

import Link from "next/link";
import { PageTitle } from "@/components/page-title";
import type { Lang } from "@/lib/fallacies";
import { useI18n } from "@/lib/i18n/provider";

type AboutCopy = {
  title: string;
  intro: string;
  sections: Array<{ title: string; paragraphs: string[] }>;
  linksTitle: string;
  links: { developers: string; methodology: string; privacy: string; contact: string };
};

const COPY: Record<Lang, AboutCopy> = {
  en: {
    title: "About Jiddu",
    intro:
      "Jiddu is an independent critical-reading product built and operated by Rafael de Menezes Ehlers in Brazil. It helps readers slow down before trusting, quoting, citing, or publishing a text.",
    sections: [
      {
        title: "What Jiddu does",
        paragraphs: [
          "Jiddu examines reasoning, factual claims, framing, clarity, and writing patterns. Its six core workflows detect logical fallacies, verify claims with current web sources, assess neutrality without assigning a left/right label, explain dense papers, identify templated prose, and run a venue-calibrated adversarial review of a complete academic PDF.",
          "People can use those workflows in the web product. Developers and AI agents can call the same analysis capabilities through the versioned REST API or the hosted Streamable HTTP MCP server. Public documentation, OpenAPI schemas, authentication discovery, methodology, limits, and pricing are available without signing in.",
        ],
      },
      {
        title: "How it is built",
        paragraphs: [
          "Jiddu combines structured prompts, typed response schemas, document segmentation, source validation, model fallback, deterministic checks, and persisted reports. Fact-checking searches current sources for each extracted claim. Adversarial review uses independent specialist passes, literature research, arithmetic checks, a separate critic, and a retention gate before synthesis.",
          "The product publishes benchmark summaries and a detailed technical walkthrough so readers can inspect the method rather than rely on a marketing claim. Jiddu is not affiliated with the publications, venues, model providers, or public datasets referenced in that documentation.",
        ],
      },
      {
        title: "Limits and accountability",
        paragraphs: [
          "Every analysis is automated and can be incomplete or wrong. Jiddu has no human editorial desk, does not determine whether an author is lying, and does not replace professional, academic, medical, legal, or financial judgment. A useful result points the reader back to exact passages, cited evidence, and an explanation that can be challenged.",
          "Questions, corrections, privacy requests, API or MCP integration problems, and billing concerns can be sent through the public contact page or to support@emails.jiddu.app. The privacy policy identifies the operator, providers, data flows, retention, and the rights available to users.",
        ],
      },
    ],
    linksTitle: "Inspect Jiddu",
    links: {
      developers: "Developer docs",
      methodology: "How it works",
      privacy: "Privacy policy",
      contact: "Contact",
    },
  },
  pt: {
    title: "Sobre o Jiddu",
    intro:
      "O Jiddu é um produto independente de leitura crítica, criado e operado por Rafael de Menezes Ehlers no Brasil. Ele ajuda leitores a desacelerar antes de confiar, citar, reproduzir ou publicar um texto.",
    sections: [
      {
        title: "O que o Jiddu faz",
        paragraphs: [
          "O Jiddu examina raciocínio, afirmações factuais, enquadramento, clareza e padrões de escrita. Seus seis fluxos principais detectam falácias lógicas, verificam afirmações em fontes atuais da web, avaliam imparcialidade sem atribuir rótulo de esquerda/direita, explicam papers densos, identificam prosa formulaica e executam uma revisão adversarial calibrada para o venue de um PDF acadêmico completo.",
          "Pessoas usam esses fluxos no produto web. Desenvolvedores e agentes de IA podem chamar as mesmas capacidades pela REST API versionada ou pelo servidor MCP hospedado com Streamable HTTP. Documentação pública, schemas OpenAPI, descoberta de autenticação, metodologia, limites e preços ficam disponíveis sem login.",
        ],
      },
      {
        title: "Como ele é construído",
        paragraphs: [
          "O Jiddu combina prompts estruturados, schemas tipados de resposta, segmentação de documentos, validação de fontes, fallback de modelos, verificações determinísticas e relatórios persistidos. A checagem pesquisa fontes atuais para cada afirmação extraída. A revisão adversarial usa especialistas independentes, pesquisa da literatura, checagens aritméticas, um crítico separado e um gate de retenção antes da síntese.",
          "O produto publica resumos de benchmark e um guia técnico detalhado para que leitores inspecionem o método em vez de depender de uma promessa de marketing. O Jiddu não é afiliado às publicações, venues, provedores de modelos ou conjuntos públicos de dados citados na documentação.",
        ],
      },
      {
        title: "Limites e responsabilidade",
        paragraphs: [
          "Toda análise é automatizada e pode estar incompleta ou errada. O Jiddu não possui redação humana, não determina se um autor está mentindo e não substitui julgamento profissional, acadêmico, médico, jurídico ou financeiro. Um resultado útil leva o leitor de volta aos trechos exatos, às evidências citadas e a uma explicação que pode ser contestada.",
          "Dúvidas, correções, solicitações de privacidade, problemas de integração com API ou MCP e questões de cobrança podem ser enviados pela página pública de contato ou para support@emails.jiddu.app. A política de privacidade identifica o operador, provedores, fluxos de dados, retenção e direitos dos usuários.",
        ],
      },
    ],
    linksTitle: "Inspecione o Jiddu",
    links: {
      developers: "Documentação para desenvolvedores",
      methodology: "Como funciona",
      privacy: "Política de privacidade",
      contact: "Contato",
    },
  },
  es: {
    title: "Acerca de Jiddu",
    intro:
      "Jiddu es un producto independiente de lectura crítica, creado y operado por Rafael de Menezes Ehlers en Brasil. Ayuda a los lectores a detenerse antes de confiar, citar, repetir o publicar un texto.",
    sections: [
      {
        title: "Qué hace Jiddu",
        paragraphs: [
          "Jiddu examina razonamiento, afirmaciones fácticas, encuadre, claridad y patrones de escritura. Sus seis flujos principales detectan falacias lógicas, verifican afirmaciones con fuentes web actuales, evalúan la neutralidad sin asignar una etiqueta izquierda/derecha, explican papers densos, identifican prosa formularia y ejecutan una revisión adversarial calibrada para el venue de un PDF académico completo.",
          "Las personas usan esos flujos en el producto web. Desarrolladores y agentes de IA pueden llamar las mismas capacidades mediante la API REST versionada o el servidor MCP alojado con Streamable HTTP. La documentación pública, los schemas OpenAPI, el descubrimiento de autenticación, la metodología, los límites y los precios están disponibles sin iniciar sesión.",
        ],
      },
      {
        title: "Cómo está construido",
        paragraphs: [
          "Jiddu combina prompts estructurados, schemas de respuesta tipados, segmentación de documentos, validación de fuentes, fallback de modelos, verificaciones deterministas e informes persistidos. La comprobación investiga fuentes actuales para cada afirmación extraída. La revisión adversarial usa especialistas independientes, investigación bibliográfica, comprobaciones aritméticas, un crítico separado y un filtro de retención antes de la síntesis.",
          "El producto publica resúmenes de benchmarks y una guía técnica detallada para que los lectores inspeccionen el método en vez de depender de una promesa comercial. Jiddu no está afiliado con las publicaciones, venues, proveedores de modelos o conjuntos públicos de datos citados en esa documentación.",
        ],
      },
      {
        title: "Límites y responsabilidad",
        paragraphs: [
          "Todo análisis es automatizado y puede estar incompleto o equivocado. Jiddu no tiene una redacción humana, no determina si un autor miente y no sustituye el juicio profesional, académico, médico, jurídico o financiero. Un resultado útil devuelve al lector a los pasajes exactos, la evidencia citada y una explicación que puede cuestionarse.",
          "Las preguntas, correcciones, solicitudes de privacidad, problemas de integración con API o MCP y dudas de facturación pueden enviarse mediante la página pública de contacto o a support@emails.jiddu.app. La política de privacidad identifica al operador, los proveedores, los flujos de datos, la retención y los derechos de los usuarios.",
        ],
      },
    ],
    linksTitle: "Inspecciona Jiddu",
    links: {
      developers: "Documentación para desarrolladores",
      methodology: "Cómo funciona",
      privacy: "Política de privacidad",
      contact: "Contacto",
    },
  },
};

export function AboutBody() {
  const { lang } = useI18n();
  const copy = COPY[lang];
  return (
    <article className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-16">
      <header className="flex max-w-3xl flex-col gap-3">
        <PageTitle>{copy.title}</PageTitle>
        <p className="text-base leading-relaxed text-muted sm:text-lg">
          {copy.intro}
        </p>
      </header>

      {copy.sections.map((section) => (
        <section key={section.title} className="flex max-w-3xl flex-col gap-3">
          <h2 className="font-serif text-2xl">{section.title}</h2>
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph} className="text-base leading-relaxed text-foreground/85">
              {paragraph}
            </p>
          ))}
        </section>
      ))}

      <nav aria-label={copy.linksTitle} className="flex flex-wrap gap-3 border-t border-rule pt-6 text-sm">
        <Link className="underline decoration-rule hover:decoration-foreground" href="/developers">
          {copy.links.developers}
        </Link>
        <Link className="underline decoration-rule hover:decoration-foreground" href="/how-it-works">
          {copy.links.methodology}
        </Link>
        <Link className="underline decoration-rule hover:decoration-foreground" href="/privacy">
          {copy.links.privacy}
        </Link>
        <Link className="underline decoration-rule hover:decoration-foreground" href="/contact">
          {copy.links.contact}
        </Link>
      </nav>
    </article>
  );
}
