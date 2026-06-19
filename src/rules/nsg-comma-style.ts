/**
 * nsg-comma-style — 読点はコンマ（，）でなく点（、）に統一
 *
 * 日本語スタイルガイド 第3版 2.8.1「句読点を適切に使用する」は、読点には
 * 点（、）とコンマ（，）があり、どちらを使うかを決めて統一すべきこと、実用文
 * では点（、）と丸（。）を使うと述べる。本ルールは、和文の途中に全角コンマ
 * （，）が読点として使われている箇所を検出し、点（、）への置換を提案する。
 *
 * 偽陽性回避:
 *   - 直前が日本語の文字（ひらがな・カタカナ・漢字・長音符号）のときに限定し、
 *     数字の位取り（1,000）など英数字に続くコンマには反応しない。
 */
import type {
  LintIssue,
  LintRule,
  LintRuleConfig,
  RulesetContext,
  RulesetManifest,
} from "illusions-lint-sdk";

// 直前が日本語文字のときの全角コンマ（，U+FF0C）。span は「，」1文字のみ。
const PATTERN = /([ぁ-んァ-ヶ一-龯ー])，/;

const REFERENCE = {
  standard: "日本語スタイルガイド 第3版（テクニカルコミュニケーター協会）",
  section: "第2章 2.8.1節",
} as const;

export function createNsgCommaStyle(ctx: RulesetContext, manifest: RulesetManifest): LintRule {
  const meta = manifest.rules.find((r) => r.ruleId === "nsg-comma-style");
  if (!meta) throw new Error("manifest is missing the nsg-comma-style rule");

  const { AbstractL1Rule } = ctx.bases;
  const { toolkit } = ctx;

  class NsgCommaStyle extends AbstractL1Rule {
    lint(text: string, config: LintRuleConfig): LintIssue[] {
      if (!config.enabled) return [];
      return toolkit.regexReplace({
        text,
        pattern: PATTERN,
        ruleId: this.id,
        severity: config.severity,
        message: "Use 、 instead of ， as a Japanese comma",
        messageJa: "日本語スタイルガイド 第3版に基づき、実用文の読点は点（、）に統一します。",
        span: (m) => ({
          from: m.index + m[1].length,
          to: m.index + m[0].length,
          original: "，",
        }),
        replacement: () => "、",
        reference: REFERENCE,
        fixLabelJa: "「、」に修正",
      });
    }
  }

  return new NsgCommaStyle(toolkit.toJsonRuleMeta(meta, manifest), {
    id: meta.ruleId,
    name: meta.nameJa,
    nameJa: meta.nameJa,
    description: meta.descriptionJa,
    descriptionJa: meta.descriptionJa,
    defaultConfig: meta.defaultConfig,
  });
}
