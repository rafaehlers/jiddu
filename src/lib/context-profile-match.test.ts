import assert from "node:assert/strict";
import test from "node:test";
import {
  buildContextualWikipediaQuery,
  isPublicProfileCompatible,
  scorePublicProfileMatch,
} from "./context-profile-match";

const lula = {
  name: "Lula",
  aliases: [],
  description: "Presidente do Brasil e integrante do PT.",
  kind: "person" as const,
};

test("rejects a Wikipedia redirect whose identity conflicts with the conversation", () => {
  assert.equal(
    isPublicProfileCompatible(lula, {
      canonicalName: "Teuthida",
      description:
        "Teuthida é uma ordem zoológica da classe dos cefalópodes.",
    }),
    false,
  );
});

test("accepts the canonical profile when it contains the live identity", () => {
  assert.equal(
    isPublicProfileCompatible(lula, {
      canonicalName: "Luiz Inácio Lula da Silva",
      description:
        "Luiz Inácio Lula da Silva, mais conhecido como Lula, é um político brasileiro.",
    }),
    true,
  );
});

test("uses entity type and conversation details in the Wikipedia search", () => {
  const query = buildContextualWikipediaQuery(lula, "pt");

  assert.match(query, /^Lula /);
  assert.match(query, /presidente/);
  assert.match(query, /brasil/);
  assert.match(query, /pt/);
});

test("ranks the person known as Lula above another person with Lula in the name", () => {
  const presidentScore = scorePublicProfileMatch(lula, {
    canonicalName: "Luiz Inácio Lula da Silva",
    description:
      "Conhecido mononimamente como Lula, é filiado ao PT e presidente do Brasil.",
  });
  const relativeScore = scorePublicProfileMatch(lula, {
    canonicalName: "Marcos Lula",
    description:
      "Marcos Lula é filiado ao PT e filho do presidente do Brasil, Luiz Inácio Lula da Silva.",
  });

  assert.ok(presidentScore > relativeScore);
});
