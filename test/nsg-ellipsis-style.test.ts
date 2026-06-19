import { describe, it, expect } from "vitest";

import ruleset from "../src/index";
import { createTestContext, CONFIG } from "./test-kit";

const rule = () =>
  ruleset.createRules(createTestContext()).find((r) => r.id === "nsg-ellipsis-style")!;

describe("nsg-ellipsis-style — detections (連続ピリオド → 三点リーダー)", () => {
  const cases = ["続きは...次回へ。", "そして.....沈黙。", "もしかして..そうかも。"];
  for (const text of cases) {
    it(`flags "${text}"`, () => {
      const issues = rule().lint(text, CONFIG);
      expect(issues).toHaveLength(1);
      expect(issues[0].fix?.replacement).toBe("…");
      expect(issues[0].reference?.standard).toContain("日本語スタイルガイド");
    });
  }
});

describe("nsg-ellipsis-style — false positives (単独ピリオド・パスは対象外)", () => {
  const clean = [
    "続きは…次回へ。",
    "項番は2.3.7です。", // 単独ピリオドの連なりではない
    "相対パスは../docsです。", // ../ は対象外
    "値は3.14です。",
  ];
  for (const text of clean) {
    it(`leaves "${text}" untouched`, () => {
      expect(rule().lint(text, CONFIG)).toHaveLength(0);
    });
  }
});

describe("nsg-ellipsis-style — behavior", () => {
  it("does nothing when disabled", () => {
    expect(rule().lint("続きは...次回。", { ...CONFIG, enabled: false })).toHaveLength(0);
  });
});
