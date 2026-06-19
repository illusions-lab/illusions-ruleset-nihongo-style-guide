import { describe, it, expect } from "vitest";

import ruleset from "../src/index";
import { createTestContext, CONFIG } from "./test-kit";

const rule = () =>
  ruleset.createRules(createTestContext()).find((r) => r.id === "nsg-repetition-mark")!;

describe("nsg-repetition-mark — detections (複合語境界の「々」誤用)", () => {
  const cases: Array<[string, string]> = [
    ["研究会々長に就任する。", "研究会会長"],
    ["この物理々論を学ぶ。", "物理理論"],
    ["委員々長を選ぶ。", "委員会長"],
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
});
