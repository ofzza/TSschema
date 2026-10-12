import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality } from '@ofzza/tsstd';
import * as JSONSchemaFacets from './JSONSchema/index.js';

import { default as jsonSchema } from '../../res/sidecar/schema.json';

describe('Reflection', () => {
  describe('Module entry', () => {
    it('Re-exports the JSON schema fragment facets', () => {
      expect(Object.keys(JSONSchemaFacets).sort()).toEqual(Object.keys(JSONSchemaFacets).sort());
      expect(JSONSchemaFacets.JSONSchemaCollectionFragmentFacet).toBe(JSONSchemaFacets.JSONSchemaCollectionFragmentFacet);
    });

    it('Parses a collection through the module entry', () => {
      const collection = JSONSchemaFacets.parseJSONSchemaCollection(jsonSchema);
      expect(collection).toBeInstanceOf(JSONSchemaFacets.JSONSchemaCollectionFragmentFacet);
      const assessment = collection.$defs.Assessment[0];
      expect(assessment).toBeInstanceOf(JSONSchemaFacets.JSONSchemaModelFragmentFacet);
      expect(true satisfies AssertTypeEquality<(typeof assessment.Type)['weight'], number>).toBe(true);
    });
  });
});
