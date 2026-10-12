/**
 * Showcase of the internal runtime reflection module entry (`src/reflection/index.ts`). Never public: meant for understanding the inner workings of the
 * library before changing them (see CONTRIBUTE.md).
 *
 * The module entry re-exports the JSON schema fragment facets, showcased in depth in `./JSONSchema/_showcase.test.ts`, and the TSSchema* reflection
 * classes wrapping them (`./TSSchemaReflection.ts`): `reflect` reflects a schema's root, from which its definitions and their properties are reflected,
 * each reflection holding all facets its fragment was parsed into. The package's main entry exports `reflect` and the reflection classes (as types
 * only), showcased for consumers in `src/_showcase.test.ts`; this file shows them together with the facets they hold.
 *
 * - Hover any `// ^?` comment in an editor with twoslash query support (VS Code: the recommended `orta.vscode-twoslash-queries` extension) to see the
 *   type inferred for the identifier above it. Every `// ^?` is followed by a plain comment stating the same type, for editors without it.
 * - Runtime results are assigned to named constants, each followed by a `// Breakpoint:` comment.
 */

import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality } from '@ofzza/tsstd';
import { JSONSchemaModelFragmentFacet, TSSchemaDefinitionReflection, TSSchemaPropertyReflection, parseJSONSchemaCollection, reflect } from './index.js';

import { default as jsonSchema } from '../../res/sidecar/schema.json';

describe('Showcase', () => {
  describe('Runtime reflection', () => {
    it('Parses a JSON schema collection through the module entry', () => {
      // A schema kept in a JSON file works as well as one declared `as const`, once a `tsschema` generated sidecar types it
      const collection = parseJSONSchemaCollection(jsonSchema);
      // Breakpoint: inspect `collection`, holding the facets of every fragment of the fixture schema
      expect(collection.names).toContain('Assessment');

      const assessment = collection.$defs.Assessment[0];
      // Breakpoint: inspect `assessment`, a model facet, and its `properties`
      expect(assessment).toBeInstanceOf(JSONSchemaModelFragmentFacet);
      type Assessment = typeof assessment.Type;
      //   ^?
      // Assessment: { id: string; kind: number; title: string; weight: number; … }
      expect(true satisfies AssertTypeEquality<Assessment['weight'], number>).toBe(true);
    });

    it('Reflects a schema, its definitions and their properties', () => {
      // `reflect` reflects the schema's root; a collection's root holds the collection as the collection its definitions are reflected from
      const root = reflect(jsonSchema);
      // Breakpoint: inspect `root`, with no facets of its own (the fixture's root only holds annotations), and its `collection`
      expect(root.definitionNames).toContain('Class');

      const course = root.getDefinition('Class');
      // Breakpoint: inspect `course`, a definition reflection holding the facets of the `Class` definition
      expect(course).toBeInstanceOf(TSSchemaDefinitionReflection);
      type CourseName = typeof course.name;
      //   ^?
      // CourseName: 'Class'
      expect(true satisfies AssertTypeEquality<CourseName, 'Class'>).toBe(true);

      // Properties are looked up through `$ref`s, `anyOf` / `oneOf` / `allOf` members (here a nullable `Person`) and array items, by key or path
      const email = course.getProperty('professor.email');
      // Breakpoint: inspect `email`, its `parent` (the `professor` property) and its `parent.parent` (`course`)
      expect(email).toBeInstanceOf(TSSchemaPropertyReflection);
      expect(email.parent.parent).toBe(course);
      expect([email.parent.required, email.required]).toEqual([false, true]);
      type Email = typeof email.Type;
      //   ^?
      // Email: string
      expect(true satisfies AssertTypeEquality<Email, string>).toBe(true);
    });

    it('Reflects a property found in several models as one', () => {
      const schema = {
        $defs: {
          Cat: { type: 'object', properties: { name: { type: 'string' }, lives: { type: 'integer' } }, required: ['name', 'lives'] },
          Dog: { type: 'object', properties: { name: { type: 'string' } } },
          Pet: { anyOf: [{ $ref: '#/$defs/Cat' }, { $ref: '#/$defs/Dog' }] },
        },
      } as const;
      // Both members of `Pet` define `name`: it is reflected as one property, holding an implicit `anyOf` of both fragments, and is required only if
      // both models require it
      const name = reflect(schema).getDefinition('Pet').getProperty('name');
      // Breakpoint: inspect `name`, and its single (implicit) any-of-types facet
      expect(name.required).toBe(false);
      type Name = typeof name.Type;
      //   ^?
      // Name: string
      expect(true satisfies AssertTypeEquality<Name, string>).toBe(true);
    });
  });
});
