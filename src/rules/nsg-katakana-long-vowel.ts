/**
 * nsg-katakana-long-vowel — 一般用語のカタカナ語末長音符号の省略を検出
 *
 * 日本語スタイルガイド 第3版 1.3.2「カタカナ用語の表記」は、外来語の語末
 * （英語の -er / -or / -ar / -y などに当たる音）を、原則として長音符号「ー」を
 * 付けて書き表すと述べる。一般用語では語末長音を省略しない方針が示されて
 * いる（コンピューター・プリンターなど）。本ルールは、語末長音が省略された
 * 一般用語を検出し、長音符号付きの表記を提案する。
 *
 * 偽陽性回避:
 *   - 語ごとに「省略形＋直後が長音でないこと（lookahead）」で一致させ、既に
 *     長音付きの正しい表記には反応しない。
 *   - 収録は省略が一般化しやすく、かつ JIS 用語集でも長音付きが一般的な
 *     代表的な一般用語に限定する（技術用語は方針が分かれるため対象外）。
 */
import type {
  LintIssue,
  LintRule,
  LintRuleConfig,
  RulesetContext,
  RulesetManifest,
} from "illusions-lint-sdk";

/** 省略形（語末長音なし）→ 正しい長音付き表記。pattern は直後が「ー」でない場合のみ一致。 */
const PAIRS: ReadonlyArray<{ pattern: RegExp; correct: string }> = [
  { pattern: /コンピュータ(?!ー)/, correct: "コンピューター" },
  { pattern: /プリンタ(?!ー)/, correct: "プリンター" },
  { pattern: /スキャナ(?!ー)/, correct: "スキャナー" },
  { pattern: /サーバ(?!ー)/, correct: "サーバー" },
  { pattern: /ブラウザ(?!ー)/, correct: "ブラウザー" },
  { pattern: /ユーザ(?!ー)/, correct: "ユーザー" },
  { pattern: /メンバ(?!ー)/, correct: "メンバー" },
  { pattern: /フォルダ(?!ー)/, correct: "フォルダー" },
  { pattern: /パラメータ(?!ー)/, correct: "パラメーター" },
  { pattern: /モニタ(?!ー)/, correct: "モニター" },
];

const REFERENCE = {
  standard: "日本語スタイルガイド 第3版（テクニカルコミュニケーター協会）",
  section: "第1章 1.3.2節",
} as const;

export function createNsgKatakanaLongVowel(
  ctx: RulesetContext,
  manifest: RulesetManifest,
): LintRule {
  const meta = manifest.rules.find((r) => r.ruleId === "nsg-katakana-long-vowel");
  if (!meta) throw new Error("manifest is missing the nsg-katakana-long-vowel rule");

  const { AbstractL1Rule } = ctx.bases;
  const { toolkit } = ctx;

  class NsgKatakanaLongVowel extends AbstractL1Rule {
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
            message: `Add the long-vowel mark: "${correct}"`,
            messageJa: `日本語スタイルガイド 第3版に基づき、一般用語の語末長音符号は省略せず「${correct}」と表記します。`,
            replacement: () => correct,
            reference: REFERENCE,
            fixLabelJa: `「${correct}」に修正`,
          }),
        );
      }
      return toolkit.dedupe(issues).sort((a, b) => a.from - b.from);
    }
  }

  return new NsgKatakanaLongVowel(toolkit.toJsonRuleMeta(meta, manifest), {
    id: meta.ruleId,
    name: meta.nameJa,
    nameJa: meta.nameJa,
    description: meta.descriptionJa,
    descriptionJa: meta.descriptionJa,
    defaultConfig: meta.defaultConfig,
  });
}
