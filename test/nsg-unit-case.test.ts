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

describe("nsg-unit-case — edge cases", () => {
  it("does not flag 'Mg' (SI megagram, legitimately uppercase M)", () => {
    // Mg = メガグラム（SI正式記号）。mg との混同を防ぐため除外されている
    expect(rule().lint("質量は5Mgです。", CONFIG)).toHaveLength(0);
  });

  it("does not flag unit when followed by another letter (e.g. type code 'AB12KGX')", () => {
    // lookahead で後続英字があるケースは対象外
    expect(rule().lint("型番はAB12KGXです。", CONFIG)).toHaveLength(0);
  });

  it("flags 'Kg' only when directly following a digit", () => {
    // 数字に続かない Kg は対象外（lookahead ではなく lookbehind で制御）
    expect(rule().lint("Kgの単位で測る。", CONFIG)).toHaveLength(0);
  });

  it("flags multiple wrong-case units in one sentence", () => {
    const issues = rule().lint("重さ5Kg、長さ3CMです。", CONFIG);
    expect(issues).toHaveLength(2);
    expect(issues.map((i) => i.fix?.replacement)).toContain("kg");
    expect(issues.map((i) => i.fix?.replacement)).toContain("cm");
  });

  it("does not flag correct lowercase 'kg' after digit", () => {
    expect(rule().lint("重さは5kgです。", CONFIG)).toHaveLength(0);
  });

  it("flags 'hz' (all lowercase) → 'Hz' (capital H)", () => {
    const issues = rule().lint("周波数は60hzです。", CONFIG);
    expect(issues).toHaveLength(1);
    expect(issues[0].fix?.replacement).toBe("Hz");
  });
});
