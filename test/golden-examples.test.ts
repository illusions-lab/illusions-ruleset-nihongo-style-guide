import { describe, it, expect } from "vitest";

import ruleset from "../src/index";
import manifest from "../manifest.json";
import { createTestContext, CONFIG } from "./test-kit";

/**
 * Golden tests driven by manifest.docs so the 校正目録 (docs) and rules stay in
 * sync: every rule's positive example yields 0 issues, negative example >= 1.
 *
 * L2 ルール（morphological）は lint() がトークンなしで動作しないため、
 * 「negative example is flagged」チェックをスキップし、専用テストファイルに委譲する。
 */
describe("ruleset golden examples", () => {
  const rules = ruleset.createRules(createTestContext());

  it("createRules returns one rule per manifest entry", () => {
    expect(rules.length).toBe(manifest.rules.length);
  });

  for (const meta of manifest.rules) {
    describe(meta.ruleId, () => {
      const r = rules.find((x) => x.id === meta.ruleId);
      it("is built by createRules", () => {
        expect(r, `rule ${meta.ruleId} not returned by createRules`).toBeDefined();
      });
      it("positive example yields no issue", () => {
        expect(r!.lint(meta.docs.positiveExample, CONFIG)).toHaveLength(0);
      });
      if (meta.level !== "L2") {
        it("negative example is flagged", () => {
          expect(r!.lint(meta.docs.negativeExample, CONFIG).length).toBeGreaterThan(0);
        });
      } else {
        it.skip("negative example is flagged (L2: requires lintWithTokens — see dedicated test)", () => {
          // L2 ルールは形態素解析済みトークンが必要なため lint() では検出できない。
          // 専用テストファイルで mock Token を使って lintWithTokens を検証している。
        });
      }
      it("source reference cites the style guide", () => {
        expect(meta.docs.sourceReference).toContain("日本語スタイルガイド 第3版");
      });
    });
  }
});
