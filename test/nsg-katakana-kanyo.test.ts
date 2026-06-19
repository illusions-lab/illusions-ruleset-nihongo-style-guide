import { describe, it, expect } from "vitest";

import ruleset from "../src/index";
import { createTestContext, CONFIG } from "./test-kit";

const rule = () =>
  ruleset.createRules(createTestContext()).find((r) => r.id === "nsg-katakana-kanyo")!;

describe("nsg-katakana-kanyo — detections (ヴ音 → 慣用形)", () => {
  const cases: Array<[string, string]> = [
    ["ヴァイオリンを弾く。", "バ"],
    ["ヴィーナスの絵。", "ビ"],
    ["ヴェールを取る。", "ベ"],
    ["ヴォリュームを上げる。", "ボ"],
    ["インタヴューを受ける。", "ビュ"],
    ["ドライヴが好きだ。", "ブ"],
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

describe("nsg-katakana-kanyo — false positives (慣用形は対象外)", () => {
  const clean = [
    "バイオリンを弾く。",
    "ビーナスの絵。",
    "ベールを取る。",
    "ボリュームを上げる。",
    "インタビューを受ける。",
  ];
  for (const text of clean) {
    it(`leaves "${text}" untouched`, () => {
      expect(rule().lint(text, CONFIG)).toHaveLength(0);
    });
  }
});

describe("nsg-katakana-kanyo — behavior", () => {
  it("does nothing when disabled", () => {
    expect(rule().lint("ヴァイオリン。", { ...CONFIG, enabled: false })).toHaveLength(0);
  });

  it("reports each occurrence with its own span", () => {
    const issues = rule().lint("ヴァイオリンとヴィオラ。", CONFIG);
    expect(issues).toHaveLength(2);
    expect(issues[0].from).toBeLessThan(issues[1].from);
  });
});
