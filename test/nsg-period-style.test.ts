import { describe, it, expect } from "vitest";

import ruleset from "../src/index";
import { createTestContext, CONFIG } from "./test-kit";

const rule = () => ruleset.createRules(createTestContext()).find((r) => r.id === "nsg-period-style")!;

describe("nsg-period-style — detections (全角ピリオド → 丸)", () => {
  const cases = ["これは新製品です．", "保存しました．", "完了．"];
  for (const text of cases) {
    it(`flags "${text}"`, () => {
      const issues = rule().lint(text, CONFIG);
      expect(issues.length).toBeGreaterThan(0);
      expect(issues[0].fix?.replacement).toBe("。");
      expect(issues[0].originalText).toBe("．");
      expect(issues[0].reference?.standard).toContain("日本語スタイルガイド");
    });
  }

  it("replaces only the period, keeping the preceding character", () => {
    const issues = rule().lint("完了．", CONFIG);
    expect(issues).toHaveLength(1);
    expect(issues[0].to - issues[0].from).toBe(1);
  });
});

describe("nsg-period-style — false positives (項番・小数点は対象外)", () => {
  const clean = [
    "これは新製品です。",
    "項番は2．3．7です。", // 英数字に挟まれたピリオドには反応しない
    "円周率は3．14です。",
    "Section 2.",
  ];
  for (const text of clean) {
    it(`leaves "${text}" untouched`, () => {
      expect(rule().lint(text, CONFIG)).toHaveLength(0);
    });
  }
});

describe("nsg-period-style — behavior", () => {
  it("does nothing when disabled", () => {
    expect(rule().lint("完了．", { ...CONFIG, enabled: false })).toHaveLength(0);
  });
});
