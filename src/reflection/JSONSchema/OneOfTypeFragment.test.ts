import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality } from '@ofzza/tsstd';
import {
  JSONSchemaCollectionFragmentNode,
  JSONSchemaConstFragmentNode,
  JSONSchemaOneOfTypeFragmentNode,
  JSONSchemaPrimitiveTypeFragmentNode,
} from './index.js';

import { default as jsonSchema } from '../../../res/sidecar/schema.json';

describe('Reflection', () => {
  describe('JSONSchema fragment nodes', () => {
    describe('OneOf Type fragment', () => {
      it('Detects a one-of-types', () => {
        expect(JSONSchemaOneOfTypeFragmentNode.is({ oneOf: [{ type: 'string' }] })).toBe(true);
        expect(JSONSchemaOneOfTypeFragmentNode.is(jsonSchema.$defs.AssessmentKind)).toBe(true);
      });

      it('Rejects a non-one-of-types', () => {
        expect(JSONSchemaOneOfTypeFragmentNode.is({ anyOf: [{ type: 'string' }] })).toBe(false);
        expect(JSONSchemaOneOfTypeFragmentNode.is({ oneOf: { type: 'string' } } as any)).toBe(false);
      });

      it('Parses each fragment of a one-of-types, in order', () => {
        const kind = new JSONSchemaCollectionFragmentNode(jsonSchema).$defs.AssessmentKind;
        expect(kind.map((node) => node.constructor)).toEqual([JSONSchemaPrimitiveTypeFragmentNode, JSONSchemaOneOfTypeFragmentNode]);
        const oneOf = kind[1];
        if (!(oneOf instanceof JSONSchemaOneOfTypeFragmentNode)) throw new Error('Expected a one-of-types node');
        expect(oneOf.oneOf.length).toBe(8);
        expect(oneOf.oneOf.every(([member]) => member instanceof JSONSchemaConstFragmentNode)).toBe(true);
        expect(oneOf.oneOf[2][0].const).toBe(2);
        expect(true satisfies AssertTypeEquality<(typeof oneOf.oneOf)[2][0]['const'], 2>).toBe(true);
      });

      it('Infers the type of a one-of-types', () => {
        const collection = new JSONSchemaCollectionFragmentNode({ $defs: { A: { oneOf: [{ type: 'string' }, { type: 'number' }] } } } as const);
        const _a = collection.$defs.A[0];
        expect(true satisfies AssertTypeEquality<typeof _a.Type, string | number>).toBe(true);
        const _kind = new JSONSchemaCollectionFragmentNode(jsonSchema).$defs.AssessmentKind[1];
        expect(true satisfies AssertTypeEquality<typeof _kind.Type, 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7>).toBe(true);
      });
    });
  });
});
