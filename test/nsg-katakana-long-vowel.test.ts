import { describe, it, expect } from "vitest";

import ruleset from "../src/index";
import { createTestContext, CONFIG } from "./test-kit";

const rule = () =>
  ruleset.createRules(createTestContext()).find((r) => r.id === "nsg-katakana-long-vowel")!;

describe("nsg-katakana-long-vowel — detections (語末長音の省略)", () => {
  const cases: Array<[string, string]> = [
    ["新しいコンピュータを買う。", "コンピューター"],
    ["プリンタで印刷する。", "プリンター"],
    ["スキャナで読み取る。", "スキャナー"],
    ["サーバに接続する。", "サーバー"],
    ["ブラウザを開く。", "ブラウザー"],
    ["ユーザを登録する。", "ユーザー"],
    ["チームのメンバを増やす。", "メンバー"],
    ["フォルダを作成する。", "フォルダー"],
    ["パラメータを設定する。", "パラメーター"],
    ["モニタを接続する。", "モニター"],
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

describe("nsg-katakana-long-vowel — false positives (長音付きは対象外)", () => {
  const clean = [
    "新しいコンピューターを買う。",
    "プリンターで印刷する。",
    "サーバーに接続する。",
    "ユーザーを登録する。",
    "パラメーターを設定する。",
    "毎日デートをする。", // 「タ」を含むが対象語ではない
  ];
  for (const text of clean) {
    it(`leaves "${text}" untouched`, () => {
      expect(rule().lint(text, CONFIG)).toHaveLength(0);
    });
  }
});

describe("nsg-katakana-long-vowel — behavior", () => {
  it("does nothing when disabled", () => {
    expect(rule().lint("コンピュータを買う。", { ...CONFIG, enabled: false })).toHaveLength(0);
  });
});
