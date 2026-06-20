import { describe, it, expect } from "vitest";

import ruleset from "../src/index";
import { createTestContext, CONFIG } from "./test-kit";

const rule = () =>
  ruleset.createRules(createTestContext()).find((r) => r.id === "nsg-repetition-mark")!;

describe("nsg-repetition-mark — detections (複合語境界の「々」誤用)", () => {
  const cases: Array<[string, string]> = [
    ["研究会々長に就任する。", "研究会会長"],
    ["この物理々論を学ぶ。", "物理理論"],
    ["民主々義を守る。", "民主主義"],
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

describe("nsg-repetition-mark — false positives (正しい畳語は対象外)", () => {
  const clean = [
    "研究会会長に就任する。",
    "世界の国々を旅する。",
    "高い山々が連なる。",
    "多くの人々が集まる。",
    "時々雨が降る。",
  ];
  for (const text of clean) {
    it(`leaves "${text}" untouched`, () => {
      expect(rule().lint(text, CONFIG)).toHaveLength(0);
    });
  }
});

describe("nsg-repetition-mark — behavior", () => {
  it("does nothing when disabled", () => {
    expect(rule().lint("研究会々長。", { ...CONFIG, enabled: false })).toHaveLength(0);
  });

  it("does not flag 委員々長 (旧ペア削除済み: 論理的に成立しないため)", () => {
    // 「委員々長→委員会長」は「委員+々長」の分割になり、元語に「会」が存在しないため除外
    expect(rule().lint("委員々長を選ぶ。", CONFIG)).toHaveLength(0);
  });
});

describe("nsg-repetition-mark — edge cases", () => {
  it("does not flag correct 畳語 '国々' (single-word reduplication)", () => {
    expect(rule().lint("世界の国々。", CONFIG)).toHaveLength(0);
  });

  it("does not flag '人々' (correct reduplication)", () => {
    expect(rule().lint("多くの人々が来た。", CONFIG)).toHaveLength(0);
  });

  it("does not flag '日々' (correct reduplication)", () => {
    expect(rule().lint("日々の練習が大切だ。", CONFIG)).toHaveLength(0);
  });

  it("flags 民主々義 and replaces with 民主主義", () => {
    const issues = rule().lint("民主々義の原則。", CONFIG);
    expect(issues).toHaveLength(1);
    expect(issues[0].fix?.replacement).toBe("民主主義");
  });

  it("flags multiple compound-boundary 々 errors in one text", () => {
    const issues = rule().lint("研究会々長と民主々義について議論した。", CONFIG);
    expect(issues).toHaveLength(2);
  });

  it("does not flag 物理理論 (already correct — no 々 present)", () => {
    expect(rule().lint("物理理論を学ぶ。", CONFIG)).toHaveLength(0);
  });
});
