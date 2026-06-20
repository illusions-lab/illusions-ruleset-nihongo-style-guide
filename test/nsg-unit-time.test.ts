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

describe("nsg-unit-time — edge cases", () => {
  it("does not flag 'm/s' (seconds unit — not covered by this rule)", () => {
    // m/s はこのルールの対象外（「時」に限定している）
    expect(rule().lint("速度は5m/sです。", CONFIG)).toHaveLength(0);
  });

  it("does not flag '時速' written in full Japanese without unit symbol", () => {
    // 「時速120キロ」はルールの対象外（単位記号がない）
    expect(rule().lint("時速120キロで走る。", CONFIG)).toHaveLength(0);
  });

  it("flags 'km毎時' in addition to 'km/時'", () => {
    const issues = rule().lint("速度は60km毎時だ。", CONFIG);
    expect(issues).toHaveLength(1);
    expect(issues[0].fix?.replacement).toBe("km/h");
  });

  it("does not produce double flags when 'km/時' and 'm/時' both appear", () => {
    // km/時 と m/時 が同時に出た場合、km/時 の m を m/時 と誤検出しないこと
    const issues = rule().lint("最高100km/時、歩行5m/時。", CONFIG);
    expect(issues).toHaveLength(2);
    expect(issues.map((i) => i.fix?.replacement)).toEqual(["km/h", "m/h"]);
  });

  it("does not flag 'm/時' when the m is part of 'km/時'", () => {
    // km/時 の m を単独 m と見なさない（負の lookahead で除外）
    const issues = rule().lint("最高100km/時。", CONFIG);
    expect(issues).toHaveLength(1);
    expect(issues[0].fix?.replacement).toBe("km/h");
  });
});
