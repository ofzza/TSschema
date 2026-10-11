/**
 * Showcase of the internal runtime reflection module entry (`src/reflection/index.ts`). Never public: meant for understanding the inner workings of the
 * library before changing them (see CONTRIBUTE.md).
 *
 * For now the module entry only re-exports the JSON schema fragment reflections, showcased in depth in `./JSONSchema/showcase.test.ts`. The TSSchema*
 * reflection classes, which will wrap them as the public runtime reflection API, will be showcased here once they exist.
 *
 * - Hover any `// ^?` comment in an editor with twoslash query support (VS Code: the recommended `orta.vscode-twoslash-queries` extension) to see the
 *   type inferred for the identifier above it. Every `// ^?` is followed by a plain comment stating the same type, for editors without it.
 * - Runtime results are assigned to named constants, each followed by a `// Breakpoint:` comment.
 */

import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality } from '@ofzza/tsstd';
import { JSONSchemaCollectionFragmentReflect, JSONSchemaModelFragmentReflect } from './index.js';

import { default as jsonSchema } from '../../res/sidecar/schema.json';

describe('Showcase', () => {
  describe('Runtime reflection', () => {
    it('Reflects a JSON schema collection through the module entry', () => {
      // A schema kept in a JSON file works as well as one declared `as const`, once a `tsschema` generated sidecar types it
      const collection = new JSONSchemaCollectionFragmentReflect(jsonSchema);
      // Breakpoint: inspect `collection`, holding the reflections of every fragment of the fixture schema
      expect(collection.names).toContain('Assessment');

      const assessment = collection.fragment('Assessment')[0];
      // Breakpoint: inspect `assessment`, a model reflection, and its `properties`
      expect(assessment).toBeInstanceOf(JSONSchemaModelFragmentReflect);
      type Assessment = typeof assessment.Type;
      //   ^?
      // Assessment: { id: string; kind: number; title: string; weight: number; … }
      expect(true satisfies AssertTypeEquality<Assessment['weight'], number>).toBe(true);
    });
  });
});
