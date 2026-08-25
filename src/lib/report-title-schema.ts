import { z } from "zod";
import {
  REPORT_TITLE_KINDS,
  REPORT_TITLE_MAX_LENGTH,
} from "@/lib/report-title";

export const ReportTitleKindSchema = z.enum(REPORT_TITLE_KINDS);

export const ReportTitleRequestSchema = z.object({
  title: z.string().trim().min(1).max(REPORT_TITLE_MAX_LENGTH),
});
