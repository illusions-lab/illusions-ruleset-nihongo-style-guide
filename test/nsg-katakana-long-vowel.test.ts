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

describe("nsg-katakana-long-vowel — edge cases", () => {
  it("does not flag 'コンピューター' (already correct, long vowel present)", () => {
    expect(rule().lint("コンピューターを使う。", CONFIG)).toHaveLength(0);
  });

  it("does not flag 'ユーザーグループ' (compound with correct long vowel)", () => {
    // 複合語でも長音付きが正しい表記のままであれば反応しない
    expect(rule().lint("ユーザーグループに参加する。", CONFIG)).toHaveLength(0);
  });

  it("flags the first occurrence in a multi-match sentence", () => {
    // ユーザ と プリンタ が両方ある場合、両方を検出する
    const issues = rule().lint("ユーザとプリンタの設定。", CONFIG);
    expect(issues).toHaveLength(2);
  });

  it("does not flag katakana ending with long vowel at word boundary edge: サーバー (already correct)", () => {
    expect(rule().lint("サーバーを再起動する。", CONFIG)).toHaveLength(0);
  });

  it("flags 'ユーザ' embedded in a longer string", () => {
    // ユーザ が後続の文字列に続く場合も検出する
    const issues = rule().lint("ユーザ管理画面を開く。", CONFIG);
    expect(issues).toHaveLength(1);
    expect(issues[0].fix?.replacement).toBe("ユーザー");
  });
});
