import assert from "node:assert/strict";
import test from "node:test";
import { calculateLiveDiarizationSettlement } from "./live-diarization-billing";

test("settles diarization from the actual audio duration", () => {
  const settlement = calculateLiveDiarizationSettlement(10 * 60, {
    marginMultiplier: 1.5,
    usdPerCredit: 0.01,
    usdPerMinute: 0.006,
  });

  assert.equal(settlement.provider, "openai");
  assert.equal(settlement.durationSeconds, 600);
  assert.equal(settlement.providerCostMicros, 60_000);
  assert.equal(settlement.billedCostMicros, 90_000);
  assert.equal(settlement.credits, 9);
});

test("does not charge for zero duration and rounds positive use to one credit", () => {
  assert.equal(
    calculateLiveDiarizationSettlement(0, {
      marginMultiplier: 1.5,
      usdPerCredit: 0.01,
    }).credits,
    0,
  );
  assert.equal(
    calculateLiveDiarizationSettlement(1, {
      marginMultiplier: 1.5,
      usdPerCredit: 0.01,
    }).credits,
    1,
  );
});

test("matches the credit examples shown in the confirmation prompt", () => {
  const config = {
    marginMultiplier: 1.5,
    usdPerCredit: 0.01,
    usdPerMinute: 0.006,
  };
  assert.deepEqual(
    [1, 5, 10, 30, 60].map((minutes) =>
      calculateLiveDiarizationSettlement(minutes * 60, config).credits,
    ),
    [1, 5, 9, 27, 54],
  );
});
