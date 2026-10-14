/**
 * Annotations: the keywords of a JSON schema fragment describing it rather than constraining its values (`title`, `description`, `default`, `deprecated`,
 * `examples`), and its decorators (the vendor `x-decorators` keyword, as written by the sibling dotnetschema project).
 *
 * Annotations belong to the position a fragment is used at, not to its type: a generator writes them on the outermost schema of a property (next to a
 * `$ref`, or next to the `anyOf` of a nullable reference), so they are read from the fragment itself, never through a `$ref`. Reflections expose them
 * (see `TSSchemaFragmentReflection`), and so do the property entries of a model's type descriptor (see `TSSchemaModelPropertyDescriptor`).
 * `getTSSchemaAnnotations` reads them at runtime, and `TSSchemaAnnotationsOf` infers the same, with literal types, at type level.
 *
 * This file imports no reflection class, so it stays out of the reflection classes' import cycle.
 */

import type { JSONSchemaNotCollectionFragment } from '../schema/JSONSchema/index.js';
import { getJSONSchemaKeyword, isJSONSchemaObject, type JSONSchemaKeyword } from './JSONSchema/index.js';

// #region Annotations

/**
 * Annotations of a JSON schema fragment, each `undefined` if the fragment has none (or one of another value type), and its decorators
 */
export interface TSSchemaAnnotations {
  /**
   * The fragment's `title`
   */
  readonly title: string | undefined;
  /**
   * The fragment's `description`
   */
  readonly description: string | undefined;
  /**
   * The fragment's `default` value. Not checked against the fragment's type, as the schema does not require it to match.
   */
  readonly default: unknown;
  /**
   * The fragment's `deprecated` flag
   */
  readonly deprecated: boolean | undefined;
  /**
   * The fragment's `examples`
   */
  readonly examples: ReadonlyArray<unknown> | undefined;
  /**
   * The fragment's decorators (`x-decorators`), in order, or an empty array if it has none
   */
  readonly decorators: ReadonlyArray<TSSchemaDecoratorDescriptor>;
}

/**
 * A value of a decorator's argument or property: a JSON scalar, `null`, or an array of them (decorators come from attribute-like constructs, whose
 * arguments can not be objects)
 */
export type TSSchemaDecoratorValue = string | number | boolean | null | ReadonlyArray<TSSchemaDecoratorValue>;

/**
 * Describes a decorator of a JSON schema fragment (an entry of its `x-decorators` keyword): e.g. an attribute applied to the type or property the fragment
 * was generated from, by its name, the arguments it was constructed with, and the properties it was initialized with
 */
export interface TSSchemaDecoratorDescriptor<
  TName extends string = string,
  TArguments = { readonly [name: string]: TSSchemaDecoratorValue },
  TProperties = { readonly [name: string]: TSSchemaDecoratorValue },
> {
  /**
   * Name of the decorator (e.g. the full name of the attribute)
   */
  readonly name: TName;
  /**
   * Arguments the decorator was constructed with, by argument name, or an empty object if there are none
   */
  readonly arguments: TArguments;
  /**
   * Properties the decorator was initialized with, by property name, or an empty object if there are none
   */
  readonly properties: TProperties;
}

// #endregion

// #region Runtime

/**
 * Annotations already read, by the fragment they were read from
 */
const _annotations = new WeakMap<object, TSSchemaAnnotations>();

/**
 * Annotations of a fragment which is not a schema object (a boolean schema), or has no annotations
 */
const _noAnnotations: TSSchemaAnnotations = {
  title: undefined,
  description: undefined,
  default: undefined,
  deprecated: undefined,
  examples: undefined,
  decorators: [],
};

/**
 * Reads the annotations of a JSON schema fragment (see `TSSchemaAnnotations`). A keyword with a value of another type than the annotation's is left out, as
 * is a decorator which is not an object with a string `name`; a decorator's `arguments` or `properties` which are not an object are read as empty. The
 * runtime counterpart of `TSSchemaAnnotationsOf`.
 *
 * Annotations are cached by fragment, so reading the same fragment twice returns the same annotations.
 * @param fragment JSON fragment to read the annotations of
 * @returns Annotations of the fragment
 */
export function getTSSchemaAnnotations<TFragment>(fragment: TFragment): TSSchemaAnnotationsOf<TFragment> {
  if (!isJSONSchemaObject(fragment)) return _noAnnotations as TSSchemaAnnotationsOf<TFragment>;
  const cached = _annotations.get(fragment);
  if (cached !== undefined) return cached as TSSchemaAnnotationsOf<TFragment>;
  const decorators = getJSONSchemaKeyword(fragment, 'x-decorators', 'array') as Array<unknown> | undefined;
  const annotations: TSSchemaAnnotations = {
    title: getJSONSchemaKeyword(fragment, 'title', 'string') as string | undefined,
    description: getJSONSchemaKeyword(fragment, 'description', 'string') as string | undefined,
    default: getJSONSchemaKeyword(fragment, 'default', 'unknown'),
    deprecated: getJSONSchemaKeyword(fragment, 'deprecated', 'boolean') as boolean | undefined,
    examples: getJSONSchemaKeyword(fragment, 'examples', 'array') as Array<unknown> | undefined,
    decorators: (decorators ?? []).filter((decorator) => _isDecorator(decorator)).map((decorator) => _describeDecorator(decorator)),
  };
  _annotations.set(fragment, annotations);
  return annotations as TSSchemaAnnotationsOf<TFragment>;
}

