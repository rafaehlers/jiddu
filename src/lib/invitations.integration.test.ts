import assert from "node:assert/strict";
import test from "node:test";

const runIntegration = process.env.RUN_INVITATION_INTEGRATION === "1";

test(
  "enforces invitation quotas and grants the acceptance bonus exactly once",
  { skip: !runIntegration },
  async () => {
    const { prisma } = await import("./db");
    const {
      acceptInvitation,
      InvitationError,
      markInvitationDelivered,
      prepareInvitation,
    } = await import("./invitations");
    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const inviterWorkosUserId = `inviter-${suffix}`;
    const invitedWorkosUserId = `invitee-${suffix}`;
    const inviteeEmail = `invitee-${suffix}@example.com`;

    try {
      const prepared = await prepareInvitation({
        globalLimit: 1,
        inviteeEmail,
        inviterEmail: `inviter-${suffix}@example.com`,
        inviterName: "Integration Inviter",
        inviterWorkosUserId,
        locale: "en",
        message: "Join me on Jiddu.",
        perUserLimit: 1,
        rewardCredits: 37,
      });
      await markInvitationDelivered(prepared.id, `resend-${suffix}`);

      await assert.rejects(
        prepareInvitation({
          globalLimit: 1,
          inviteeEmail: `other-${suffix}@example.com`,
          inviterEmail: `other-inviter-${suffix}@example.com`,
          inviterWorkosUserId: `other-inviter-${suffix}`,
          locale: "en",
          perUserLimit: 1,
          rewardCredits: 37,
        }),
        (error: unknown) =>
          error instanceof InvitationError && error.code === "global_limit",
      );

      await assert.rejects(
        acceptInvitation({
          email: `wrong-${suffix}@example.com`,
          emailVerified: true,
          rawToken: prepared.token,
          workosUserId: invitedWorkosUserId,
        }),
        (error: unknown) =>
          error instanceof InvitationError && error.code === "wrong_email",
      );

      const results = await Promise.all([
        acceptInvitation({
          email: inviteeEmail,
          emailVerified: true,
          rawToken: prepared.token,
          workosUserId: invitedWorkosUserId,
        }),
        acceptInvitation({
          email: inviteeEmail,
          emailVerified: true,
          rawToken: prepared.token,
          workosUserId: invitedWorkosUserId,
        }),
      ]);
      assert.deepEqual(
        results.map((result) => result.alreadyAccepted).sort(),
        [false, true],
      );

      const account = await prisma.jidduCreditAccount.findUniqueOrThrow({
        where: { workosUserId: invitedWorkosUserId },
      });
      assert.equal(account.balance, 37);
      assert.equal(
        await prisma.jidduCreditTransaction.count({
          where: { kind: "invite_bonus", resourceId: prepared.id },
        }),
        1,
      );
    } finally {
      await prisma.invitation.deleteMany({
        where: {
          OR: [
            { inviterWorkosUserId },
            { inviterWorkosUserId: `other-inviter-${suffix}` },
          ],
        },
      });
      await prisma.jidduCreditAccount.deleteMany({
        where: { workosUserId: invitedWorkosUserId },
      });
      await prisma.$disconnect();
    }
  },
);
