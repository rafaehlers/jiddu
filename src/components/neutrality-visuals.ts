import {
  AlertTriangle,
  ArrowRightLeft,
  CheckCircle,
  Compass,
  EyeOff,
  Fingerprint,
  GitBranch,
  Megaphone,
  Quote,
  Scale,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import type { Messages } from "@/lib/i18n/messages";
import type {
  NeutralityIssue,
  NeutralityVerdictValue,
} from "@/lib/neutrality-schema";

type NeutralityVisualMeta = {
  icon: LucideIcon;
  labelKey: keyof Messages;
  cls: string;
};

export const NEUTRALITY_ISSUE_META: Record<
  NeutralityIssue,
  NeutralityVisualMeta
> = {
  loaded_language: {
    icon: Megaphone,
    labelKey: "ni_loaded_language",
    cls: "border-red-500/40 text-red-500",
  },
  asymmetric_attribution: {
    icon: ArrowRightLeft,
    labelKey: "ni_asymmetric_attribution",
    cls: "border-amber-500/40 text-amber-500",
  },
  false_equivalence: {
    icon: Scale,
    labelKey: "ni_false_equivalence",
    cls: "border-purple-500/40 text-purple-500",
  },
  selective_omission: {
    icon: EyeOff,
    labelKey: "ni_selective_omission",
    cls: "border-blue-500/40 text-blue-500",
  },
  source_asymmetry: {
    icon: Quote,
    labelKey: "ni_source_asymmetry",
    cls: "border-pink-500/40 text-pink-500",
  },
  both_sidesing: {
    icon: GitBranch,
    labelKey: "ni_both_sidesing",
    cls: "border-emerald-500/40 text-emerald-500",
  },
  steering: {
    icon: Compass,
    labelKey: "ni_steering",
    cls: "border-cyan-500/40 text-cyan-500",
  },
  genetic_framing: {
    icon: Fingerprint,
    labelKey: "ni_genetic_framing",
    cls: "border-orange-500/40 text-orange-500",
  },
};

export const NEUTRALITY_ISSUE_COLOR: Record<NeutralityIssue, string> = {
  loaded_language: "rgb(239, 68, 68)",
  asymmetric_attribution: "rgb(245, 158, 11)",
  false_equivalence: "rgb(168, 85, 247)",
  selective_omission: "rgb(59, 130, 246)",
  source_asymmetry: "rgb(236, 72, 153)",
  both_sidesing: "rgb(16, 185, 129)",
  steering: "rgb(6, 182, 212)",
  genetic_framing: "rgb(249, 115, 22)",
};

export const NEUTRALITY_VERDICT_META: Record<
  NeutralityVerdictValue,
  NeutralityVisualMeta
> = {
  neutral: {
    icon: CheckCircle,
    labelKey: "nv_neutral",
    cls: "border-emerald-500/50 text-emerald-500 bg-emerald-500/5",
  },
  partisan_lean: {
    icon: AlertTriangle,
    labelKey: "nv_partisan_lean",
    cls: "border-amber-500/50 text-amber-500 bg-amber-500/5",
  },
  explicitly_partisan: {
    icon: AlertTriangle,
    labelKey: "nv_explicitly_partisan",
    cls: "border-orange-500/50 text-orange-500 bg-orange-500/5",
  },
  manipulation: {
    icon: XCircle,
    labelKey: "nv_manipulation",
    cls: "border-red-500/50 text-red-500 bg-red-500/5",
  },
};
