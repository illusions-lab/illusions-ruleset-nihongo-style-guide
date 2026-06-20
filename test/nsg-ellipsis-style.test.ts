import { describe, it, expect } from "vitest";

import ruleset from "../src/index";
import { createTestContext, CONFIG } from "./test-kit";

const rule = () =>
  ruleset.createRules(createTestContext()).find((r) => r.id === "nsg-ellipsis-style")!;

describe("nsg-ellipsis-style — detections (連続3個以上のピリオド → 三点リーダー)", () => {
  const cases = ["続きは...次回へ。", "そして.....沈黙。", "もしかして...そうかも。"];
  for (const text of cases) {
    it(`flags "${text}"`, () => {
      const issues = rule().lint(text, CONFIG);
      expect(issues).toHaveLength(1);
      expect(issues[0].fix?.replacement).toBe("…");
      expect(issues[0].reference?.standard).toContain("日本語スタイルガイド");
    });
  }
});

describe("nsg-ellipsis-style — false positives (単独・2個ピリオド・パスは対象外)", () => {
  const clean = [
    "続きは…次回へ。",
    "項番は2.3.7です。", // 単独ピリオドの連なりではない
    "相対パスは../docsです。", // ../ は対象外
    "値は3.14です。",
    "親ディレクトリは..です。", // 2個ピリオドは対象外（3個未満）
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

describe("nsg-ellipsis-style — edge cases", () => {
  it("flags exactly 3 periods", () => {
    const issues = rule().lint("待った...。", CONFIG);
    expect(issues).toHaveLength(1);
  });

  it("flags 4 or more consecutive periods", () => {
    const issues = rule().lint("そして....次へ。", CONFIG);
    expect(issues).toHaveLength(1);
    expect(issues[0].fix?.replacement).toBe("…");
  });

  it("does not flag 2 periods (path notation or range)", () => {
    expect(rule().lint("親フォルダは..です。", CONFIG)).toHaveLength(0);
  });

  it("does not flag ../ (relative path prefix)", () => {
    expect(rule().lint("パスは../docsです。", CONFIG)).toHaveLength(0);
  });

  it("does not flag single period", () => {
    expect(rule().lint("バージョン1.0です。", CONFIG)).toHaveLength(0);
  });

  it("does not flag already-correct 三点リーダー", () => {
    expect(rule().lint("続きは…次回へ。", CONFIG)).toHaveLength(0);
  });

  it("replacement collapses any run of ≥3 periods to a single …", () => {
    const issues = rule().lint("続き......次へ。", CONFIG);
    expect(issues).toHaveLength(1);
    expect(issues[0].fix?.replacement).toBe("…");
  });
});
