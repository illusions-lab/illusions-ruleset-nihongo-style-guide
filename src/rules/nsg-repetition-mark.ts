/**
 * nsg-repetition-mark — 複合語にまたがる「々」の誤用を検出
 *
 * 日本語スタイルガイド 第3版 1.3.3「記述の記号・符号の表記」は、繰り返し符号
 * 「々」について「国々」「山々」のように同一漢字の繰り返しを示すが、「物理理論」
 * 「研究会会長」のような複合語（語の境界をまたいで同じ漢字が並ぶ場合）には
 * 「々」を使わないと述べる。本ルールは、複合語境界で誤って「々」を用いた代表例
 * を検出し、漢字を繰り返した正しい表記への置換を提案する。
 *
 * 偽陽性回避:
 *   - 正しい畳語（国々・山々・人々 等）には反応しないよう、複合語境界の誤用に
 *     当たる語形を curated list として明示し、その語に限って検出する。
 */
import type {
  LintIssue,
  LintRule,
  LintRuleConfig,
  RulesetContext,
  RulesetManifest,
} from "illusions-lint-sdk";

/** 複合語境界での「々」誤用 → 漢字を繰り返した正しい表記。
 *
 * 各ペアの根拠:
 *   - 研究会々長: 「研究会」+「会長」→ 境界の「会」を々で代替した誤用
 *   - 物理々論:   「物理」+「理論」→ 境界の「理」を々で代替した誤用
 *   - 民主々義:   「民主」+「主義」→ 境界の「主」を々で代替した誤用
 *
 * 除外: 旧 `委員々長→委員会長` は「委員」+「々長」という分割になり、
 *       置換前後で「会」が出現しないため論理的に成立しない。削除。
 */
const PAIRS: ReadonlyArray<{ pattern: RegExp; correct: string }> = [
  { pattern: /研究会々長/, correct: "研究会会長" },
  { pattern: /物理々論/, correct: "物理理論" },
  { pattern: /民主々義/, correct: "民主主義" },
];

const REFERENCE = {
  standard: "日本語スタイルガイド 第3版（テクニカルコミュニケーター協会）",
  section: "第1章 1.3.3節",
} as const;

export function createNsgRepetitionMark(ctx: RulesetContext, manifest: RulesetManifest): LintRule {
  const meta = manifest.rules.find((r) => r.ruleId === "nsg-repetition-mark");
  if (!meta) throw new Error("manifest is missing the nsg-repetition-mark rule");

  const { AbstractL1Rule } = ctx.bases;
  const { toolkit } = ctx;

  class NsgRepetitionMark extends AbstractL1Rule {
    lint(text: string, config: LintRuleConfig): LintIssue[] {
      if (!config.enabled) return [];
      const issues: LintIssue[] = [];
      for (const { pattern, correct } of PAIRS) {
        issues.push(
          ...toolkit.regexReplace({
            text,
            pattern,
            ruleId: this.id,
            severity: config.severity,
            message: `Do not use 々 across a compound boundary: "${correct}"`,
            messageJa: `日本語スタイルガイド 第3版に基づき、複合語境界では繰り返し符号「々」を使わず「${correct}」と表記します。`,
            replacement: () => correct,
            reference: REFERENCE,
            fixLabelJa: `「${correct}」に修正`,
          }),
        );
      }
      return toolkit.dedupe(issues).sort((a, b) => a.from - b.from);
    }
  }

  return new NsgRepetitionMark(toolkit.toJsonRuleMeta(meta, manifest), {
    id: meta.ruleId,
    name: meta.nameJa,
    nameJa: meta.nameJa,
    description: meta.descriptionJa,
    descriptionJa: meta.descriptionJa,
    defaultConfig: meta.defaultConfig,
  });
}
