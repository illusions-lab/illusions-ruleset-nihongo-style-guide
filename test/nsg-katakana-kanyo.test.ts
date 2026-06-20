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

describe("nsg-katakana-kanyo — edge cases", () => {
  it("converts standalone ヴ (without kana suffix) to ブ", () => {
    const issues = rule().lint("ドライヴを楽しむ。", CONFIG);
    expect(issues).toHaveLength(1);
    expect(issues[0].fix?.replacement).toBe("ブ");
  });

  it("converts ヴュ to ビュ", () => {
    // インタヴュー → インタビュー （ヴュ → ビュ）
    const issues = rule().lint("インタヴューを受ける。", CONFIG);
    expect(issues).toHaveLength(1);
    expect(issues[0].fix?.replacement).toBe("ビュ");
  });

  it("does not flag text that already uses conventional forms", () => {
    // バ行が既に使われていれば何も検出しない
    expect(rule().lint("バイオリンとビオラを弾く。", CONFIG)).toHaveLength(0);
  });

  it("handles ヴォ → ボ conversion at start of word", () => {
    const issues = rule().lint("ヴォリュームを下げる。", CONFIG);
    expect(issues).toHaveLength(1);
    expect(issues[0].fix?.replacement).toBe("ボ");
  });

  it("span covers only the ヴ-sequence, not surrounding characters", () => {
    const text = "インタヴュー"; // ヴュ is at index 3-4 (0-based)
    const issues = rule().lint(text, CONFIG);
    expect(issues).toHaveLength(1);
    // span should be exactly 2 chars (ヴュ)
    expect(issues[0].to - issues[0].from).toBe(2);
  });
});
