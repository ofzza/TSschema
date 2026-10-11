import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality } from '@ofzza/tsstd';
import * as Reflection from './index.js';
import * as JSONSchemaReflection from './JSONSchema/index.js';

import { default as jsonSchema } from '../../res/sidecar/schema.json';

describe('Reflection', () => {
  describe('Module entry', () => {
    it('Re-exports the JSON schema fragment reflections', () => {
      expect(Object.keys(Reflection).sort()).toEqual(Object.keys(JSONSchemaReflection).sort());
      expect(Reflection.JSONSchemaCollectionFragmentReflect).toBe(JSONSchemaReflection.JSONSchemaCollectionFragmentReflect);
    });

    it('Reflects a collection through the module entry', () => {
      const collection = new Reflection.JSONSchemaCollectionFragmentReflect(jsonSchema);
      const assessment = collection.fragment('Assessment')[0];
      expect(assessment).toBeInstanceOf(Reflection.JSONSchemaModelFragmentReflect);
      expect(true satisfies AssertTypeEquality<(typeof assessment.Type)['weight'], number>).toBe(true);
    });
  });
});
