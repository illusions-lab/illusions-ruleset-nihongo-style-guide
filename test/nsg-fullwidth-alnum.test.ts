import { describe, it, expect } from "vitest";

import ruleset from "../src/index";
import { createTestContext, CONFIG } from "./test-kit";

const rule = () =>
  ruleset.createRules(createTestContext()).find((r) => r.id === "nsg-fullwidth-alnum")!;

describe("nsg-fullwidth-alnum — detections (全角英数字 → 半角)", () => {
  const cases: Array<[string, string]> = [
    ["バージョン３を使う。", "3"],
    ["型番はＡＢＣです。", "ABC"],
    ["コードはｘｙｚです。", "xyz"],
    ["値は１２３です。", "123"],
  ];

  for (const [text, correct] of cases) {
    it(`flags "${text}" → ${correct}`, () => {
      const issues = rule().lint(text, CONFIG);
      expect(issues).toHaveLength(1);
      expect(issues[0].fix?.replacement).toBe(correct);
      expect(issues[0].reference?.standard).toContain("日本語スタイルガイド");
    });
  }
});

describe("nsg-fullwidth-alnum — false positives (半角英数字・全角記号は対象外)", () => {
  const clean = [
    "バージョン3を使う。",
    "型番はABCです。",
    "すごい！と叫ぶ。", // 全角記号は対象外
    "全角の「」は対象外。",
  ];
  for (const text of clean) {
    it(`leaves "${text}" untouched`, () => {
      expect(rule().lint(text, CONFIG)).toHaveLength(0);
    });
  }
});

describe("nsg-fullwidth-alnum — behavior", () => {
  it("groups consecutive full-width characters into one span", () => {
    const issues = rule().lint("値は１２３です。", CONFIG);
    expect(issues).toHaveLength(1);
    expect(issues[0].to - issues[0].from).toBe(3);
  });

  it("does nothing when disabled", () => {
    expect(rule().lint("バージョン３。", { ...CONFIG, enabled: false })).toHaveLength(0);
  });
});

describe("nsg-fullwidth-alnum — edge cases", () => {
  it("flags mixed full-width letters and digits as a single span", () => {
    // Ａ１Ｂ２ (全角英数字混在) は1スパンにまとめる
    const issues = rule().lint("型番はＡ１Ｂ２です。", CONFIG);
    expect(issues).toHaveLength(1);
    expect(issues[0].fix?.replacement).toBe("A1B2");
  });

  it("does not flag full-width symbols (！、（）など)", () => {
    expect(rule().lint("完了！できました。", CONFIG)).toHaveLength(0);
  });

  it("does not flag half-width digits", () => {
    expect(rule().lint("バージョン3を使う。", CONFIG)).toHaveLength(0);
  });

  it("flags non-contiguous full-width characters as separate issues", () => {
    // 全角数字が離れている場合、別々のスパンになる
    const issues = rule().lint("値は１で係数は２です。", CONFIG);
    expect(issues).toHaveLength(2);
    expect(issues[0].fix?.replacement).toBe("1");
    expect(issues[1].fix?.replacement).toBe("2");
  });

  it("NFKC normalization correctly maps Ａ→A and ａ→a", () => {
    const issues = rule().lint("コードはＡＢＣａｂｃです。", CONFIG);
    expect(issues).toHaveLength(1);
    expect(issues[0].fix?.replacement).toBe("ABCabc");
  });
});
