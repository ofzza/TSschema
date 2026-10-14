/**
 * Showcase of the internal runtime reflection module entry (`src/reflection/index.ts`). Never public: meant for understanding the inner workings of the
 * library before changing them (see CONTRIBUTE.md).
 *
 * The module entry re-exports the JSON schema fragment facets, showcased in depth in `./JSONSchema/_showcase.test.ts`, and the TSSchema* reflection
 * classes wrapping them (`./TSSchemaReflection.ts`): `reflect` reflects a schema's root, from which its definitions and their properties are reflected,
 * each reflection holding all facets its fragment was parsed into, describing its type by a type descriptor built from them (`./TypeDescriptor.ts`), with
 * the validation keywords its facets parsed as constraints, and reading the annotations of its own fragment (`./Annotations.ts`). The package's main entry
 * exports `reflect`, and the reflection classes, descriptors and annotations as types only, showcased for consumers in `src/_showcase.test.ts`; this file
 * shows them together with the facets they hold.
 *
 * - Hover any `// ^?` comment in an editor with twoslash query support (VS Code: the recommended `orta.vscode-twoslash-queries` extension) to see the
 *   type inferred for the identifier above it. Every `// ^?` is followed by a plain comment stating the same type, for editors without it.
 * - Runtime results are assigned to named constants, each followed by a `// Breakpoint:` comment.
 */

import { describe, it, expect } from 'vitest';
import type { AssertTypeEquality } from '@ofzza/tsstd';
import {
  JSONSchemaModelFragmentFacet,
  JSONSchemaPrimitiveTypeFragmentFacet,
  TSSchemaDefinitionReflection,
  TSSchemaPropertyReflection,
  getTSSchemaTypeDescriptor,
  parseJSONSchemaCollection,
  reflect,
} from './index.js';

import { default as jsonSchema } from '../../res/sidecar/schema.json';

describe('Showcase', () => {
  // The runtime reflection module, walked through on the res/sidecar/schema.json fixture (and a small inline collection where the fixture has no fitting case).
  // Each runtime result is asserted with `expect`, and each inferred type by an `AssertTypeEquality` next to its `// ^?` query.
  describe('Runtime reflection', () => {
    // From parsing a collection into facets, through reflecting it, to describing a reflection's type.
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
      // Breakpoint: inspect `email`, its `parent` (the `professor` property) and its `parent.parent` (`course`). Being required and being nullable are
      // independent: `professor` is required yet nullable, `email` is optional and nullable
      expect(email).toBeInstanceOf(TSSchemaPropertyReflection);
      expect(email.parent.parent).toBe(course);
      expect([email.parent.required, email.required]).toEqual([true, false]);
      type Email = typeof email.Type;
      //   ^?
      // Email: string | null
      expect(true satisfies AssertTypeEquality<Email, string | null>).toBe(true);
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

    it('Describes the type of a reflection, built from its facets', () => {
      // A `oneOf` of `const` fragments with `title`s (the fixture's enums, as generated from .NET) is described as an enum, named by the titles
      const kind = reflect(jsonSchema).getDefinition('Assessment').getProperty('kind').typeDescriptor.target;
      // Breakpoint: inspect `kind`, an enum descriptor built from the `AssessmentKind` definition's primitive type and oneOf facets
      expect(kind.kind).toBe('enum');
      type KindNames = (typeof kind.names)[number];
      //   ^?
      // KindNames: 'Quiz' | 'MidtermExam' | 'FinalExam' | 'Essay' | 'LabReport' | 'Practical' | 'OralDefence' | 'GroupProject'
      expect(
        true satisfies AssertTypeEquality<
          KindNames,
          'Quiz' | 'MidtermExam' | 'FinalExam' | 'Essay' | 'LabReport' | 'Practical' | 'OralDefence' | 'GroupProject'
        >,
      ).toBe(true);

      // Descriptors are built once per facets array, so a definition and every reference to it share one descriptor
      const facets = parseJSONSchemaCollection(jsonSchema).$defs.AssessmentKind;
      const described = getTSSchemaTypeDescriptor(facets);
      // Breakpoint: inspect `described`, the same descriptor on every call with the same facets
      expect(getTSSchemaTypeDescriptor(facets)).toBe(described);
    });

    it('Describes constraints from the facets, and reads annotations from the fragment', () => {
      // The fixture's validation keywords, annotations and `x-decorators` are generated from .NET attributes by the sibling dotnetschema project. `latitude`
      // was decorated with `[Range(-90, 90)]`, written both as `minimum` / `maximum` and as a decorator.
      const latitude = reflect(jsonSchema).getDefinition('Address').getProperty('latitude');
      const facet = latitude.facets[0];
      // Breakpoint: inspect `facet`, a primitive type facet parsing every validation keyword of numbers and strings
      expect(facet).toBeInstanceOf(JSONSchemaPrimitiveTypeFragmentFacet);
      const constraints = latitude.typeDescriptor.constraints;
      // Breakpoint: inspect `constraints`, only those of a number, taken from the facet
      expect(constraints).toEqual({ minimum: -90, maximum: 90 });
      type Constraints = typeof constraints;
      //   ^?
      // Constraints: { readonly minimum: -90; readonly maximum: 90; readonly exclusiveMinimum: undefined; readonly exclusiveMaximum: undefined; … }
      expect(true satisfies AssertTypeEquality<Constraints['maximum'], 90>).toBe(true);

      const decorators = latitude.decorators;
      // Breakpoint: inspect `decorators`, read from the property's own fragment (annotations have no facets)
      expect(decorators[0].arguments).toEqual({ minimum: -90, maximum: 90 });
      type DecoratorName = (typeof decorators)[0]['name'];
      //   ^?
      // DecoratorName: 'System.ComponentModel.DataAnnotations.RangeAttribute'
      expect(true satisfies AssertTypeEquality<DecoratorName, 'System.ComponentModel.DataAnnotations.RangeAttribute'>).toBe(true);
    });
  });
});
