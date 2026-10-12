import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality } from '@ofzza/tsstd';
import * as Reflection from './index.js';
import * as JSONSchemaFacets from './JSONSchema/index.js';

import { default as jsonSchema } from '../../res/sidecar/schema.json';

describe('Reflection', () => {
  // The reflection module barrel (src/reflection/index.ts), through which src/index.ts re-exports the public reflection names. Checked at runtime by
  // comparing its exports with the facets', and at type level by the inferred value type of a facet parsed through it from the res/sidecar/schema.json
  // fixture.
  describe('Module entry', () => {
    // The facets must be re-exported by identity, and keep their static types when reached through the barrel.
    it('Re-exports the JSON schema fragment facets', () => {
      expect(Object.keys(Reflection)).toEqual(expect.arrayContaining(Object.keys(JSONSchemaFacets)));
      expect(Reflection.JSONSchemaCollectionFragmentFacet).toBe(JSONSchemaFacets.JSONSchemaCollectionFragmentFacet);
    });

    it('Parses a collection through the module entry', () => {
      const collection = Reflection.parseJSONSchemaCollection(jsonSchema);
      expect(collection).toBeInstanceOf(JSONSchemaFacets.JSONSchemaCollectionFragmentFacet);
      const assessment = collection.$defs.Assessment[0];
      expect(assessment).toBeInstanceOf(JSONSchemaFacets.JSONSchemaModelFragmentFacet);
      expect(true satisfies AssertTypeEquality<(typeof assessment.Type)['weight'], number>).toBe(true);
    });
  });
});
