import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality, AssertTypeAssignable } from '@ofzza/tsstd';
import type { JSONSchemaFragmentIsNotType, JSONSchemaFragmentType, JSONSchemaNotTypeFragment, JSONSchemaNotTypeFragmentType } from './index.js';

describe('JSONSchema', () => {
  // Type layer tests of NotTypeFragment.ts. The `JSONSchema > JSONSchema fragments > <Kind> fragment` tree is kept from when src/schema/JSONSchema/ was a
  // single file; src/reflection/JSONSchema/NotTypeFragment.test.ts mirrors it at runtime.
  describe('JSONSchema fragments', () => {
    // Each file in this directory holds the tests of one fragment kind under this describe.
    describe('Not fragment', () => {
      // JSONSchemaNotTypeFragment / JSONSchemaFragmentIsNotType and the value type JSONSchemaNotTypeFragmentType, which does not support `not` yet and places
      // no constraint. Tested at type level only, on an inline `as const` fragment, by AssertTypeEquality and AssertTypeAssignable.
      it('Detects a not-type', () => {
        const _notTypeFragment = { not: { type: 'number' } } as const;
        //    ^?
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsNotType<typeof _notTypeFragment>, true>).toBe(true);
        expect(true satisfies AssertTypeAssignable<typeof _notTypeFragment, JSONSchemaNotTypeFragment>).toBe(true);
      });

      it('Rejects a non-not-type', () => {
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentIsNotType<{ type: 'number' }>, false>).toBe(true);
      });

      it('Infers unknown from a not-type, as it is not yet supported', () => {
        // TODO: Replace with real expectations once Not is supported
        const _notTypeFragment = { not: { type: 'number' } } as const;
        expect(true satisfies AssertTypeEquality<JSONSchemaNotTypeFragmentType<typeof _notTypeFragment>, unknown>).toBe(true);
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentType<typeof _notTypeFragment>, unknown>).toBe(true);
      });
    });
  });
});
