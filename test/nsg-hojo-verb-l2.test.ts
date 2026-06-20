/**
 * nsg-hojo-verb-l2 — 補助動詞の仮名書き検出テスト（L2）
 *
 * L2 ルールは形態素解析済みトークン列を受け取る lintWithTokens を実装するため、
 * モック Token 配列を直接渡してテストする。
 */
import { describe, it, expect } from "vitest";
import type { Token, LintRule, LintRuleConfig } from "illusions-lint-sdk";

import ruleset from "../src/index";
import { createTestContext, CONFIG } from "./test-kit";

/** lintWithTokens を呼び出すヘルパー */
function lintWithMockTokens(
  rule: LintRule,
  text: string,
  tokens: Token[],
  config: LintRuleConfig,
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (rule as any).lintWithTokens(text, tokens, config);
}

const getRule = () =>
  ruleset.createRules(createTestContext()).find((r) => r.id === "nsg-hojo-verb-l2")!;

// ---------------------------------------------------------------------------
// Token helpers
// ---------------------------------------------------------------------------

/** 接続助詞「て」トークン */
function makeTeToken(start: number): Token {
  return {
    surface: "て",
    pos: "助詞",
    pos_detail_1: "接続助詞",
    pos_detail_2: "",
    pos_detail_3: "",
    basic_form: "て",
    reading: "テ",
    start,
    end: start + 1,
  };
}

/** 接続助詞「で」トークン */
function makeDeToken(start: number): Token {
  return {
    surface: "で",
    pos: "助詞",
    pos_detail_1: "接続助詞",
    pos_detail_2: "",
    pos_detail_3: "",
    basic_form: "で",
    reading: "デ",
    start,
    end: start + 1,
  };
}

/** 自立動詞トークン（本動詞用 — 格助詞などの後に来る想定） */
function makeMainVerbToken(surface: string, basicForm: string, start: number): Token {
  return {
    surface,
    pos: "動詞",
    pos_detail_1: "自立",
    pos_detail_2: "",
    pos_detail_3: "",
    basic_form: basicForm,
    reading: surface,
    start,
    end: start + surface.length,
  };
}

// ---------------------------------------------------------------------------
// 検出テスト (positive — kanji auxiliary verb after て/で)
// ---------------------------------------------------------------------------

