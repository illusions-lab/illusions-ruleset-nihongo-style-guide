/**
 * nsg-unit-time — 速度の単位はSI英字記号で表記
 *
 * 日本語スタイルガイド 第3版 1.3.3 は、単位の表記には原則として国際単位系
 * （SI）で定められた英字による単位記号を使うとし、速度については「120km/時」
 * は「120km/h」と表記すると明示する。本ルールは「km/時」「m/時」など速度の
 * 分母にカタカナ・漢字の時間語を用いた表記を検出し、英字記号への置換を提案する。
 *
 * 偽陽性回避:
 *   - 「英字の距離単位 + / + 時間語」の形に限定（時速の文脈以外の「時」に反応しない）。
 */
import type {
  LintIssue,
  LintRule,
  LintRuleConfig,
  RulesetContext,
  RulesetManifest,
} from "illusions-lint-sdk";

/** 速度表記の誤り → 正しいSI記号。距離単位（km/m）＋「/時」を対象にする。 */
const PAIRS: ReadonlyArray<{ pattern: RegExp; correct: string }> = [
  { pattern: /km\/時/, correct: "km/h" },
  { pattern: /(?<![km])m\/時/, correct: "m/h" }, // 「km/時」の m を巻き込まない
  { pattern: /km毎時/, correct: "km/h" },
];

const REFERENCE = {
  standard: "日本語スタイルガイド 第3版（テクニカルコミュニケーター協会）",
  section: "第1章 1.3.3節",
} as const;

export function createNsgUnitTime(ctx: RulesetContext, manifest: RulesetManifest): LintRule {
  const meta = manifest.rules.find((r) => r.ruleId === "nsg-unit-time");
  if (!meta) throw new Error("manifest is missing the nsg-unit-time rule");

  const { AbstractL1Rule } = ctx.bases;
  const { toolkit } = ctx;

  class NsgUnitTime extends AbstractL1Rule {
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
            message: `Use the SI symbol "${correct}" for speed`,
            messageJa: `日本語スタイルガイド 第3版に基づき、速度の単位はSI記号「${correct}」で表記します。`,
            replacement: () => correct,
            reference: REFERENCE,
            fixLabelJa: `「${correct}」に修正`,
          }),
        );
      }
      return toolkit.dedupe(issues).sort((a, b) => a.from - b.from);
    }
  }

  return new NsgUnitTime(toolkit.toJsonRuleMeta(meta, manifest), {
    id: meta.ruleId,
    name: meta.nameJa,
    nameJa: meta.nameJa,
    description: meta.descriptionJa,
    descriptionJa: meta.descriptionJa,
    defaultConfig: meta.defaultConfig,
  });
}
