/**
 * nsg-fullwidth-alnum — 和文中の全角英数字を半角へ統一
 *
 * 日本語スタイルガイド 第3版 1.3.3 は、英字・数字の表記について大文字小文字
 * を含め正しい表記を確かめるよう促し、SI記号・項番・略語などを半角英数字で
 * 示している。本ルールは、和文中に現れる全角英字（Ａ-Ｚ, ａ-ｚ）・全角数字
 * （０-９）を検出し、対応する半角文字への置換を提案する。
 *
 * 偽陽性回避:
 *   - 連続する全角英数字を1つのスパンにまとめ、NFKC 正規化で半角へ変換する。
 *   - 全角記号（！？など）は対象外。英字・数字のみを対象にする。
 */
import type {
  LintIssue,
  LintRule,
  LintRuleConfig,
  RulesetContext,
  RulesetManifest,
} from "illusions-lint-sdk";

// 連続する全角英数字（U+FF10-FF19 数字 / U+FF21-FF3A 大文字 / U+FF41-FF5A 小文字）。
const PATTERN = /[０-９Ａ-Ｚａ-ｚ]+/;

const REFERENCE = {
  standard: "日本語スタイルガイド 第3版（テクニカルコミュニケーター協会）",
  section: "第1章 1.3.3節",
} as const;

export function createNsgFullwidthAlnum(ctx: RulesetContext, manifest: RulesetManifest): LintRule {
  const meta = manifest.rules.find((r) => r.ruleId === "nsg-fullwidth-alnum");
  if (!meta) throw new Error("manifest is missing the nsg-fullwidth-alnum rule");

  const { AbstractL1Rule } = ctx.bases;
  const { toolkit } = ctx;

  class NsgFullwidthAlnum extends AbstractL1Rule {
    lint(text: string, config: LintRuleConfig): LintIssue[] {
      if (!config.enabled) return [];
      return toolkit.regexReplace({
        text,
        pattern: PATTERN,
        ruleId: this.id,
        severity: config.severity,
        message: "Use half-width letters and digits",
        messageJa: "日本語スタイルガイド 第3版に基づき、和文中の英字・数字は半角に統一します。",
        replacement: (m) => toolkit.nfkc(m[0]),
        reference: REFERENCE,
        fixLabelJa: "半角に修正",
      });
    }
  }

  return new NsgFullwidthAlnum(toolkit.toJsonRuleMeta(meta, manifest), {
    id: meta.ruleId,
    name: meta.nameJa,
    nameJa: meta.nameJa,
    description: meta.descriptionJa,
    descriptionJa: meta.descriptionJa,
    defaultConfig: meta.defaultConfig,
  });
}
