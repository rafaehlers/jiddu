import assert from "node:assert/strict";
import test from "node:test";
import { jidduFromEmail } from "./email-from";

test("uses the Jiddu name with the default sending address", () => {
  assert.equal(
    jidduFromEmail(),
    "Jiddu <notifications@emails.jiddu.app>",
  );
});

test("replaces a legacy display name while preserving its address", () => {
  assert.equal(
    jidduFromEmail("Jiddu Support <notifications@emails.jiddu.app>"),
    "Jiddu <notifications@emails.jiddu.app>",
  );
});

test("uses Jiddu for configured addresses with or without a display name", () => {
  assert.equal(
    jidduFromEmail("Transactional <mailer@emails.jiddu.app>"),
    "Jiddu <mailer@emails.jiddu.app>",
  );
  assert.equal(
    jidduFromEmail("mailer@emails.jiddu.app"),
    "Jiddu <mailer@emails.jiddu.app>",
  );
});
