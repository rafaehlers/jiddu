import assert from "node:assert/strict";
import test from "node:test";
import { parseDblpVenueResponse } from "@/app/api/review/venues/route";
import {
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
