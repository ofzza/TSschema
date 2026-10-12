import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality } from '@ofzza/tsstd';
import { JSONSchemaCollectionFragmentNode, JSONSchemaNotTypeFragmentNode, JSONSchemaNullTypeFragmentNode } from './index.js';

/**
 * Small collection, used in the tests below
 */
const _schema = { $defs: { Something: { not: { type: 'null' } } } } as const;
type _Schema = typeof _schema;

describe('Reflection', () => {
  describe('JSONSchema fragment nodes', () => {
    describe('Not Type fragment', () => {
      it('Detects a not-type', () => {
        expect(JSONSchemaNotTypeFragmentNode.is({ not: { type: 'null' } })).toBe(true);
        expect(JSONSchemaNotTypeFragmentNode.is({ not: {} })).toBe(true);
      });

      it('Rejects a non-not-type, including a boolean schema not', () => {
        expect(JSONSchemaNotTypeFragmentNode.is({ type: 'null' })).toBe(false);
        expect(JSONSchemaNotTypeFragmentNode.is({ not: true } as any)).toBe(false);
        expect(JSONSchemaNotTypeFragmentNode.is({ not: [] } as any)).toBe(false);
      });

      it('Parses the fragment of a not-type', () => {
        const something = new JSONSchemaCollectionFragmentNode(_schema).$defs.Something[0];
        expect(something).toBeInstanceOf(JSONSchemaNotTypeFragmentNode);
        expect(something.not[0]).toBeInstanceOf(JSONSchemaNullTypeFragmentNode);
        expect(
          true satisfies AssertTypeEquality<typeof something.not, Array<JSONSchemaNullTypeFragmentNode<_Schema, undefined, { readonly type: 'null' }>>>,
        ).toBe(true);
      });

      it('Infers no constraint from a not-type, as it is not supported yet', () => {
        const _something = new JSONSchemaCollectionFragmentNode(_schema).$defs.Something[0];
        expect(true satisfies AssertTypeEquality<typeof _something.Type, unknown>).toBe(true);
      });
    });
  });
});