describe("nsg-hojo-verb-l2 — 検出 (補助動詞の漢字表記を検出する)", () => {
  it("〜てみる（見る）を検出して「みる」を提案する", () => {
    // 「歩いて見ると」
    const text = "歩いて見ると。";
    const tokens: Token[] = [
      makeMainVerbToken("歩い", "歩く", 0),
      makeTeToken(2),
      {
        surface: "見る",
        pos: "動詞",
        pos_detail_1: "自立",
        basic_form: "見る",
        reading: "ミル",
        start: 3,
        end: 5,
      },
      { surface: "と", pos: "助詞", pos_detail_1: "接続助詞", start: 5, end: 6 },
      { surface: "。", pos: "記号", pos_detail_1: "句点", start: 6, end: 7 },
    ];

    const rule = getRule();
    const issues = lintWithMockTokens(rule, text, tokens, CONFIG);
    expect(issues).toHaveLength(1);
    expect(issues[0].fix?.replacement).toBe("みる");
    expect(issues[0].from).toBe(3);
    expect(issues[0].to).toBe(5);
    expect(issues[0].reference?.standard).toContain("日本語スタイルガイド");
  });

  it("〜ておく（置く）を検出して「おく」を提案する", () => {
    // 「確保して置く」
    const text = "確保して置く。";
    const tokens: Token[] = [
      { surface: "確保", pos: "名詞", pos_detail_1: "サ変接続", start: 0, end: 2 },
      { surface: "し", pos: "動詞", pos_detail_1: "自立", basic_form: "する", start: 2, end: 3 },
      makeTeToken(3),
      {
        surface: "置く",
        pos: "動詞",
        pos_detail_1: "自立",
        basic_form: "置く",
        reading: "オク",
        start: 4,
        end: 6,
      },
      { surface: "。", pos: "記号", pos_detail_1: "句点", start: 6, end: 7 },
    ];

    const rule = getRule();
    const issues = lintWithMockTokens(rule, text, tokens, CONFIG);
    expect(issues).toHaveLength(1);
    expect(issues[0].fix?.replacement).toBe("おく");
    expect(issues[0].from).toBe(4);
    expect(issues[0].to).toBe(6);
  });

  it("〜ていく（行く）を検出して「いく」を提案する", () => {
    // 「進んで行く」
    const text = "変化して行く。";
    const tokens: Token[] = [
      { surface: "変化", pos: "名詞", pos_detail_1: "サ変接続", start: 0, end: 2 },
      { surface: "し", pos: "動詞", pos_detail_1: "自立", basic_form: "する", start: 2, end: 3 },
      makeTeToken(3),
      {
        surface: "行く",
        pos: "動詞",
        pos_detail_1: "自立",
        basic_form: "行く",
        reading: "イク",
        start: 4,
        end: 6,
      },
      { surface: "。", pos: "記号", pos_detail_1: "句点", start: 6, end: 7 },
    ];

    const rule = getRule();
    const issues = lintWithMockTokens(rule, text, tokens, CONFIG);
    expect(issues).toHaveLength(1);
    expect(issues[0].fix?.replacement).toBe("いく");
  });

  it("〜てくる（来る）を検出して「くる」を提案する", () => {
    // 「なって来る」
    const text = "寒くなって来る。";
    const tokens: Token[] = [
      { surface: "寒く", pos: "形容詞", pos_detail_1: "自立", basic_form: "寒い", start: 0, end: 2 },
      makeMainVerbToken("なっ", "成る", 2),
      makeTeToken(3),
      {
        surface: "来る",
        pos: "動詞",
        pos_detail_1: "自立",
        basic_form: "来る",
        reading: "クル",
        start: 4,
        end: 6,
      },
      { surface: "。", pos: "記号", pos_detail_1: "句点", start: 6, end: 7 },
    ];

    const rule = getRule();
    const issues = lintWithMockTokens(rule, text, tokens, CONFIG);
    expect(issues).toHaveLength(1);
    expect(issues[0].fix?.replacement).toBe("くる");
  });

  it("〜てしまう（仕舞う）を検出して「しまう」を提案する", () => {
    // 「使って仕舞う」
    const text = "使って仕舞う。";
    const tokens: Token[] = [
      makeMainVerbToken("使っ", "使う", 0),
      makeTeToken(2),
      {
        surface: "仕舞う",
        pos: "動詞",
        pos_detail_1: "自立",
        basic_form: "仕舞う",
        reading: "シマウ",
        start: 3,
        end: 6,
      },
      { surface: "。", pos: "記号", pos_detail_1: "句点", start: 6, end: 7 },
    ];

    const rule = getRule();
    const issues = lintWithMockTokens(rule, text, tokens, CONFIG);
    expect(issues).toHaveLength(1);
    expect(issues[0].fix?.replacement).toBe("しまう");
  });

  it("〜でおく（置く）— 接続助詞「で」でも検出する", () => {
    // 「読ん で置く」（音便形）
    const text = "読んで置く。";
    const tokens: Token[] = [
      makeMainVerbToken("読ん", "読む", 0),
      makeDeToken(2),
      {
        surface: "置く",
        pos: "動詞",
        pos_detail_1: "自立",
        basic_form: "置く",
        reading: "オク",
        start: 3,
        end: 5,
      },
      { surface: "。", pos: "記号", pos_detail_1: "句点", start: 5, end: 6 },
    ];

    const rule = getRule();
    const issues = lintWithMockTokens(rule, text, tokens, CONFIG);
    expect(issues).toHaveLength(1);
    expect(issues[0].fix?.replacement).toBe("おく");
  });

  it("〜ていただく（頂く）を検出する", () => {
    const text = "報告して頂く。";
    const tokens: Token[] = [
      { surface: "報告", pos: "名詞", pos_detail_1: "サ変接続", start: 0, end: 2 },
      { surface: "し", pos: "動詞", pos_detail_1: "自立", basic_form: "する", start: 2, end: 3 },
      makeTeToken(3),
      {
        surface: "頂く",
        pos: "動詞",
        pos_detail_1: "自立",
        basic_form: "頂く",
        reading: "イタダク",
        start: 4,
        end: 6,
      },
      { surface: "。", pos: "記号", pos_detail_1: "句点", start: 6, end: 7 },
    ];

    const rule = getRule();
    const issues = lintWithMockTokens(rule, text, tokens, CONFIG);
    expect(issues).toHaveLength(1);
    expect(issues[0].fix?.replacement).toBe("いただく");
  });

  it("〜てあげる（上げる）を検出する", () => {
    const text = "教えて上げる。";
    const tokens: Token[] = [
      makeMainVerbToken("教え", "教える", 0),
      makeTeToken(2),
      {
        surface: "上げる",
        pos: "動詞",
        pos_detail_1: "自立",
        basic_form: "上げる",
        reading: "アゲル",
        start: 3,
        end: 6,
      },
      { surface: "。", pos: "記号", pos_detail_1: "句点", start: 6, end: 7 },
    ];

    const rule = getRule();
    const issues = lintWithMockTokens(rule, text, tokens, CONFIG);
    expect(issues).toHaveLength(1);
    expect(issues[0].fix?.replacement).toBe("あげる");
  });
});

