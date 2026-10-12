import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality } from '@ofzza/tsstd';
import { JSONSchemaCollectionFragmentNode, JSONSchemaNullTypeFragmentNode } from './index.js';

/**
 * Small collection, used in the tests below
 */
const _schema = { $defs: { Nothing: { type: 'null' } } } as const;
type _Schema = typeof _schema;

describe('Reflection', () => {
  describe('JSONSchema fragment nodes', () => {
    describe('Null Type fragment', () => {
      it('Detects a null type', () => {
        expect(JSONSchemaNullTypeFragmentNode.is({ type: 'null' })).toBe(true);
      });

      it('Rejects a non-null type', () => {
        expect(JSONSchemaNullTypeFragmentNode.is({ type: 'string' })).toBe(false);
        expect(JSONSchemaNullTypeFragmentNode.is({ const: null })).toBe(false);
        // A type array naming null is split into branches by the router, before any node type checks it
        expect(JSONSchemaNullTypeFragmentNode.is({ type: ['null'] })).toBe(false);
      });

      it('Parses a null type', () => {
        const nothing = new JSONSchemaCollectionFragmentNode(_schema).$defs.Nothing[0];
        expect(nothing).toBeInstanceOf(JSONSchemaNullTypeFragmentNode);
        expect(nothing.type).toBe('null');
        expect(true satisfies AssertTypeEquality<typeof nothing, JSONSchemaNullTypeFragmentNode<_Schema, 'Nothing', _Schema['$defs']['Nothing']>>).toBe(true);
      });

      it('Infers the type of a null type', () => {
        const _nothing = new JSONSchemaCollectionFragmentNode(_schema).$defs.Nothing[0];
        expect(true satisfies AssertTypeEquality<typeof _nothing.Type, null>).toBe(true);
      });
    });
  });
});
