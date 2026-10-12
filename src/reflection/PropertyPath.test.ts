import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality } from '@ofzza/tsstd';
import type { JSONSchemaCollection, JSONSchemaFragmentType } from '../schema/JSONSchema/index.js';
import { JSONSchemaModelFragmentFacet, createJSONSchemaFragmentFacets, parseJSONSchemaCollection } from './JSONSchema/index.js';
import {
  JSONSchemaUnknownShapeFragment,
  getJSONSchemaPropertyMatches,
  getJSONSchemaPropertyShapes,
  getJSONSchemaPropertyShapesNames,
  hasJSONSchemaPropertyShapesName,
  isJSONSchemaUnknownShapeFragment,
  type JSONSchemaPropertyFragment,
  type JSONSchemaReachablePropertyName,
  type JSONSchemaPropertyShapeIsUnknown,
} from './PropertyPath.js';

/**
 * Schema collection reaching models in every supported way
 */
const _schema = {
  $defs: {
    Cat: { type: 'object', properties: { name: { type: 'string' }, lives: { type: 'integer' } }, required: ['name', 'lives'] },
    Dog: { type: 'object', properties: { name: { type: 'string' }, good: { type: 'boolean' } }, required: ['good'] },
    Pet: { anyOf: [{ $ref: '#/$defs/Cat' }, { $ref: '#/$defs/Dog' }] },
    Pets: { type: 'array', items: { $ref: '#/$defs/Pet' } },
    Loop: { oneOf: [{ $ref: '#/$defs/Loop' }, { $ref: '#/$defs/Cat' }] },
    Both: { allOf: [{ $ref: '#/$defs/Cat' }, { $ref: '#/$defs/Cat' }] },
    Maybe: { type: ['object', 'null'], properties: { value: { type: 'number' } } },
    Bag: { type: 'object' },
    Tuple: { type: 'array', items: [{ type: 'string' }] },
    Unresolved: { $ref: '#/$defs/Missing' },
    Flag: { type: 'object', properties: { any: true } },
  },
} as const;
type _Schema = typeof _schema;

/**
 * Gets the shapes reachable from a definition of the collection above
 */
function _shapes(name: keyof _Schema['$defs']) {
  return getJSONSchemaPropertyShapes(parseJSONSchemaCollection(_schema).$defs[name]);
}

