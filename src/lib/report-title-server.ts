import "server-only";

import { prisma } from "@/lib/db";
import type { ReportTitleKind } from "@/lib/report-title";

export async function updateOwnedReportTitle(input: {
  id: string;
  kind: ReportTitleKind;
  ownerWorkosUserId: string;
  title: string;
}): Promise<boolean> {
  const where = {
    id: input.id,
    ownerWorkosUserId: input.ownerWorkosUserId,
  };
  const data = { title: input.title };

  switch (input.kind) {
    case "a":
      return (await prisma.analysis.updateMany({ where, data })).count > 0;
    case "f":
      return (await prisma.factCheck.updateMany({ where, data })).count > 0;
    case "n":
      return (await prisma.neutrality.updateMany({ where, data })).count > 0;
    case "e":
      return (await prisma.explanation.updateMany({ where, data })).count > 0;
    case "s":
      return (await prisma.slopCheck.updateMany({ where, data })).count > 0;
    case "r":
      return (await prisma.paperReview.updateMany({ where, data })).count > 0;
    case "live":
      return (
        await prisma.analysis.updateMany({
          where: { ...where, source: "live" },
          data,
        })
      ).count > 0;
  }
}
