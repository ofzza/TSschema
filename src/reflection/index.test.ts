import { describe, it, expect } from 'vitest';
import { JSONSchemaCollectionFragmentReflect } from '.';
import { default as jsonSchema } from '../../res/sidecar/schema.json';

describe('JSONSchemaCollectionFragmentReflect', () => {
  it('debugs', () => {
    const Reflect = new JSONSchemaCollectionFragmentReflect(jsonSchema);
    const Assessment = Reflect.fragment('Assessment')[0];
    type TAssessment = typeof Assessment.Type;
    const Class = Reflect.fragment('Class')[0];
    type TClass = typeof Class.Type;
    const fragmentNames = Reflect.names;
  });
});
