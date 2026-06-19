/**
 * nsg-ellipsis-style — 省略を示すリーダーは三点リーダー（…）を用いる
 *
 * 日本語スタイルガイド 第3版 1.3.3「記述の記号・符号の表記」は、文の途中の
 * 省略を示す記号として点線（リーダー）を挙げる。和文では三点リーダー（…、
 * 通例は二倍にして「……」）を用いる。本ルールは、リーダーの代用として半角
 * ピリオドを連続させた箇所（...）を検出し、三点リーダー（…）への置換を提案する。
 *
 * 偽陽性回避:
 *   - 半角ピリオド2個以上の連続に限定。1つの小数点や項番（2.3.7）には反応しない。
 *   - パス表記の「../」を避けるため、直後がスラッシュの場合は対象外（lookahead）。
 */
import type {
  LintIssue,
  LintRule,
  LintRuleConfig,
  RulesetContext,
  RulesetManifest,
} from "illusions-lint-sdk";

// 連続2個以上の半角ピリオド。直後がスラッシュ（相対パス ../）の場合は除外。
const PATTERN = /\.{2,}(?!\/)/;

const REFERENCE = {
  standard: "日本語スタイルガイド 第3版（テクニカルコミュニケーター協会）",
  section: "第1章 1.3.3節",
} as const;

export function createNsgEllipsisStyle(ctx: RulesetContext, manifest: RulesetManifest): LintRule {
  const meta = manifest.rules.find((r) => r.ruleId === "nsg-ellipsis-style");
  if (!meta) throw new Error("manifest is missing the nsg-ellipsis-style rule");

  const { AbstractL1Rule } = ctx.bases;
  const { toolkit } = ctx;

  class NsgEllipsisStyle extends AbstractL1Rule {
    lint(text: string, config: LintRuleConfig): LintIssue[] {
      if (!config.enabled) return [];
      return toolkit.regexReplace({
        text,
        pattern: PATTERN,
        ruleId: this.id,
        severity: config.severity,
        message: "Use the ellipsis character … instead of consecutive periods",
        messageJa: "日本語スタイルガイド 第3版に基づき、省略を示すリーダーは三点リーダー（…）を用います。",
        replacement: () => "…",
        reference: REFERENCE,
        fixLabelJa: "「…」に修正",
      });
    }
  }

  return new NsgEllipsisStyle(toolkit.toJsonRuleMeta(meta, manifest), {
    id: meta.ruleId,
    name: meta.nameJa,
    nameJa: meta.nameJa,
    description: meta.descriptionJa,
    descriptionJa: meta.descriptionJa,
    defaultConfig: meta.defaultConfig,
  });
}
