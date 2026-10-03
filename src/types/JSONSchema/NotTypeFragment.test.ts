import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality, AssertTypeAssignable } from '@ofzza/tsstd';
import type { JSONSchemaFragmentIsNotType, JSONSchemaFragmentType, JSONSchemaNotTypeFragment, JSONSchemaNotTypeFragmentType } from './index.js';

describe('JSONSchema', () => {
  describe('JSONSchema fragments', () => {
    describe('Not fragment', () => {
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
