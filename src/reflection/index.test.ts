import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality } from '@ofzza/tsstd';
import * as Reflection from './index.js';
import * as JSONSchemaNodes from './JSONSchema/index.js';

import { default as jsonSchema } from '../../res/sidecar/schema.json';

describe('Reflection', () => {
  describe('Module entry', () => {
    it('Re-exports the JSON schema fragment nodes', () => {
      expect(Object.keys(Reflection).sort()).toEqual(Object.keys(JSONSchemaNodes).sort());
      expect(Reflection.JSONSchemaCollectionFragmentNode).toBe(JSONSchemaNodes.JSONSchemaCollectionFragmentNode);
    });

    it('Parses a collection through the module entry', () => {
      const collection = Reflection.parseJSONSchemaCollection(jsonSchema);
      expect(collection).toBeInstanceOf(Reflection.JSONSchemaCollectionFragmentNode);
      const assessment = collection.$defs.Assessment[0];
      expect(assessment).toBeInstanceOf(Reflection.JSONSchemaModelFragmentNode);
      expect(true satisfies AssertTypeEquality<(typeof assessment.Type)['weight'], number>).toBe(true);
    });
  });
});
