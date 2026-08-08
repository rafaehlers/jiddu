import assert from "node:assert/strict";
import test from "node:test";
import { extractReadableHtml } from "./url";

const BRAZIL_JOURNAL_FIXTURE = `<!doctype html>
<html lang="pt-BR">
  <head>
    <title>Lula vs. Milei: Quando a política toma o lugar da diplomacia</title>
    <meta property="og:title" content="Lula vs. Milei: Quando a política toma o lugar da diplomacia">
    <meta property="og:site_name" content="Brazil Journal">
    <meta property="article:published_time" content="2026-08-05T17:46:23-03:00">
    <script type="application/ld+json">{"@context":"https://schema.org","@type":"NewsArticle","author":{"@type":"Person","name":"Giuliano Guandalini"},"articleSection":"Economia"}</script>
  </head>
  <body>
    <nav>Últimas notícias Mercado Política</nav>
    <main>
      <div class="post-content-text">
        <p>Embaralhando assuntos de Estado com questões pessoais e partidárias, o Governo Lula decidiu rebaixar unilateralmente as relações diplomáticas com a Argentina para a categoria de encarregado de negócios.</p>
        <p>O Itamaraty deu a notícia ao embaixador argentino em Brasília, Guillermo Daniel Raimondi, na terça-feira, pedindo que ele se retirasse do País.</p>
        <p>Em uma entrevista ao <i>La Nación,</i> no domingo, Milei repetiu comentários que havia feito anteriormente, chamando Lula de “ladrão” e “corrupto”.</p>
        <article class="post-wrapmkt-adds no-print"><div id="ad-article-inside-1">Compre agora</div></article>
        <p>A “visita solidária” precisou de autorização judicial – algo que Milei lembrou quando o Alexandre de Moraes&nbsp; negou seu pedido para visitar Bolsonaro, também em prisão domiciliar.</p>
        <p>“Podemos imaginar o que irá acontecer nos próximos 8 ou 10 anos, caso Lula seja reeleito e um republicano, seja Marco Rubio ou JD Vance, seja o novo presidente dos EUA,” disse um diplomata. “E o Brasil está se isolando também de diversos outros países da região que elegeram governos de direita, como Chile, Colômbia e Bolívia.”</p>
        <span class="pp-multiple-authors-boxes-wrapper multiple-authors-target-the-content">
          <a href="/author/giuliano-guandalini/" rel="author">Giuliano Guandalini</a>
        </span>
      </div>
    </main>
    <aside>Leia também: uma matéria sem relação com o artigo</aside>
  </body>
</html>`;

test("extracts the Brazil Journal article without embedded page furniture", () => {
  const result = extractReadableHtml(
    BRAZIL_JOURNAL_FIXTURE,
    "https://braziljournal.com/lula-vs-milei-quando-a-politica-toma-o-lugar-da-diplomacia/",
  );

  assert.equal(
    result.title,
    "Lula vs. Milei: Quando a política toma o lugar da diplomacia",
  );
  assert.match(result.text, /^Embaralhando assuntos de Estado/);
  assert.match(result.text, /Em uma entrevista ao La Nación, no domingo/);
  assert.match(result.text, /Alexandre de Moraes negou seu pedido/);
  assert.match(result.text, /como Chile, Colômbia e Bolívia.”$/);
  assert.equal(result.text.split("\n\n").length, 5);
  assert.doesNotMatch(result.text, /Compre agora|Giuliano Guandalini|Leia também/);
  assert.equal(result.editorial.metadata.siteName, "Brazil Journal");
  assert.equal(result.editorial.metadata.author, "Giuliano Guandalini");
  assert.equal(result.editorial.metadata.articleSection, "Economia");
  assert.equal(
    result.editorial.metadata.publishedAt,
    "2026-08-05T17:46:23-03:00",
  );
  assert.deepEqual(
    result.editorial.blocks.map((block) => block.kind),
    ["paragraph", "paragraph", "paragraph", "paragraph", "paragraph"],
  );
});

test("uses a semantic article body when Readability returns truncated prose", () => {
  const longParagraph = `${"Uma frase editorial completa e verificável. ".repeat(18)}`;
  const html = `<html><head><meta property="og:title" content="  Título editorial  "></head><body>
    <div class="article-body"><p>${longParagraph}</p><p>Segundo parágrafo final.</p></div>
    <footer>Rodapé institucional</footer>
  </body></html>`;

  const result = extractReadableHtml(html, "https://example.com/reportagem");

  assert.equal(result.title, "Título editorial");
  assert.match(result.text, /Segundo parágrafo final\.$/);
  assert.doesNotMatch(result.text, /Rodapé institucional/);
});

test("preserves headings, quotations, attribution and lists as editorial structure", () => {
  const html = `<html><head><title>Structured report</title></head><body>
    <main><article class="article-body">
      <h2>Diplomacy</h2>
      <p>The reporter introduces the exchange.</p>
      <blockquote cite="https://example.com/speech"><p>A quoted statement with enough substance to analyze.</p><cite>Foreign minister</cite></blockquote>
      <ul><li>First documented event in the timeline.</li><li>Second documented event in the timeline.</li></ul>
    </article></main>
  </body></html>`;

  const result = extractReadableHtml(html, "https://example.com/report");

  assert.deepEqual(
    result.editorial.blocks.map((block) => block.kind),
    ["heading", "paragraph", "quote", "list_item", "list_item"],
  );
  assert.equal(result.editorial.blocks[2].section, "Diplomacy");
  assert.equal(result.editorial.blocks[2].quoteAttribution, "Foreign minister");
  assert.doesNotMatch(result.text, /Foreign minister/);
});
