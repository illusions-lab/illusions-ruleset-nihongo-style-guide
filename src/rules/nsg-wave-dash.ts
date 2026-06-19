/**
 * nsg-wave-dash — 範囲を示す記号は波記号（〜）に統一
 *
 * 日本語スタイルガイド 第3版 1.3.3「記述の記号・符号の表記」は、範囲を示す
 * 記号として波記号（〜）を挙げる。本ルールは、数値の範囲を半角チルダ（~）で
 * 表している箇所を検出し、波記号（〜）への置換を提案する。
 *
 * 偽陽性回避:
 *   - 「数字 ~ 数字」の形に限定し、URL やコマンド中の ~ には反応しない。
 */
import type {
  LintIssue,
  LintRule,
  LintRuleConfig,
  RulesetContext,
  RulesetManifest,
} from "illusions-lint-sdk";

// 半角数字に挟まれた半角チルダ（~ U+007E）。span はチルダ1文字のみ。
const PATTERN = /(\d)~(?=\d)/;

const REFERENCE = {
  standard: "日本語スタイルガイド 第3版（テクニカルコミュニケーター協会）",
  section: "第1章 1.3.3節",
} as const;

export function createNsgWaveDash(ctx: RulesetContext, manifest: RulesetManifest): LintRule {
  const meta = manifest.rules.find((r) => r.ruleId === "nsg-wave-dash");
  if (!meta) throw new Error("manifest is missing the nsg-wave-dash rule");

  const { AbstractL1Rule } = ctx.bases;
  const { toolkit } = ctx;

  class NsgWaveDash extends AbstractL1Rule {
    lint(text: string, config: LintRuleConfig): LintIssue[] {
      if (!config.enabled) return [];
      return toolkit.regexReplace({
        text,
        pattern: PATTERN,
        ruleId: this.id,
        severity: config.severity,
        message: "Use the wave dash 〜 to indicate a range",
        messageJa: "日本語スタイルガイド 第3版に基づき、範囲を示す記号は波記号（〜）に統一します。",
        span: (m) => ({
          from: m.index + m[1].length,
          to: m.index + m[1].length + 1,
          original: "~",
        }),
        replacement: () => "〜",
        reference: REFERENCE,
        fixLabelJa: "「〜」に修正",
      });
    }
  }

  return new NsgWaveDash(toolkit.toJsonRuleMeta(meta, manifest), {
    id: meta.ruleId,
    name: meta.nameJa,
    nameJa: meta.nameJa,
    description: meta.descriptionJa,
    descriptionJa: meta.descriptionJa,
    defaultConfig: meta.defaultConfig,
  });
}
