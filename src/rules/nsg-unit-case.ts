/**
 * nsg-unit-case — SI単位記号の大文字・小文字の誤りを検出
 *
 * 日本語スタイルガイド 第3版 1.3.3 は、単位記号には大文字・小文字の使い方が
 * 定められているとし、次の例を示す:
 *   - 小文字: mg, kg, mm, cm, mol, cd, rad
 *   - 大文字: W, V, A, J, F, C, N
 *   - 大小混在: pH, kW, Hz, MHz, kHz, Pa, Wb
 * 本ルールは、数値に続く単位記号の大文字・小文字が誤っている代表例を検出し、
 * 正しい記号への置換を提案する。
 *
 * 偽陽性回避:
 *   - 「半角数字 + 単位記号」の形に限定し、後ろに英字が続かない（単語の途中で
 *     ない）ことを lookahead で確認する。英単語や型番への誤検出を避ける。
 */
import type {
  LintIssue,
  LintRule,
  LintRuleConfig,
  RulesetContext,
  RulesetManifest,
} from "illusions-lint-sdk";

/** 誤った大小（数値直後）→ 正しいSI記号。直後に英字が続く語は除外（lookahead）。 */
const PAIRS: ReadonlyArray<{ pattern: RegExp; correct: string }> = [
  { pattern: /(?<=\d)Kg(?![A-Za-z])/, correct: "kg" },
  { pattern: /(?<=\d)Mg(?![A-Za-z])/, correct: "mg" },
  { pattern: /(?<=\d)CM(?![A-Za-z])/, correct: "cm" },
  { pattern: /(?<=\d)MM(?![A-Za-z])/, correct: "mm" },
  { pattern: /(?<=\d)KM(?![A-Za-z])/, correct: "km" },
  { pattern: /(?<=\d)hz(?![A-Za-z])/, correct: "Hz" },
  { pattern: /(?<=\d)khz(?![A-Za-z])/, correct: "kHz" },
  { pattern: /(?<=\d)mhz(?![A-Za-z])/, correct: "MHz" },
  { pattern: /(?<=\d)pa(?![A-Za-z])/, correct: "Pa" },
  { pattern: /(?<=\d)kw(?![A-Za-z])/, correct: "kW" },
];

const REFERENCE = {
  standard: "日本語スタイルガイド 第3版（テクニカルコミュニケーター協会）",
  section: "第1章 1.3.3節",
} as const;

export function createNsgUnitCase(ctx: RulesetContext, manifest: RulesetManifest): LintRule {
  const meta = manifest.rules.find((r) => r.ruleId === "nsg-unit-case");
  if (!meta) throw new Error("manifest is missing the nsg-unit-case rule");

  const { AbstractL1Rule } = ctx.bases;
  const { toolkit } = ctx;

  class NsgUnitCase extends AbstractL1Rule {
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
            message: `Fix unit case: "${correct}"`,
            messageJa: `日本語スタイルガイド 第3版に基づき、単位記号は大文字・小文字を区別して「${correct}」と表記します。`,
            replacement: () => correct,
            reference: REFERENCE,
            fixLabelJa: `「${correct}」に修正`,
          }),
        );
      }
      return toolkit.dedupe(issues).sort((a, b) => a.from - b.from);
    }
  }

  return new NsgUnitCase(toolkit.toJsonRuleMeta(meta, manifest), {
    id: meta.ruleId,
    name: meta.nameJa,
    nameJa: meta.nameJa,
    description: meta.descriptionJa,
    descriptionJa: meta.descriptionJa,
    defaultConfig: meta.defaultConfig,
  });
}
