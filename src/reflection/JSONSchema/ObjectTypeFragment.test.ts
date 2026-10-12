import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality } from '@ofzza/tsstd';
import { JSONSchemaCollectionFragmentNode, JSONSchemaObjectTypeFragmentNode } from './index.js';

/**
 * Small collection, used in the tests below
 */
const _schema = { $defs: { Anything: { type: 'object' } } } as const;
type _Schema = typeof _schema;

describe('Reflection', () => {
  describe('JSONSchema fragment nodes', () => {
    describe('Object Type fragment', () => {
      it('Detects an object type', () => {
        expect(JSONSchemaObjectTypeFragmentNode.is({ type: 'object' })).toBe(true);
      });

      it('Rejects a non-object type, or a model', () => {
        expect(JSONSchemaObjectTypeFragmentNode.is({ type: 'array' })).toBe(false);
        expect(JSONSchemaObjectTypeFragmentNode.is({ type: 'object', properties: {} })).toBe(false);
      });

      it('Parses an object type', () => {
        const anything = new JSONSchemaCollectionFragmentNode(_schema).$defs.Anything[0];
        expect(anything).toBeInstanceOf(JSONSchemaObjectTypeFragmentNode);
        expect(anything.type).toBe('object');
        expect(true satisfies AssertTypeEquality<typeof anything, JSONSchemaObjectTypeFragmentNode<_Schema, 'Anything', _Schema['$defs']['Anything']>>).toBe(
          true,
        );
      });

      it('Infers the type of an object type', () => {
        const _anything = new JSONSchemaCollectionFragmentNode(_schema).$defs.Anything[0];
        expect(true satisfies AssertTypeEquality<typeof _anything.Type, object>).toBe(true);
      });
    });
  });
});