// ---------------------------------------------------------------------------
// 非検出テスト (negative — 本動詞・仮名表記済みは対象外)
// ---------------------------------------------------------------------------

describe("nsg-hojo-verb-l2 — 非検出 (本動詞・仮名書き済みは対象外)", () => {
  it("本動詞「見る」（直前が接続助詞でない）は対象外", () => {
    // 「絵を見る」→ 格助詞「を」の後
    const text = "絵を見る。";
    const tokens: Token[] = [
      { surface: "絵", pos: "名詞", pos_detail_1: "一般", start: 0, end: 1 },
      { surface: "を", pos: "助詞", pos_detail_1: "格助詞", start: 1, end: 2 },
      makeMainVerbToken("見る", "見る", 2),
      { surface: "。", pos: "記号", pos_detail_1: "句点", start: 4, end: 5 },
    ];

    const rule = getRule();
    const issues = lintWithMockTokens(rule, text, tokens, CONFIG);
    expect(issues).toHaveLength(0);
  });

  it("本動詞「置く」（格助詞の後）は対象外", () => {
    const text = "机に置く。";
    const tokens: Token[] = [
      { surface: "机", pos: "名詞", pos_detail_1: "一般", start: 0, end: 1 },
      { surface: "に", pos: "助詞", pos_detail_1: "格助詞", start: 1, end: 2 },
      makeMainVerbToken("置く", "置く", 2),
      { surface: "。", pos: "記号", pos_detail_1: "句点", start: 4, end: 5 },
    ];

    const rule = getRule();
    const issues = lintWithMockTokens(rule, text, tokens, CONFIG);
    expect(issues).toHaveLength(0);
  });

  it("本動詞「行く」（格助詞の後）は対象外", () => {
    const text = "会社に行く。";
    const tokens: Token[] = [
      { surface: "会社", pos: "名詞", pos_detail_1: "一般", start: 0, end: 2 },
      { surface: "に", pos: "助詞", pos_detail_1: "格助詞", start: 2, end: 3 },
      makeMainVerbToken("行く", "行く", 3),
      { surface: "。", pos: "記号", pos_detail_1: "句点", start: 5, end: 6 },
    ];

    const rule = getRule();
    const issues = lintWithMockTokens(rule, text, tokens, CONFIG);
    expect(issues).toHaveLength(0);
  });

  it("既に仮名書き「みる」はスキップ", () => {
    const text = "歩いてみると。";
    const tokens: Token[] = [
      makeMainVerbToken("歩い", "歩く", 0),
      makeTeToken(2),
      {
        surface: "みる",
        pos: "動詞",
        pos_detail_1: "自立",
        basic_form: "みる",
        reading: "ミル",
        start: 3,
        end: 5,
      },
      { surface: "と", pos: "助詞", pos_detail_1: "接続助詞", start: 5, end: 6 },
      { surface: "。", pos: "記号", pos_detail_1: "句点", start: 6, end: 7 },
    ];

    const rule = getRule();
    const issues = lintWithMockTokens(rule, text, tokens, CONFIG);
    expect(issues).toHaveLength(0);
  });

  it("既に仮名書きの活用形「おいて」はスキップ（全ひらがなガード）", () => {
    const text = "確認しておいた。";
    const tokens: Token[] = [
      { surface: "確認", pos: "名詞", pos_detail_1: "サ変接続", start: 0, end: 2 },
      { surface: "し", pos: "動詞", pos_detail_1: "自立", basic_form: "する", start: 2, end: 3 },
      makeTeToken(3),
      {
        surface: "おい",
        pos: "動詞",
        pos_detail_1: "自立",
        basic_form: "置く",
        reading: "オイ",
        start: 4,
        end: 6,
      },
      { surface: "た", pos: "助動詞", pos_detail_1: "", start: 6, end: 7 },
      { surface: "。", pos: "記号", pos_detail_1: "句点", start: 7, end: 8 },
    ];

    const rule = getRule();
    const issues = lintWithMockTokens(rule, text, tokens, CONFIG);
    // surface が全ひらがな「おい」なので対象外
    expect(issues).toHaveLength(0);
  });

  it("補助接続詞「て」でない助詞の後の「見る」は対象外（係助詞など）", () => {
    // 「は」の後では補助動詞とならない
    const text = "次は見るべき。";
    const tokens: Token[] = [
      { surface: "次", pos: "名詞", pos_detail_1: "一般", start: 0, end: 1 },
      { surface: "は", pos: "助詞", pos_detail_1: "係助詞", start: 1, end: 2 },
      makeMainVerbToken("見る", "見る", 2),
      { surface: "べき", pos: "助動詞", pos_detail_1: "", start: 4, end: 6 },
      { surface: "。", pos: "記号", pos_detail_1: "句点", start: 6, end: 7 },
    ];

    const rule = getRule();
    const issues = lintWithMockTokens(rule, text, tokens, CONFIG);
    expect(issues).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// エッジケース
// ---------------------------------------------------------------------------

describe("nsg-hojo-verb-l2 — エッジケース", () => {
  it("複数の補助動詞が同一文中にある場合、両方を検出する", () => {
    // 「試して見て、保存して置く」
    const text = "試して見て、保存して置く。";
    const tokens: Token[] = [
      makeMainVerbToken("試し", "試す", 0),
      makeTeToken(2),
      {
        surface: "見",
        pos: "動詞",
        pos_detail_1: "自立",
        basic_form: "見る",
        reading: "ミ",
        start: 3,
        end: 4,
      },
      makeTeToken(4),
      { surface: "、", pos: "記号", pos_detail_1: "読点", start: 5, end: 6 },
      { surface: "保存", pos: "名詞", pos_detail_1: "サ変接続", start: 6, end: 8 },
      { surface: "し", pos: "動詞", pos_detail_1: "自立", basic_form: "する", start: 8, end: 9 },
      makeTeToken(9),
      {
        surface: "置く",
        pos: "動詞",
        pos_detail_1: "自立",
        basic_form: "置く",
        reading: "オク",
        start: 10,
        end: 12,
      },
      { surface: "。", pos: "記号", pos_detail_1: "句点", start: 12, end: 13 },
    ];

    const rule = getRule();
    const issues = lintWithMockTokens(rule, text, tokens, CONFIG);
    expect(issues).toHaveLength(2);
    expect(issues[0].from).toBeLessThan(issues[1].from);
    expect(issues[0].fix?.replacement).toBe("みる");
    expect(issues[1].fix?.replacement).toBe("おく");
  });

  it("活用形（来た → 来る）でも basic_form でマッチする", () => {
    // 「なってきた」— 漢字「来た」
    const text = "複雑になって来た。";
    const tokens: Token[] = [
      { surface: "複雑", pos: "名詞", pos_detail_1: "一般", start: 0, end: 2 },
      { surface: "に", pos: "助詞", pos_detail_1: "格助詞", start: 2, end: 3 },
      makeMainVerbToken("なっ", "成る", 3),
      makeTeToken(4),
      {
        surface: "来た",
        pos: "動詞",
        pos_detail_1: "自立",
        basic_form: "来る",
        reading: "キタ",
        start: 5,
        end: 7,
      },
      { surface: "。", pos: "記号", pos_detail_1: "句点", start: 7, end: 8 },
    ];

    const rule = getRule();
    const issues = lintWithMockTokens(rule, text, tokens, CONFIG);
    expect(issues).toHaveLength(1);
    expect(issues[0].fix?.replacement).toBe("くる");
    expect(issues[0].from).toBe(5);
    expect(issues[0].to).toBe(7);
  });

  it("fix replacement は動詞部分のみ（句点を含まない）", () => {
    const text = "確保して置く。";
    const tokens: Token[] = [
      { surface: "確保", pos: "名詞", pos_detail_1: "サ変接続", start: 0, end: 2 },
      { surface: "し", pos: "動詞", pos_detail_1: "自立", basic_form: "する", start: 2, end: 3 },
      makeTeToken(3),
      {
        surface: "置く",
        pos: "動詞",
        pos_detail_1: "自立",
        basic_form: "置く",
        reading: "オク",
        start: 4,
        end: 6,
      },
      { surface: "。", pos: "記号", pos_detail_1: "句点", start: 6, end: 7 },
    ];
    const rule = getRule();
    const issues = lintWithMockTokens(rule, text, tokens, CONFIG);
    expect(issues[0].fix?.replacement).toBe("おく");
    expect(issues[0].from).toBe(4);
    expect(issues[0].to).toBe(6);
  });

  it("lint() は L2 ルールのため空配列を返す", () => {
    const rule = getRule();
    expect(rule.lint("歩いて見る。", CONFIG)).toHaveLength(0);
  });

  it("disabled 時は検出しない", () => {
    const text = "歩いて見る。";
    const tokens: Token[] = [
      makeMainVerbToken("歩い", "歩く", 0),
      makeTeToken(2),
      {
        surface: "見る",
        pos: "動詞",
        pos_detail_1: "自立",
        basic_form: "見る",
        reading: "ミル",
        start: 3,
        end: 5,
      },
    ];
    const rule = getRule();
    const issues = lintWithMockTokens(rule, text, tokens, { ...CONFIG, enabled: false });
    expect(issues).toHaveLength(0);
  });

  it("rule metadata が正しい", () => {
    const rule = getRule();
    expect(rule.id).toBe("nsg-hojo-verb-l2");
    expect(rule.level).toBe("L2");
  });

  it("nsg-koto-formalnoun との重複なし — 名詞「事」トークンには反応しない", () => {
    // 名詞「事」（非自立）が混在していても動詞でない限り本ルールはスキップ
    const text = "確認する事もある。";
    const tokens: Token[] = [
      { surface: "確認", pos: "名詞", pos_detail_1: "サ変接続", start: 0, end: 2 },
      { surface: "する", pos: "動詞", pos_detail_1: "自立", basic_form: "する", start: 2, end: 4 },
      {
        surface: "事",
        pos: "名詞",
        pos_detail_1: "非自立",
        basic_form: "事",
        reading: "コト",
        start: 4,
        end: 5,
      },
      { surface: "も", pos: "助詞", pos_detail_1: "係助詞", start: 5, end: 6 },
      { surface: "ある", pos: "動詞", pos_detail_1: "自立", basic_form: "ある", start: 6, end: 8 },
      { surface: "。", pos: "記号", pos_detail_1: "句点", start: 8, end: 9 },
    ];
    const rule = getRule();
    // nsg-hojo-verb-l2 は動詞のみを対象とするため 0 件
    expect(lintWithMockTokens(rule, text, tokens, CONFIG)).toHaveLength(0);
  });
});
