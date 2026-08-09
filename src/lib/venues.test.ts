import assert from "node:assert/strict";
import test from "node:test";
import { parseDblpVenueResponse } from "@/app/api/review/venues/route";
import {
  CURATED_VENUE_PROFILES,
  curatedVenueSearch,
  resolveVenueProfile,
  venueProfileForPrompt,
} from "./venues";

test("resolves and verifies an exact curated venue profile", () => {
  const profile = resolveVenueProfile({
    profileId: "neurips-2026-main",
    year: "2026",
    track: "Main track",
    paperType: "research",
  });

  assert.equal(profile.profileVerified, true);
  assert.match(profile.targetLabel, /NeurIPS 2026/);
  assert.match(venueProfileForPrompt(profile), /Quality/);
  assert.match(venueProfileForPrompt(profile), /ReviewerGuidelines/);
});

test("marks a different edition as unverified", () => {
  const profile = resolveVenueProfile({
    profileId: "icml-2026-main",
    year: "2027",
    track: "Main track",
  });

  assert.equal(profile.profileVerified, false);
  assert.match(profile.verificationNote, /closest available official profile/);
});

test("parses DBLP venue results without treating catalog metadata as a verified rubric", () => {
  const venues = parseDblpVenueResponse({
    result: {
      hits: {
        hit: {
          info: {
            venue: "Conference on Neural Information Processing Systems",
            acronym: "NeurIPS",
            type: "Conference or Workshop",
            url: "https://dblp.org/db/conf/nips/",
          },
        },
      },
    },
  });

  assert.equal(venues.length, 1);
  assert.equal(venues[0]?.kind, "conference");
  assert.equal(venues[0]?.verifiedProfile, false);
});

test("includes verified profiles for the six medical journals", () => {
  const expectedProfiles = [
    "jama-2026-original-investigation",
    "nejm-2026-original-article",
    "lancet-2026-article",
    "bmj-2026-research",
    "nature-medicine-2026-primary-research",
    "jama-network-open-2026-original-investigation",
  ];

  for (const profileId of expectedProfiles) {
    const profile = CURATED_VENUE_PROFILES.find(({ id }) => id === profileId);
    assert.ok(profile, `missing ${profileId}`);
    assert.equal(profile.kind, "journal");
    assert.equal(profile.verified, true);
    assert.ok(profile.criteria.length >= 5);
    assert.ok(profile.officialSources.length >= 1);
    assert.ok(
      profile.officialSources.every(({ url }) => url.startsWith("https://")),
    );

    const resolved = resolveVenueProfile({
      profileId,
      year: "2026",
      track: profile.track,
      paperType: "research",
    });
    assert.equal(resolved.profileVerified, true);
    assert.match(resolved.verificationNote, /verified 2026-08-08/);
  }
});

test("finds medical journals by names, acronyms, and aliases", () => {
  assert.equal(
    curatedVenueSearch("New England")[0]?.profileId,
    "nejm-2026-original-article",
  );
  assert.equal(
    curatedVenueSearch("British Medical Journal")[0]?.profileId,
    "bmj-2026-research",
  );
  assert.equal(
    curatedVenueSearch("Nat Med")[0]?.profileId,
    "nature-medicine-2026-primary-research",
  );

  const jamaResults = curatedVenueSearch("JAMA");
  assert.ok(
    jamaResults.some(
      ({ profileId }) => profileId === "jama-2026-original-investigation",
    ),
  );
  assert.ok(
    jamaResults.some(
      ({ profileId }) =>
        profileId === "jama-network-open-2026-original-investigation",
    ),
  );
  assert.ok(
    jamaResults.every(({ name }) => !name.toLowerCase().includes("informatics")),
  );
});

test("marks a journal profile unverified when the article type changes", () => {
  const profile = resolveVenueProfile({
    profileId: "jama-2026-original-investigation",
    year: "2026",
    track: "Research Letter",
  });

  assert.equal(profile.profileVerified, false);
  assert.match(
    profile.verificationNote,
    /article type was not independently verified/,
  );
});

test("resolves Cochrane Library to a systematic-review profile", () => {
  const searchResult = curatedVenueSearch("Cochrane Library")[0];
  assert.equal(searchResult?.profileId, "cochrane-2026-review");
  assert.equal(searchResult?.kind, "journal");
  assert.equal(searchResult?.defaultPaperType, "systematic-review");

  const profile = resolveVenueProfile({
    profileId: "cochrane-2026-review",
    year: "2026",
    track: "Cochrane Review",
  });

  assert.equal(profile.profileVerified, true);
  assert.equal(profile.paperType, "systematic-review");
  assert.match(profile.targetLabel, /systematic review/);
  assert.match(venueProfileForPrompt(profile), /GRADE/);
  assert.match(venueProfileForPrompt(profile), /Do not require meta-analysis/);
});

test("supports meta-analysis as a distinct Cochrane manuscript type", () => {
  const profile = resolveVenueProfile({
    profileId: "cochrane-2026-review",
    year: "2026",
    track: "Cochrane Review",
    paperType: "meta-analysis",
  });

  assert.equal(profile.paperType, "meta-analysis");
  assert.match(profile.targetLabel, /meta-analysis/);
});
