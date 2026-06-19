/**
 * nsg-koto-formalnoun — 形式名詞「こと」の漢字表記誤用検出テスト（L2）
 *
 * L2 ルールは形態素解析済みトークン列を受け取る lintWithTokens を実装するため、
 * ここではモック Token 配列を直接渡してテストする。
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
  // AbstractMorphologicalLintRule のインスタンスには lintWithTokens がある
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (rule as any).lintWithTokens(text, tokens, config);
}

const getRule = () =>
  ruleset.createRules(createTestContext()).find((r) => r.id === "nsg-koto-formalnoun")!;

/** 形式名詞の「事」トークンを生成するヘルパー */
function makeFormalNounKoto(start: number): Token {
  return {
    surface: "事",
    pos: "名詞",
    pos_detail_1: "非自立",
    pos_detail_2: "",
    pos_detail_3: "",
    basic_form: "事",
    reading: "コト",
    start,
    end: start + 1,
  };
}

/** 普通名詞の「事」トークンを生成するヘルパー */
function makeNounKoto(start: number): Token {
  return {
    surface: "事",
    pos: "名詞",
    pos_detail_1: "一般",
    pos_detail_2: "",
    pos_detail_3: "",
    basic_form: "事",
    reading: "コト",
    start,
    end: start + 1,
  };
}

describe("nsg-koto-formalnoun — detections (形式名詞の「事」→「こと」)", () => {
  it("形式名詞の「事」を検出して「こと」を提案する", () => {
    const text = "変更する事もある。";
    const tokens: Token[] = [
      { surface: "変更", pos: "名詞", pos_detail_1: "サ変接続", start: 0, end: 2 },
      { surface: "する", pos: "動詞", pos_detail_1: "自立", start: 2, end: 4 },
      makeFormalNounKoto(4), // 「事」が形式名詞
      { surface: "も", pos: "助詞", pos_detail_1: "係助詞", start: 5, end: 6 },
      { surface: "ある", pos: "動詞", pos_detail_1: "自立", start: 6, end: 8 },
      { surface: "。", pos: "記号", pos_detail_1: "句点", start: 8, end: 9 },
    ];

    const rule = getRule();
    const issues = lintWithMockTokens(rule, text, tokens, CONFIG);
    expect(issues).toHaveLength(1);
    expect(issues[0].fix?.replacement).toBe("こと");
    expect(issues[0].from).toBe(4);
    expect(issues[0].to).toBe(5);
    expect(issues[0].reference?.standard).toContain("日本語スタイルガイド");
  });

  it("複数の形式名詞「事」を全て検出する", () => {
    const text = "確認する事と、変更する事がある。";
    const tokens: Token[] = [
      { surface: "確認", pos: "名詞", pos_detail_1: "サ変接続", start: 0, end: 2 },
      { surface: "する", pos: "動詞", pos_detail_1: "自立", start: 2, end: 4 },
      makeFormalNounKoto(4), // 最初の形式名詞「事」
      { surface: "と", pos: "助詞", pos_detail_1: "格助詞", start: 5, end: 6 },
      { surface: "、", pos: "記号", pos_detail_1: "読点", start: 6, end: 7 },
      { surface: "変更", pos: "名詞", pos_detail_1: "サ変接続", start: 7, end: 9 },
      { surface: "する", pos: "動詞", pos_detail_1: "自立", start: 9, end: 11 },
      makeFormalNounKoto(11), // 2番目の形式名詞「事」
      { surface: "が", pos: "助詞", pos_detail_1: "格助詞", start: 12, end: 13 },
      { surface: "ある", pos: "動詞", pos_detail_1: "自立", start: 13, end: 15 },
      { surface: "。", pos: "記号", pos_detail_1: "句点", start: 15, end: 16 },
    ];

    const rule = getRule();
    const issues = lintWithMockTokens(rule, text, tokens, CONFIG);
    expect(issues).toHaveLength(2);
    expect(issues[0].from).toBeLessThan(issues[1].from);
  });
});

describe("nsg-koto-formalnoun — false positives (普通名詞・他品詞は対象外)", () => {
  it("普通名詞の「事」には反応しない（例: 事を成しとげる）", () => {
    const text = "事を成しとげる。";
    const tokens: Token[] = [
      makeNounKoto(0), // 普通名詞の「事」 (pos_detail_1: "一般")
      { surface: "を", pos: "助詞", pos_detail_1: "格助詞", start: 1, end: 2 },
      { surface: "成し", pos: "動詞", pos_detail_1: "自立", start: 2, end: 4 },
      { surface: "とげる", pos: "動詞", pos_detail_1: "自立", start: 4, end: 7 },
      { surface: "。", pos: "記号", pos_detail_1: "句点", start: 7, end: 8 },
    ];

    const rule = getRule();
    const issues = lintWithMockTokens(rule, text, tokens, CONFIG);
    expect(issues).toHaveLength(0);
  });

  it("ひらがな「こと」はそもそもトークン表面が「事」でないため対象外", () => {
    const text = "変更することもある。";
    const tokens: Token[] = [
      { surface: "変更", pos: "名詞", pos_detail_1: "サ変接続", start: 0, end: 2 },
      { surface: "する", pos: "動詞", pos_detail_1: "自立", start: 2, end: 4 },
      { surface: "こと", pos: "名詞", pos_detail_1: "非自立", start: 4, end: 6 },
      { surface: "も", pos: "助詞", pos_detail_1: "係助詞", start: 6, end: 7 },
      { surface: "ある", pos: "動詞", pos_detail_1: "自立", start: 7, end: 9 },
      { surface: "。", pos: "記号", pos_detail_1: "句点", start: 9, end: 10 },
    ];

    const rule = getRule();
    const issues = lintWithMockTokens(rule, text, tokens, CONFIG);
    expect(issues).toHaveLength(0);
  });
});

describe("nsg-koto-formalnoun — behavior", () => {
  it("does nothing when disabled", () => {
    const text = "変更する事もある。";
    const tokens: Token[] = [
      { surface: "変更", pos: "名詞", pos_detail_1: "サ変接続", start: 0, end: 2 },
      { surface: "する", pos: "動詞", pos_detail_1: "自立", start: 2, end: 4 },
      makeFormalNounKoto(4),
    ];
    const rule = getRule();
    const issues = lintWithMockTokens(rule, text, tokens, { ...CONFIG, enabled: false });
    expect(issues).toHaveLength(0);
  });

  it("rule metadata is correct", () => {
    const rule = getRule();
    expect(rule.id).toBe("nsg-koto-formalnoun");
    expect(rule.level).toBe("L2");
  });
});
