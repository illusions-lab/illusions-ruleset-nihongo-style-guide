import { describe, it, expect } from "vitest";

import ruleset from "../src/index";
import { createTestContext, CONFIG } from "./test-kit";

const rule = () => ruleset.createRules(createTestContext()).find((r) => r.id === "nsg-wave-dash")!;

describe("nsg-wave-dash — detections (半角チルダ → 波記号)", () => {
  const cases = ["10~20ページを読む。", "3~5日かかる。"];
  for (const text of cases) {
    it(`flags "${text}"`, () => {
      const issues = rule().lint(text, CONFIG);
      expect(issues).toHaveLength(1);
      expect(issues[0].fix?.replacement).toBe("〜");
      expect(issues[0].originalText).toBe("~");
      expect(issues[0].reference?.standard).toContain("日本語スタイルガイド");
    });
  }

  it("replaces only the tilde", () => {
    const issues = rule().lint("10~20。", CONFIG);
    expect(issues[0].to - issues[0].from).toBe(1);
  });
});

describe("nsg-wave-dash — false positives (波記号・パス等は対象外)", () => {
  const clean = [
    "10〜20ページを読む。",
    "~/work に移動する。", // パス先頭のチルダは数字に挟まれないので対象外
    "コマンドは cd ~ です。",
  ];
  for (const text of clean) {
    it(`leaves "${text}" untouched`, () => {
      expect(rule().lint(text, CONFIG)).toHaveLength(0);
    });
  }
});

describe("nsg-wave-dash — behavior", () => {
  it("does nothing when disabled", () => {
    expect(rule().lint("10~20。", { ...CONFIG, enabled: false })).toHaveLength(0);
  });
});

describe("nsg-wave-dash — edge cases", () => {
  it("flags tilde between full-width digits (e.g. １~２ — digit before is still ASCII here)", () => {
    // テキスト中に半角数字~半角数字の形のみが対象
    const issues = rule().lint("5~10個使う。", CONFIG);
    expect(issues).toHaveLength(1);
    expect(issues[0].fix?.replacement).toBe("〜");
  });

  it("does not flag tilde at start (no preceding digit)", () => {
    expect(rule().lint("~5分かかる。", CONFIG)).toHaveLength(0);
  });

  it("does not flag tilde at end (no following digit)", () => {
    expect(rule().lint("5~ 分かかる。", CONFIG)).toHaveLength(0);
  });

  it("does not flag wave dash character 〜 (already correct)", () => {
    expect(rule().lint("5〜10ページ。", CONFIG)).toHaveLength(0);
  });

  it("does not flag URL with tilde (no adjacent digits)", () => {
    expect(rule().lint("ホームは ~/docs です。", CONFIG)).toHaveLength(0);
  });

  it("span is exactly 1 character (only the tilde, not digits)", () => {
    const issues = rule().lint("10~20。", CONFIG);
    expect(issues[0].to - issues[0].from).toBe(1);
    expect(issues[0].originalText).toBe("~");
  });
});
