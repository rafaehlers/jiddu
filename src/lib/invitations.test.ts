import assert from "node:assert/strict";
import test from "node:test";
import {
  hashInvitationToken,
  invitationAvailability,
  invitationTokenIsValid,
  maskInvitationEmail,
  normalizeInvitationEmail,
} from "./invitation-policy";

test("normalizes and masks invited email addresses", () => {
  assert.equal(
    normalizeInvitationEmail("  Invited.Person@Example.COM "),
    "invited.person@example.com",
  );
  assert.equal(
    maskInvitationEmail("Invited.Person@Example.COM"),
    "in************@example.com",
  );
  assert.equal(maskInvitationEmail("a@example.com"), "a***@example.com");
});

test("validates opaque invitation tokens and hashes them deterministically", () => {
  const token = "a".repeat(43);
  assert.equal(invitationTokenIsValid(token), true);
  assert.equal(invitationTokenIsValid("too-short"), false);
  assert.equal(invitationTokenIsValid(`${"a".repeat(42)}!`), false);
  assert.equal(hashInvitationToken(token), hashInvitationToken(token));
  assert.notEqual(hashInvitationToken(token), hashInvitationToken("b".repeat(43)));
  assert.equal(hashInvitationToken(token).length, 64);
});

test("uses the tighter global or per-user invitation allowance", () => {
  assert.deepEqual(
    invitationAvailability({
      globalLimit: 100,
      globalUsed: 95,
      perUserLimit: 10,
      userUsed: 2,
      rewardCredits: 25,
    }),
    { enabled: true, globalRemaining: 5, remaining: 5 },
  );
  assert.deepEqual(
    invitationAvailability({
      globalLimit: 100,
      globalUsed: 20,
      perUserLimit: 4,
      userUsed: 3,
      rewardCredits: 25,
    }),
    { enabled: true, globalRemaining: 80, remaining: 1 },
  );
});

test("keeps the invitation program disabled until every setting is positive", () => {
  assert.deepEqual(
    invitationAvailability({
      globalLimit: 100,
      globalUsed: 0,
      perUserLimit: 5,
      userUsed: 0,
      rewardCredits: 0,
    }),
    { enabled: false, globalRemaining: 100, remaining: 0 },
  );
});
