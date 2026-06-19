/**
 * Ruleset entry point. Builds the single default-exported RulesetModule.
 *
 * - `manifest` is plain data loaded from manifest.json (read without running code).
 * - `createRules(ctx)` builds the concrete rules using SDK tools from `ctx`.
 *
 * Only `import type` from "illusions-lint-sdk"; runtime tools come via `ctx`.
 */
import type { RulesetContext, RulesetModule } from "illusions-lint-sdk";

import manifestJson from "../manifest.json";
import { createNsgKatakanaLongVowel } from "./rules/nsg-katakana-long-vowel";
import { createNsgKatakanaKanyo } from "./rules/nsg-katakana-kanyo";
import { createNsgPeriodStyle } from "./rules/nsg-period-style";
import { createNsgCommaStyle } from "./rules/nsg-comma-style";
import { createNsgUnitTime } from "./rules/nsg-unit-time";
import { createNsgUnitCase } from "./rules/nsg-unit-case";
import { createNsgFullwidthAlnum } from "./rules/nsg-fullwidth-alnum";
import { createNsgWaveDash } from "./rules/nsg-wave-dash";
import { createNsgEllipsisStyle } from "./rules/nsg-ellipsis-style";
import { createNsgRepetitionMark } from "./rules/nsg-repetition-mark";
import { createNsgKotoFormalNoun } from "./rules/nsg-koto-formalnoun";

const manifest = manifestJson as RulesetModule["manifest"];

const ruleset: RulesetModule = {
  manifest,
  createRules(ctx: RulesetContext) {
    return [
      createNsgKatakanaLongVowel(ctx, manifest),
      createNsgKatakanaKanyo(ctx, manifest),
      createNsgPeriodStyle(ctx, manifest),
      createNsgCommaStyle(ctx, manifest),
      createNsgUnitTime(ctx, manifest),
      createNsgUnitCase(ctx, manifest),
      createNsgFullwidthAlnum(ctx, manifest),
      createNsgWaveDash(ctx, manifest),
      createNsgEllipsisStyle(ctx, manifest),
      createNsgRepetitionMark(ctx, manifest),
      createNsgKotoFormalNoun(ctx, manifest),
    ];
  },
};

export default ruleset;
