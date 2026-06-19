import { describe, it, expect } from "vitest";

import ruleset from "../src/index";
import { createTestContext, CONFIG } from "./test-kit";

const rule = () => ruleset.createRules(createTestContext()).find((r) => r.id === "nsg-unit-time")!;

describe("nsg-unit-time — detections (速度の単位 → SI記号)", () => {
  const cases: Array<[string, string]> = [
    ["最高120km/時で走る。", "km/h"],
    ["風速は10m/時だ。", "m/h"],
    ["時速は60km毎時に達する。", "km/h"],
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

describe("nsg-unit-time — false positives (正しいSI記号は対象外)", () => {
  const clean = [
    "最高120km/hで走る。",
    "午後3時に集合する。", // 速度文脈でない「時」には反応しない
    "現在の時刻を表示する。",
  ];
  for (const text of clean) {
    it(`leaves "${text}" untouched`, () => {
      expect(rule().lint(text, CONFIG)).toHaveLength(0);
    });
  }
});

describe("nsg-unit-time — behavior", () => {
  it("does nothing when disabled", () => {
    expect(rule().lint("120km/時。", { ...CONFIG, enabled: false })).toHaveLength(0);
  });
});
