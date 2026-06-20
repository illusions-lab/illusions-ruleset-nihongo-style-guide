/**
 * nsg-hojo-verb-l2 — 補助動詞の仮名書き検出（形態素解析 L2）
 *
 * 日本語スタイルガイド 第3版 第1章 1.2.2節「品詞や意味による漢字とひらがなの
 * 使い分け」では、同じ動詞でも本動詞として使う場合は漢字、補助動詞として
 * 使う場合はひらがなで書き分けるべき例が示されている。
 *
 *   例（本書 1.2.2節）:
 *     図面を見る。        （動詞）    → 漢字「見る」
 *     歩いてみると、周辺の変化がよくわかった。（補助動詞）→ 仮名「みる」
 *     右端に置く。        （動詞）    → 漢字「置く」
 *     確保しておく。      （補助動詞）→ 仮名「おく」
 *
 * 付録1「漢字とひらがなの使い分け」では、以下の補助動詞（補動）が
 * 仮名形を推奨形として列挙され、「動詞として使う場合は漢字で書く」と注記されている:
 *   〜あげる（〜上げる）、〜いく（〜行く）、〜いたす（〜致す）、
 *   〜いただく（〜頂く）、〜いる（〜居る）、〜おく（〜置く）、
 *   〜（して）くださる（〜下さる）、〜くる（〜来る）、〜（て）しまう（〜了う）、
 *   〜（に）なる（〜成る）、〜（て）みせる（〜見せる）、〜（て）みる（〜見る）、
 *   〜もらう（〜貰う）、〜（て）ゆく（〜行く）
 *
 * 本ルールは形態素解析トークンを用いて、接続助詞「て（で）」の直後に来る
 * 動詞トークンが補助動詞辞書に一致する場合に仮名書きを提案する。
 *
 * L1 の正規表現では本動詞と補助動詞を区別できないため、L2（形態素解析）が必要。
 *
 * 出典: 日本語スタイルガイド 第3版（テクニカルコミュニケーター協会）
 *       第1章 1.2.2節「品詞や意味による漢字とひらがなの使い分け」、
 *       付録1「漢字とひらがなの使い分け」
 *
 * 重複排除（nsg-koto-formalnoun との対比）:
 *   nsg-koto-formalnoun は名詞「事」（pos="名詞", pos_detail_1="非自立"）を対象とする。
 *   本ルールは動詞（pos="動詞"）が「て/で」接続助詞に後続する場合のみを対象とし、
 *   名詞トークンには一切干渉しない。両ルールの対象品詞が異なるため重複しない。
 *
 * 偽陽性回避:
 *   - 直前トークンが接続助詞「て/で」（pos="助詞", pos_detail_1="接続助詞"）の
 *     場合のみ検出。
 *   - 本動詞用法（「会社に行く」「絵を見る」等）は直前に接続助詞が来ないため対象外。
 *   - surface が既に仮名の場合はスキップ（二重提案を防ぐ）。
 *   - basic_form でマッチするため活用形の違いに対応。
 */
import type {
  LintIssue,
  LintRule,
  LintRuleConfig,
  RulesetContext,
  RulesetManifest,
  Token,
} from "illusions-lint-sdk";

/**
 * 補助動詞の漢字基本形 → 仮名推奨形 の対応表。
 * basic_form（辞書形）でマッチするため、活用形（て→行って、行き、行った）に依存しない。
 */
const AUX_VERB_MAP: ReadonlyMap<string, string> = new Map([
  ["上げる", "あげる"],
  ["行く", "いく"],
  ["致す", "いたす"],
  ["頂く", "いただく"],
  ["居る", "いる"],
  ["置く", "おく"],
  ["下さる", "くださる"],
  ["来る", "くる"],
  ["仕舞う", "しまう"],
  ["了う", "しまう"],
  ["成る", "なる"],
  ["見せる", "みせる"],
  ["見る", "みる"],
  ["貰う", "もらう"],
  ["遣る", "やる"],
]);

const REFERENCE = {
  standard: "日本語スタイルガイド 第3版（テクニカルコミュニケーター協会）",
  section: "第1章 1.2.2節「品詞や意味による漢字とひらがなの使い分け」",
} as const;

/** て/で（接続助詞）かどうかを判定 */
function isTeConjunction(t: Token): boolean {
  return (
    (t.surface === "て" || t.surface === "で") &&
    t.pos === "助詞" &&
    t.pos_detail_1 === "接続助詞"
  );
}

export function createNsgHojoVerbL2(
  ctx: RulesetContext,
  manifest: RulesetManifest,
): LintRule {
  const meta = manifest.rules.find((r) => r.ruleId === "nsg-hojo-verb-l2");
  if (!meta) throw new Error("manifest is missing the nsg-hojo-verb-l2 rule");

  const { AbstractMorphologicalLintRule } = ctx.bases;
  const { toolkit } = ctx;

  const ruleId: string = meta.ruleId;
  const nameJa: string = meta.nameJa;
  const descriptionJa: string = meta.descriptionJa;
  const defaultConfig = meta.defaultConfig;

  class NsgHojoVerbL2 extends AbstractMorphologicalLintRule {
    readonly id = ruleId;
    readonly name = nameJa;
    readonly nameJa = nameJa;
    readonly description = descriptionJa;
    readonly descriptionJa = descriptionJa;
    readonly level = "L2" as const;
    readonly defaultConfig = defaultConfig;
    readonly engine = "morphological" as const;

    // L2 ルールは lintWithTokens を使用する。lint() は常に空を返す。
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

      for (let i = 1; i < tokens.length; i++) {
        const prev = tokens[i - 1];
        const cur = tokens[i];

        // 直前が接続助詞「て/で」でなければスキップ（本動詞を除外する主要ガード）
        if (!isTeConjunction(prev)) continue;

        // 現トークンが動詞でなければスキップ
        if (cur.pos !== "動詞") continue;

        // 基本形（辞書形）で補助動詞辞書を引く
        const basicForm = cur.basic_form ?? cur.surface;
        const kanaForm = AUX_VERB_MAP.get(basicForm);
        if (!kanaForm) continue;

        // surface が既に仮名（推奨形）ならスキップ
        if (cur.surface === kanaForm) continue;
        // 既に仮名書きの活用形（例: みた、おいた）もスキップ
        if (/^[ぁ-ん]+$/.test(cur.surface)) continue;

        issues.push({
          ruleId: this.id,
          severity: config.severity,
          message: `Auxiliary verb "${cur.surface}" (…て${cur.surface}) should be written in kana: "${kanaForm}"`,
          messageJa: `日本語スタイルガイド 第3版に基づき、補助動詞として使う「…て${cur.surface}」の「${cur.surface}」はひらがな「${kanaForm}」と表記します（例: 歩いてみる、確保しておく）。`,
          from: cur.start,
          to: cur.end,
          originalText: cur.surface,
          reference: REFERENCE,
          fix: {
            label: `Replace "${cur.surface}" with "${kanaForm}"`,
            labelJa: `「${kanaForm}」に変更`,
            replacement: kanaForm,
          },
        });
      }

      return toolkit.dedupe(issues).sort((a, b) => a.from - b.from);
    }
  }

  return new NsgHojoVerbL2();
}
