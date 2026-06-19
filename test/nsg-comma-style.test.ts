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
