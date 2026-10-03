import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality, AssertTypeAssignable } from '@ofzza/tsstd';
import type { JSONSchemaFragmentIsOneOfType, JSONSchemaFragmentType, JSONSchemaOneOfTypeFragment, JSONSchemaOneOfTypeFragmentType } from './index.js';

describe('JSONSchema', () => {
  describe('JSONSchema fragments', () => {
    describe('OneOf fragment', () => {
      it('Detects a one-of-types', () => {
        const _oneOfTypeFragment = { oneOf: [{ type: 'number' }, { type: 'string' }] } as const;
        //    ^?
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsOneOfType<typeof _oneOfTypeFragment>, true>).toBe(true);
        expect(true satisfies AssertTypeAssignable<typeof _oneOfTypeFragment, JSONSchemaOneOfTypeFragment>).toBe(true);
      });

      it('Rejects a non-one-of-types', () => {
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsOneOfType<{ anyOf: [{ type: 'number' }] }>, false>).toBe(true);
      });

      it('Infers unknown from a one-of-types, as it is not yet supported', () => {
        // TODO: Replace with real expectations once One-Of is supported
        const _oneOfTypeFragment = { oneOf: [{ type: 'number' }, { type: 'string' }] } as const;
        expect(true satisfies AssertTypeEquality<JSONSchemaOneOfTypeFragmentType<typeof _oneOfTypeFragment>, unknown>).toBe(true);
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentType<typeof _oneOfTypeFragment>, unknown>).toBe(true);
      });
    });
  });
});
