import { describe, it, expect } from "vitest";

import ruleset from "../src/index";
import { createTestContext, CONFIG } from "./test-kit";

const rule = () => ruleset.createRules(createTestContext()).find((r) => r.id === "nsg-comma-style")!;

describe("nsg-comma-style — detections (全角コンマ → 点)", () => {
  const cases = ["保存し，終了する。", "赤，青，黄。"];
  for (const text of cases) {
    it(`flags "${text}"`, () => {
      const issues = rule().lint(text, CONFIG);
      expect(issues.length).toBeGreaterThan(0);
      expect(issues[0].fix?.replacement).toBe("、");
      expect(issues[0].originalText).toBe("，");
      expect(issues[0].reference?.standard).toContain("日本語スタイルガイド");
    });
  }

  it("replaces only the comma, keeping the preceding character", () => {
    const issues = rule().lint("保存し，終了する。", CONFIG);
    expect(issues[0].to - issues[0].from).toBe(1);
  });
});

describe("nsg-comma-style — false positives (数字の位取りは対象外)", () => {
  const clean = [
    "保存し、終了する。",
    "金額は1，000円です。", // 英数字に続くコンマには反応しない
    "Total is 1,000.",
  ];
  for (const text of clean) {
    it(`leaves "${text}" untouched`, () => {
      expect(rule().lint(text, CONFIG)).toHaveLength(0);
    });
  }
});

describe("nsg-comma-style — behavior", () => {
  it("does nothing when disabled", () => {
    expect(rule().lint("保存し，終了する。", { ...CONFIG, enabled: false })).toHaveLength(0);
  });
});

describe("nsg-comma-style — edge cases", () => {
  it("flags multiple 全角コンマs in one sentence", () => {
    const issues = rule().lint("赤，青，緑を選ぶ。", CONFIG);
    expect(issues).toHaveLength(2);
  });

  it("flags 全角コンマ after katakana", () => {
    const issues = rule().lint("データ，ファイルを保存する。", CONFIG);
    expect(issues).toHaveLength(1);
    expect(issues[0].fix?.replacement).toBe("、");
  });

  it("flags 全角コンマ after kanji", () => {
    const issues = rule().lint("設定，変更を確認する。", CONFIG);
    expect(issues).toHaveLength(1);
  });

  it("does not flag half-width comma after ASCII digit (position: 1,000)", () => {
    // 半角コンマは対象外（全角コンマのみ対象）
    expect(rule().lint("1,000円です。", CONFIG)).toHaveLength(0);
  });

  it("does not flag 全角コンマ after ASCII digit (e.g. 1，000 — numeric thousands)", () => {
    // 数字直後の全角コンマは英数字扱いで対象外
    expect(rule().lint("1，000円です。", CONFIG)).toHaveLength(0);
  });
});
