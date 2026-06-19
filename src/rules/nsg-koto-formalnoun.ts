/**
 * nsg-koto-formalnoun — 形式名詞「こと」の漢字表記誤用を検出（L2）
 *
 * 日本語スタイルガイド 第3版 J.2.2「品詞や意味による漢字とひらがなの使い分け」は、
 * 「こと（事）」について次のように述べる:
 *   「具体的なものを表す名詞のときは漢字にして、抽象的なものを表す形式名詞の
 *    ときは、ひらがなにする言葉もある。」
 *   例: 「事を成しとげる。」（名詞）/ 「変更することもある。」（形式名詞）
 *
 * 本ルールは形態素解析によって「事」が形式名詞（pos_detail_1: "非自立"）として
 * 使われている箇所を検出し、ひらがな「こと」への置換を提案する。
 *
 * 偽陽性回避:
 *   - kuromoji が pos="名詞", pos_detail_1="非自立" と解析した「事」のみを対象。
 *   - 具体的事物を表す普通名詞の「事」（pos_detail_1="一般" など）は対象外。
 *   - 固有名詞・サ変接続は対象外。
 */
import type {
  LintIssue,
  LintRule,
  LintRuleConfig,
  RulesetContext,
  RulesetManifest,
  Token,
} from "illusions-lint-sdk";

const REFERENCE = {
  standard: "日本語スタイルガイド 第3版（テクニカルコミュニケーター協会）",
  section: "第1章 J.2.2節",
} as const;

export function createNsgKotoFormalNoun(
  ctx: RulesetContext,
  manifest: RulesetManifest,
): LintRule {
  const meta = manifest.rules.find((r) => r.ruleId === "nsg-koto-formalnoun");
  if (!meta) throw new Error("manifest is missing the nsg-koto-formalnoun rule");

  const { AbstractMorphologicalLintRule } = ctx.bases;
  const ruleId = meta.ruleId;
  const nameJa = meta.nameJa;
  const descriptionJa = meta.descriptionJa;
  const defaultConfig = meta.defaultConfig;

  class NsgKotoFormalNoun extends AbstractMorphologicalLintRule {
    readonly id = ruleId;
    readonly name = nameJa;
    readonly nameJa = nameJa;
    readonly description = descriptionJa;
    readonly descriptionJa = descriptionJa;
    readonly level = "L2" as const;
    readonly defaultConfig = defaultConfig;

    /** L2 ルールは形態素なしでは動作しない。illusions は lintWithTokens を呼ぶ。 */
    lint(_text: string, _config: LintRuleConfig): LintIssue[] {
      return [];
    }

    lintWithTokens(
      _text: string,
      tokens: ReadonlyArray<Token>,
      config: LintRuleConfig,
    ): LintIssue[] {
      if (!config.enabled) return [];
      const issues: LintIssue[] = [];

      for (const token of tokens) {
        // 「事」が名詞・非自立（形式名詞）として使われている場合
        if (
          token.surface === "事" &&
          token.pos === "名詞" &&
          token.pos_detail_1 === "非自立"
        ) {
          issues.push({
            ruleId: this.id,
            severity: config.severity,
            message:
              'Use hiragana "こと" for the formal noun (形式名詞) usage of 事',
            messageJa:
              "日本語スタイルガイド 第3版に基づき、形式名詞として使う「事」はひらがな「こと」と表記します。",
            from: token.start,
            to: token.end,
            originalText: token.surface,
            reference: REFERENCE,
            fix: {
              label: "Replace 事 with こと",
              labelJa: "「こと」に修正",
              replacement: "こと",
            },
          });
        }
      }

      return issues;
    }
  }

  return new NsgKotoFormalNoun();
}
