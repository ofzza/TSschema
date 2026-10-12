/**
 * Showcase of the internals of the TSSchema wrapper types: the wrapper shapes the public `TSSchemaCollection` / `TSSchemaFragment` / `TSSchemaProperty`
 * produce, how they nest, and the per-module name and value type utilities `TSSchemaName` / `TSSchemaType` dispatch to. Never public: meant for
 * understanding the inner workings of the library before changing them (see CONTRIBUTE.md). For the public API, see `src/_showcase.test.ts`.
 *
 * - Hover any `// ^?` comment in an editor with twoslash query support (VS Code: the recommended `orta.vscode-twoslash-queries` extension) to see the
 *   type inferred for the identifier above it. Every `// ^?` is followed by a plain comment stating the same type, for editors without it.
 * - Every claim is asserted with `AssertTypeEquality`, so this file fails `npm test` the moment the wrappers stop behaving as shown.
 * - This layer is type-only, so there is little to see at runtime; the few runtime values are each followed by a `// Breakpoint:` comment.
 */

import { describe, it, expect } from 'vitest';
import type { AssertTypeAssignable, AssertTypeEquality } from '@ofzza/tsstd';
import type { JSONSchemaCollectionWrapper, TSSchemaCollection, TSSchemaFragmentName, UnwrapJSONSchemaCollectionWrapper } from './TSSchemaCollection.js';
import type {
  JSONSchemaFragmentWrapper,
  TSSchemaFragment,
  TSSchemaFragmentPropertyName,
  TSSchemaFragmentType,
  UnwrapJSONSchemaFragmentWrapper,
} from './TSSchemaFragment.js';
import type { JSONSchemaModelPropertyWrapper, TSSchemaProperty, TSSchemaPropertyType, UnwrapJSONSchemaModelPropertyWrapper } from './TSSchemaProperty.js';

/**
 * The schema the examples below work with
 */
const schema = {
  $defs: {
    Person: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        address: { type: 'object', properties: { city: { type: 'string' } }, required: ['city'] },
        mentor: { anyOf: [{ $ref: '#/$defs/Person' }, { type: 'null' }] },
      },
      required: ['name', 'address'],
    },
    Role: { enum: ['student', 'teacher'] },
  },
} as const;
type Schema = typeof schema;
type Person = Schema['$defs']['Person'];

