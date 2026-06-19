/**
 * nsg-period-style — 句点はピリオド（．）でなく丸（。）に統一
 *
 * 日本語スタイルガイド 第3版 2.8.1「句読点を適切に使用する」は、句点には
 * 丸（。）とピリオド（．）があり、どちらを使うかを決めて統一すべきこと、実用文
 * では点（、）と丸（。）を使うと述べる。本ルールは、和文の文末に全角ピリオド
 * （．）が句点として使われている箇所を検出し、丸（。）への置換を提案する。
 *
 * 偽陽性回避:
 *   - 直前が日本語の文字（ひらがな・カタカナ・漢字・長音符号）のときに限定し、
 *     項番（2.3.7）や小数点など英数字に続くピリオドには反応しない。
 */
import type {
  LintIssue,
  LintRule,
  LintRuleConfig,
  RulesetContext,
  RulesetManifest,
} from "illusions-lint-sdk";

// 直前が日本語文字のときの全角ピリオド（．U+FF0E）。span は「．」1文字のみ。
const PATTERN = /([ぁ-んァ-ヶ一-龯ー])．/;

const REFERENCE = {
  standard: "日本語スタイルガイド 第3版（テクニカルコミュニケーター協会）",
  section: "第2章 2.8.1節",
} as const;

export function createNsgPeriodStyle(ctx: RulesetContext, manifest: RulesetManifest): LintRule {
  const meta = manifest.rules.find((r) => r.ruleId === "nsg-period-style");
  if (!meta) throw new Error("manifest is missing the nsg-period-style rule");

  const { AbstractL1Rule } = ctx.bases;
  const { toolkit } = ctx;

  class NsgPeriodStyle extends AbstractL1Rule {
    lint(text: string, config: LintRuleConfig): LintIssue[] {
      if (!config.enabled) return [];
      return toolkit.regexReplace({
        text,
        pattern: PATTERN,
        ruleId: this.id,
        severity: config.severity,
        message: "Use 。 instead of ． as a Japanese full stop",
        messageJa: "日本語スタイルガイド 第3版に基づき、実用文の句点は丸（。）に統一します。",
        // 直前の日本語文字（捕捉グループ1）は残し、「．」だけを「。」に置換する。
        span: (m) => ({
          from: m.index + m[1].length,
          to: m.index + m[0].length,
          original: "．",
        }),
        replacement: () => "。",
        reference: REFERENCE,
        fixLabelJa: "「。」に修正",
      });
    }
  }

  return new NsgPeriodStyle(toolkit.toJsonRuleMeta(meta, manifest), {
    id: meta.ruleId,
    name: meta.nameJa,
    nameJa: meta.nameJa,
    description: meta.descriptionJa,
    descriptionJa: meta.descriptionJa,
    defaultConfig: meta.defaultConfig,
  });
}
