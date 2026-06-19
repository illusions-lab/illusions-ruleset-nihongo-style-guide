/**
 * nsg-katakana-kanyo — 原語が「V」音のカタカナ表記を慣用形へ統一
 *
 * 日本語スタイルガイド 第3版 1.3.2「カタカナ用語の表記」は、外来語（カタカナ）
 * 表記ガイドラインに基づき、原語が「V」音の場合は慣用として「バ・ビ・ブ・ベ・ボ」
 * を充てると規定する（ヴァイオリン→バイオリン、ヴィーナス→ビーナス 等）。
 * 本ルールは ヴァ・ヴィ・ヴ・ヴェ・ヴォ を検出し、対応する慣用形を提案する。
 *
 * 偽陽性回避:
 *   - 置換は「ヴ＋小書き仮名」または単独の「ヴ」に限定し、対応表で機械的に変換。
 *   - 固有名詞（ヴィヴァルディ・ヴェルサイユ等）はこのガイドラインの対象外であり、
 *     severity=warning（提案）に留め、ユーザーが個別に判断する。
 */
import type {
  LintIssue,
  LintRule,
  LintRuleConfig,
  RulesetContext,
  RulesetManifest,
} from "illusions-lint-sdk";

/** ヴ系の表記 → 慣用形。長い綴り（ヴァ等）を先に並べ、単独ヴは最後に評価する。 */
const VU_MAP: ReadonlyArray<[string, string]> = [
  ["ヴァ", "バ"],
  ["ヴィ", "ビ"],
  ["ヴェ", "ベ"],
  ["ヴォ", "ボ"],
  ["ヴュ", "ビュ"],
  ["ヴ", "ブ"],
];

const PATTERN = /ヴ[ァィェォュ]?/;

const REFERENCE = {
  standard: "日本語スタイルガイド 第3版（テクニカルコミュニケーター協会）",
  section: "第1章 1.3.2節",
} as const;

function toKanyo(matched: string): string {
  for (const [from, to] of VU_MAP) {
    if (matched === from) return to;
  }
  return matched;
}

export function createNsgKatakanaKanyo(ctx: RulesetContext, manifest: RulesetManifest): LintRule {
  const meta = manifest.rules.find((r) => r.ruleId === "nsg-katakana-kanyo");
  if (!meta) throw new Error("manifest is missing the nsg-katakana-kanyo rule");

  const { AbstractL1Rule } = ctx.bases;
  const { toolkit } = ctx;

  class NsgKatakanaKanyo extends AbstractL1Rule {
    lint(text: string, config: LintRuleConfig): LintIssue[] {
      if (!config.enabled) return [];
      return toolkit.regexReplace({
        text,
        pattern: PATTERN,
        ruleId: this.id,
        severity: config.severity,
        message: "Use the conventional katakana form for the V sound (not applicable to proper nouns)",
        messageJa: "日本語スタイルガイド 第3版に基づき、原語が「V」音のカタカナ表記は慣用形（バ・ビ・ブ・ベ・ボ）に統一します。ただし固有名詞は対象外です。",
        replacement: (m) => toKanyo(m[0]),
        reference: REFERENCE,
        fixLabelJa: "慣用形に修正",
      });
    }
  }

  return new NsgKatakanaKanyo(toolkit.toJsonRuleMeta(meta, manifest), {
    id: meta.ruleId,
    name: meta.nameJa,
    nameJa: meta.nameJa,
    description: meta.descriptionJa,
    descriptionJa: meta.descriptionJa,
    defaultConfig: meta.defaultConfig,
  });
}
