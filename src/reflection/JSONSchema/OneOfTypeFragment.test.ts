import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality } from '@ofzza/tsstd';
import {
  JSONSchemaCollectionFragmentReflect,
  JSONSchemaConstFragmentReflect,
  JSONSchemaOneOfTypeFragmentReflect,
  JSONSchemaPrimitiveTypeFragmentReflect,
} from './index.js';

import { default as jsonSchema } from '../../../res/sidecar/schema.json';

describe('Reflection', () => {
  describe('JSONSchema fragment reflections', () => {
    describe('OneOf Type fragment', () => {
      it('Detects a one-of-types', () => {
        expect(JSONSchemaOneOfTypeFragmentReflect.check({ oneOf: [{ type: 'string' }] })).toBe(true);
        expect(JSONSchemaOneOfTypeFragmentReflect.check(jsonSchema.$defs.AssessmentKind)).toBe(true);
      });

      it('Rejects a non-one-of-types', () => {
        expect(JSONSchemaOneOfTypeFragmentReflect.check({ anyOf: [{ type: 'string' }] })).toBe(false);
        expect(JSONSchemaOneOfTypeFragmentReflect.check({ oneOf: { type: 'string' } } as any)).toBe(false);
      });

      it('Reflects each fragment of a one-of-types, in order', () => {
        const kind = new JSONSchemaCollectionFragmentReflect(jsonSchema).fragment('AssessmentKind');
        expect(kind.map((reflection) => reflection.constructor)).toEqual([JSONSchemaPrimitiveTypeFragmentReflect, JSONSchemaOneOfTypeFragmentReflect]);
        const oneOf = kind[1];
        if (!(oneOf instanceof JSONSchemaOneOfTypeFragmentReflect)) throw new Error('Expected a one-of-types reflection');
        expect(oneOf.oneOf.length).toBe(8);
        expect(oneOf.oneOf.every(([member]) => member instanceof JSONSchemaConstFragmentReflect)).toBe(true);
        expect(oneOf.oneOf[2][0].const).toBe(2);
        expect(true satisfies AssertTypeEquality<(typeof oneOf.oneOf)[2][0]['const'], 2>).toBe(true);
      });

      it('Infers no constraint from a one-of-types, as it is not supported yet', () => {
        const collection = new JSONSchemaCollectionFragmentReflect({ $defs: { A: { oneOf: [{ type: 'string' }, { type: 'number' }] } } } as const);
        const _a = collection.fragment('A')[0];
        expect(true satisfies AssertTypeEquality<typeof _a.Type, unknown>).toBe(true);
      });
    });
  });
});