describe('Showcase', () => {
  describe('TSSchema wrapper internals', () => {
    describe('Wrapper shapes', () => {
      it('Wraps a collection as { __collection }', () => {
        type People = TSSchemaCollection<Schema>;
        //   ^?
        // People: JSONSchemaCollectionWrapper<Schema>, i.e. { __collection: Schema }
        expect(true satisfies AssertTypeEquality<People, JSONSchemaCollectionWrapper<Schema>>).toBe(true);
        expect(true satisfies AssertTypeEquality<UnwrapJSONSchemaCollectionWrapper<People>, Schema>).toBe(true);
      });

      it('Wraps a fragment as a collection wrapper plus { __fragment, __fragmentName }', () => {
        type PersonFragment = TSSchemaFragment<Schema, 'Person'>;
        //   ^?
        // PersonFragment: JSONSchemaFragmentWrapper<Person, Schema, 'Person'>
        expect(true satisfies AssertTypeEquality<PersonFragment, JSONSchemaFragmentWrapper<Person, Schema, 'Person'>>).toBe(true);
        expect(true satisfies AssertTypeEquality<UnwrapJSONSchemaFragmentWrapper<PersonFragment>, Person>).toBe(true);
      });

      it('Wraps a property as a fragment wrapper of its model plus { __property, __propertyName }', () => {
        type PersonName = TSSchemaProperty<Schema, 'Person', 'name'>;
        //   ^?
        // PersonName: JSONSchemaModelPropertyWrapper<{ readonly type: 'string' }, Person, Schema, 'Person', 'name'>
        expect(
          true satisfies AssertTypeEquality<PersonName, JSONSchemaModelPropertyWrapper<{ readonly type: 'string' }, Person, Schema, 'Person', 'name'>>,
        ).toBe(true);
        expect(true satisfies AssertTypeEquality<UnwrapJSONSchemaModelPropertyWrapper<PersonName>, { readonly type: 'string' }>).toBe(true);
      });

      it('Nests wrappers structurally: property wrapper ⊂ fragment wrapper ⊂ collection wrapper', () => {
        // So a property wrapper can stand in for its parent model's fragment wrapper, and any wrapper for its collection. Dispatching on several
        // wrappers must therefore test the most specific one first
        type PersonName = TSSchemaProperty<Schema, 'Person', 'name'>;
        expect(true satisfies AssertTypeAssignable<PersonName, TSSchemaFragment<Schema, 'Person'>>).toBe(true);
        expect(true satisfies AssertTypeAssignable<PersonName, TSSchemaCollection<Schema>>).toBe(true);
        type SiblingRole = TSSchemaFragment<PersonName, 'Role'>;
        //   ^?
        // SiblingRole: TSSchemaFragment<Schema, 'Role'>, addressed through the property wrapper's collection
        expect(true satisfies AssertTypeEquality<SiblingRole, TSSchemaFragment<Schema, 'Role'>>).toBe(true);

        const fragmentNames = Object.keys(schema.$defs);
        // Breakpoint: wrappers have no runtime representation at all - at runtime there is only the schema itself
        expect(fragmentNames).toEqual(['Person', 'Role']);
      });
    });

    describe('Name utilities', () => {
      it('Gets fragment names from a collection, or from any wrapper of it', () => {
        type FragmentName = TSSchemaFragmentName<TSSchemaProperty<Schema, 'Person', 'name'>>;
        //   ^?
        // FragmentName: 'Person' | 'Role'
        expect(true satisfies AssertTypeEquality<FragmentName, 'Person' | 'Role'>).toBe(true);
      });

      it('Gets property names from a model, or from a fragment wrapper of it', () => {
        type PropertyName = TSSchemaFragmentPropertyName<TSSchemaFragment<Schema, 'Person'>>;
        //   ^?
        // PropertyName: 'name' | 'address' | 'mentor'
        expect(true satisfies AssertTypeEquality<PropertyName, 'name' | 'address' | 'mentor'>).toBe(true);
        type NotAModel = TSSchemaFragmentPropertyName<TSSchemaFragment<Schema, 'Role'>>;
        //   ^?
        // NotAModel: never
        expect(true satisfies AssertTypeEquality<NotAModel, never>).toBe(true);
      });
    });

    describe('Value type utilities', () => {
      it('Infers the type of a fragment wrapper against its own collection, or an explicitly passed one', () => {
        type PersonType = TSSchemaFragmentType<TSSchemaFragment<Schema, 'Person'>>;
        //   ^?
        // PersonType: { name: string; address: { city: string }; mentor?: PersonType | null }
        expect(true satisfies AssertTypeEquality<Pick<PersonType, 'mentor'>, { mentor?: PersonType | null }>).toBe(true);
        type Standalone = TSSchemaFragmentType<Person>;
        //   ^?
        // Standalone: { name: string; address: { city: string }; mentor?: unknown } (no collection to resolve the $ref against)
        expect(true satisfies AssertTypeEquality<Standalone['mentor'], unknown>).toBe(true);
      });

      it('Infers the type of a property wrapper, where TSSchemaFragmentType would infer its parent model', () => {
        type PersonName = TSSchemaProperty<Schema, 'Person', 'name'>;
        type NameType = TSSchemaPropertyType<PersonName>;
        //   ^?
        // NameType: string
        expect(true satisfies AssertTypeEquality<NameType, string>).toBe(true);
        type ParentType = TSSchemaFragmentType<PersonName>;
        //   ^?
        // ParentType: the whole Person model's type
        expect(true satisfies AssertTypeEquality<ParentType, TSSchemaFragmentType<TSSchemaFragment<Schema, 'Person'>>>).toBe(true);
      });
    });

    describe('Path resolution, step by step', () => {
      it('Resolves a path into an inline nested model, wrapping the property with that nested model', () => {
        type City = TSSchemaProperty<Schema, 'Person', 'address.city'>;
        //   ^?
        // City: the `city` property, wrapped with the inline `address` model (which has no name of its own)
        expect(true satisfies AssertTypeEquality<City['__fragment'], Person['properties']['address']>).toBe(true);
        expect(true satisfies AssertTypeEquality<TSSchemaPropertyType<City>, string>).toBe(true);
      });

      it('Resolves a path through every anyOf member and into a $ref, wrapping the property with the referenced model and its name', () => {
        // 'mentor.name': `mentor` is an anyOf of [$ref Person, null]; each member is pathed into, the `null` one contributes nothing
        type MentorName = TSSchemaProperty<Schema, 'Person', 'mentor.name'>;
        //   ^?
        // MentorName: TSSchemaProperty<Schema, 'Person', 'name'>
        expect(true satisfies AssertTypeEquality<MentorName, TSSchemaProperty<Schema, 'Person', 'name'>>).toBe(true);
      });

      it('Infers never for a path which does not resolve', () => {
        type Missing = TSSchemaProperty<Schema, 'Person', 'name.length'>;
        //   ^?
        // Missing: never (`name` is not a model)
        expect(true satisfies AssertTypeEquality<Missing, never>).toBe(true);
      });
    });
  });
});