describe('Reflection', () => {
  // Property lookup over facets (PropertyPath.ts), the runtime walk the reflections' propertyNames and getProperty are built on, next to its type-level mirror.
  // Each runtime result is asserted side by side with what the mirror infers for the same fragment, as the two must stay in step (see AGENTS.md › getProperty
  // resolves like TSSchemaProperty, with deliberate differences).
  describe('Property paths', () => {
    // From the marker of an unknown shape, through the shapes reachable from a fragment, to the properties matched in them by name.
    describe('Unknown shape fragment', () => {
      // JSONSchemaUnknownShapeFragment, the fragment of a property found in a shape which is not known, marked by its `$comment` so that the property is of
      // unknown shape itself. Checked by its guard, and by parsing it and inferring its value type, as it must constrain nothing.
      it('Marks a property of unknown shape by its $comment', () => {
        // A copy is recognised too: the marker is the `$comment` value, not the frozen instance.
        expect(isJSONSchemaUnknownShapeFragment(JSONSchemaUnknownShapeFragment)).toBe(true);
        expect(isJSONSchemaUnknownShapeFragment({ ...JSONSchemaUnknownShapeFragment })).toBe(true);
        expect(isJSONSchemaUnknownShapeFragment({})).toBe(false);
        expect(isJSONSchemaUnknownShapeFragment(true)).toBe(false);
      });

      it('Infers no facets and an unknown value type', () => {
        expect(createJSONSchemaFragmentFacets(JSONSchemaUnknownShapeFragment)).toEqual([]);
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentType<JSONSchemaUnknownShapeFragment>, unknown>).toBe(true);
      });
    });

    describe('Shapes', () => {
      // getJSONSchemaPropertyShapes, the runtime walk to every model reachable from a fragment, next to its type-level mirrors JSONSchemaReachablePropertyName
      // and JSONSchemaPropertyShapeIsUnknown. Each case parses a definition of the `_schema` collection above (built to reach models in every supported way)
      // and asserts the runtime shapes or names and the inferred ones side by side.
      it('Reaches a model directly', () => {
        const shapes = _shapes('Cat');
        expect(shapes.length).toBe(1);
        expect(shapes[0]).toBeInstanceOf(JSONSchemaModelFragmentFacet);
        expect(true satisfies AssertTypeEquality<JSONSchemaReachablePropertyName<_Schema['$defs']['Cat'], _Schema>, 'name' | 'lives'>).toBe(true);
      });

      it('Reaches models through references and anyOf members', () => {
        expect(getJSONSchemaPropertyShapesNames(_shapes('Pet'))).toEqual(['name', 'lives', 'good']);
        expect(true satisfies AssertTypeEquality<JSONSchemaReachablePropertyName<_Schema['$defs']['Pet'], _Schema>, 'name' | 'lives' | 'good'>).toBe(true);
      });

      it('Reaches models through the items of an array', () => {
        expect(getJSONSchemaPropertyShapesNames(_shapes('Pets'))).toEqual(['name', 'lives', 'good']);
        expect(true satisfies AssertTypeEquality<JSONSchemaReachablePropertyName<_Schema['$defs']['Pets'], _Schema>, 'name' | 'lives' | 'good'>).toBe(true);
      });

      it('Reaches each model once, terminating on recursive references', () => {
        // `Loop` refers to itself, so a walk that does not track visited facets would never end; `Both` reaches `Cat` twice through its `allOf`, yet it is one
        // shape.
        expect(_shapes('Loop').length).toBe(1);
        expect(_shapes('Both').length).toBe(1);
        expect(true satisfies AssertTypeEquality<JSONSchemaReachablePropertyName<_Schema['$defs']['Loop'], _Schema>, 'name' | 'lives'>).toBe(true);
      });

      it('Reaches the model of a nullable model', () => {
        // `Maybe`'s type array is split into branches held by an implicit `anyOf` facet, whose `object` branch is the model (see AGENTS.md › A type array
        // naming object, array and / or null is split into a union of branches).
        expect(getJSONSchemaPropertyShapesNames(_shapes('Maybe'))).toEqual(['value']);
        expect(true satisfies AssertTypeEquality<JSONSchemaReachablePropertyName<_Schema['$defs']['Maybe'], _Schema>, 'value'>).toBe(true);
      });

      it('Reaches an unknown shape from an object with no properties, an array with no single schema items, and an unresolved reference', () => {
        // An unknown shape is a single `undefined` among the shapes. `Pet` reaches models only, as a counter-check.
        for (const name of ['Bag', 'Tuple', 'Unresolved'] as const) expect(_shapes(name)).toEqual([undefined]);
        expect(true satisfies AssertTypeEquality<JSONSchemaPropertyShapeIsUnknown<_Schema['$defs']['Bag'], _Schema>, true>).toBe(true);
        expect(true satisfies AssertTypeEquality<JSONSchemaPropertyShapeIsUnknown<_Schema['$defs']['Tuple'], _Schema>, true>).toBe(true);
        expect(true satisfies AssertTypeEquality<JSONSchemaPropertyShapeIsUnknown<_Schema['$defs']['Unresolved'], _Schema>, true>).toBe(true);
        expect(true satisfies AssertTypeEquality<JSONSchemaPropertyShapeIsUnknown<_Schema['$defs']['Pet'], _Schema>, false>).toBe(true);
      });

      it('Reaches an unknown shape from any reference when no collection is known', () => {
        // Parsed with no collection, the `$ref` has nothing to resolve against; at type level the unspecified collection stands for the same (see AGENTS.md ›
        // The collection facet is also what every $ref resolves against).
        const shapes = getJSONSchemaPropertyShapes(createJSONSchemaFragmentFacets({ $ref: '#/$defs/Cat' } as const));
        expect(shapes).toEqual([undefined]);
        expect(true satisfies AssertTypeEquality<JSONSchemaPropertyShapeIsUnknown<{ readonly $ref: '#/$defs/Cat' }, JSONSchemaCollection>, true>).toBe(true);
      });

      it('Reaches an unknown shape from a property of unknown shape', () => {
        // A property of unknown shape has no facets, so the `unknown` flag is what keeps any name addressable below it.
        expect(getJSONSchemaPropertyShapes([], true)).toEqual([undefined]);
        expect(true satisfies AssertTypeEquality<JSONSchemaPropertyShapeIsUnknown<JSONSchemaUnknownShapeFragment, _Schema>, true>).toBe(true);
      });
    });

    describe('Matches', () => {
      // getJSONSchemaPropertyMatches and hasJSONSchemaPropertyShapesName over the shapes of a `_schema` definition, next to the type-level mirror
      // JSONSchemaPropertyFragment, the fragment a property found by name infers. Only exact names match here: splitting a path is up to the reflection.
      it('Finds a property by its exact name in every model defining it', () => {
        // `Cat` and `Dog` both define `name`, but only `Cat` requires it. Found twice, it infers an implicit `anyOf`, checked by its inferred value type rather
        // than compared, as its member union holds structurally identical members (see AGENTS.md › A property found in several models is one reflection holding
        // a fresh implicit anyOf facet).
        const shapes = _shapes('Pet');
        expect(hasJSONSchemaPropertyShapesName(shapes, 'name')).toBe(true);
        expect(hasJSONSchemaPropertyShapesName(shapes, 'name.length')).toBe(false);
        const matches = getJSONSchemaPropertyMatches(shapes, 'name');
        expect(matches.map((match) => match.fragment)).toEqual([{ type: 'string' }, { type: 'string' }]);
        expect(matches.map((match) => match.required)).toEqual([true, false]);
        type Name = JSONSchemaPropertyFragment<_Schema['$defs']['Pet'], _Schema, 'name'>;
        expect(true satisfies AssertTypeEquality<'anyOf' extends keyof Name ? true : false, true>).toBe(true);
        expect(true satisfies AssertTypeEquality<JSONSchemaFragmentType<Name, _Schema>, string>).toBe(true);
      });

      it('Infers the fragment of a property found once as is', () => {
        expect(getJSONSchemaPropertyMatches(_shapes('Pet'), 'lives').length).toBe(1);
        expect(true satisfies AssertTypeEquality<JSONSchemaPropertyFragment<_Schema['$defs']['Pet'], _Schema, 'lives'>, { readonly type: 'integer' }>).toBe(
          true,
        );
      });

      it('Finds no property by a name no model defines', () => {
        expect(getJSONSchemaPropertyMatches(_shapes('Pet'), 'nope')).toEqual([]);
        expect(true satisfies AssertTypeEquality<JSONSchemaPropertyFragment<_Schema['$defs']['Pet'], _Schema, 'nope'>, never>).toBe(true);
      });

      it('Finds a property of unknown shape by any non empty name in an unknown shape', () => {
        expect(getJSONSchemaPropertyMatches(_shapes('Bag'), 'x')).toEqual([{ fragment: JSONSchemaUnknownShapeFragment, facets: [], required: false }]);
        expect(getJSONSchemaPropertyMatches(_shapes('Bag'), '')).toEqual([]);
        expect(true satisfies AssertTypeEquality<JSONSchemaPropertyFragment<_Schema['$defs']['Bag'], _Schema, 'x'>, JSONSchemaUnknownShapeFragment>).toBe(true);
        expect(true satisfies AssertTypeEquality<JSONSchemaPropertyFragment<_Schema['$defs']['Bag'], _Schema, ''>, never>).toBe(true);
      });

      it('Infers a boolean schema property as the empty schema', () => {
        // At runtime the fragment stays as declared (`true`, parsing into no facets); at type level it infers `{}`, which is just as unconstrained.
        const [match] = getJSONSchemaPropertyMatches(_shapes('Flag'), 'any');
        expect(match.fragment).toBe(true);
        expect(match.facets).toEqual([]);
        expect(true satisfies AssertTypeEquality<JSONSchemaPropertyFragment<_Schema['$defs']['Flag'], _Schema, 'any'>, {}>).toBe(true);
      });
    });
  });
});