/**
 * Determines if an entry of `x-decorators` is a decorator: an object with a string `name`
 * @param decorator Entry to check
 * @returns `true` if the entry is a decorator
 */
function _isDecorator(decorator: unknown): decorator is { name: string; arguments?: unknown; properties?: unknown } {
  return isJSONSchemaObject(decorator) && typeof (decorator as { name?: unknown }).name === 'string';
}

/**
 * Describes a decorator, by its name, arguments and properties (empty if absent, or not an object)
 * @param decorator Decorator to describe
 * @returns Descriptor of the decorator
 */
function _describeDecorator(decorator: { name: string; arguments?: unknown; properties?: unknown }): TSSchemaDecoratorDescriptor {
  return {
    name: decorator.name,
    arguments: (isJSONSchemaObject(decorator.arguments) ? decorator.arguments : {}) as TSSchemaDecoratorDescriptor['arguments'],
    properties: (isJSONSchemaObject(decorator.properties) ? decorator.properties : {}) as TSSchemaDecoratorDescriptor['properties'],
  };
}

// #endregion

// #region Type inference

/**
 * Infers the annotations of a JSON schema fragment, as `getTSSchemaAnnotations` reads them: with the literal type of each annotation, and a tuple of
 * decorators for a tuple of `x-decorators`. A fragment which is not a schema object infers no annotations, and the unspecified fragment any
 * (`TSSchemaAnnotations`), as it may hold keywords its type does not declare (`deprecated`, `x-decorators`).
 */
export type TSSchemaAnnotationsOf<TFragment> =
  // Not a schema object: no annotations
  TFragment extends object
    ? // Unspecified fragment: any annotations
      JSONSchemaNotCollectionFragment extends TFragment
      ? TSSchemaAnnotations
      : {
          readonly title: JSONSchemaKeyword<TFragment, 'title', string>;
          readonly description: JSONSchemaKeyword<TFragment, 'description', string>;
          readonly default: JSONSchemaKeyword<TFragment, 'default'>;
          readonly deprecated: JSONSchemaKeyword<TFragment, 'deprecated', boolean>;
          readonly examples: JSONSchemaKeyword<TFragment, 'examples', ReadonlyArray<unknown>>;
          readonly decorators: _TSSchemaDecoratorDescriptors<JSONSchemaKeyword<TFragment, 'x-decorators', ReadonlyArray<unknown>>>;
        }
    : {
        readonly title: undefined;
        readonly description: undefined;
        readonly default: undefined;
        readonly deprecated: undefined;
        readonly examples: undefined;
        readonly decorators: readonly [];
      };

/**
 * Infers the descriptors of a fragment's `x-decorators`, leaving out entries which are not decorators: element by element for a tuple, by entry type for
 * an array of unknown length, and an empty tuple for none
 */
type _TSSchemaDecoratorDescriptors<TDecorators> =
  // No decorators
  [TDecorators] extends [undefined]
    ? readonly []
    : // Possibly no decorators: any decorators
      undefined extends TDecorators
      ? ReadonlyArray<TSSchemaDecoratorDescriptor>
      : // Tuple
        TDecorators extends readonly [unknown, ...Array<unknown>] | readonly []
        ? _TSSchemaDecoratorDescriptorsTuple<TDecorators>
        : // Array of unknown length
          TDecorators extends ReadonlyArray<infer D>
          ? ReadonlyArray<_TSSchemaDecoratorDescriptor<D>>
          : readonly [];

/**
 * Infers the descriptors of a tuple of `x-decorators` entries, leaving out entries which are not decorators
 */
type _TSSchemaDecoratorDescriptorsTuple<TDecorators, TKept extends Array<unknown> = []> = TDecorators extends readonly [infer D, ...infer R]
  ? _TSSchemaDecoratorDescriptorsTuple<R, [_TSSchemaDecoratorDescriptor<D>] extends [never] ? TKept : [...TKept, _TSSchemaDecoratorDescriptor<D>]>
  : Readonly<TKept>;

/**
 * Infers the descriptor of an `x-decorators` entry, or `never` if it is not a decorator (an object with a string `name`)
 */
type _TSSchemaDecoratorDescriptor<TDecorator> = TDecorator extends { readonly name: infer N extends string }
  ? TSSchemaDecoratorDescriptor<N, _TSSchemaDecoratorMembers<TDecorator, 'arguments'>, _TSSchemaDecoratorMembers<TDecorator, 'properties'>>
  : never;

/**
 * Infers a decorator's `arguments` or `properties`: the object as declared, or an empty object if it has none (or one which is not an object)
 */
type _TSSchemaDecoratorMembers<TDecorator, TKey extends string> = TDecorator extends { readonly [K in TKey]: infer M }
  ? M extends object
    ? M extends ReadonlyArray<unknown>
      ? {}
      : M
    : {}
  : {};

// #endregion
