import { describe, it, expect } from "vitest";

import ruleset from "../src/index";
import { createTestContext, CONFIG } from "./test-kit";

const rule = () => ruleset.createRules(createTestContext()).find((r) => r.id === "nsg-unit-case")!;

describe("nsg-unit-case — detections (単位記号の大小誤り)", () => {
  const cases: Array<[string, string]> = [
    ["重さは5Kgです。", "kg"],
    ["長さは10CMです。", "cm"],
    ["幅は3MMです。", "mm"],
    ["距離は5KMです。", "km"],
    ["周波数は50hzです。", "Hz"],
    ["クロックは3khzです。", "kHz"],
    ["帯域は5mhzです。", "MHz"],
    ["気圧は1013paです。", "Pa"],
    ["出力は3kwです。", "kW"],
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

describe("nsg-unit-case — false positives (正しい記号・英単語・Mgは対象外)", () => {
  const clean = [
    "重さは5kgです。",
    "周波数は50Hzです。",
    "気圧は1013Paです。",
    "Page 5km is fine.", // 数字に続かないので対象外（5km は正しい小文字）
    "型番はAB12KGXです。", // 直後に英字が続く語は対象外
    // Mg はSI単位のメガグラム（Megagram）として正当なため対象外
    "質量は5Mgです。",
  ];
  for (const text of clean) {
    it(`leaves "${text}" untouched`, () => {
      expect(rule().lint(text, CONFIG)).toHaveLength(0);
    });
  }
});

describe("nsg-unit-case — behavior", () => {
  it("does nothing when disabled", () => {
    expect(rule().lint("5Kg。", { ...CONFIG, enabled: false })).toHaveLength(0);
  });
});
