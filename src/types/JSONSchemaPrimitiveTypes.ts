/**
 * JSON Schema primitive types, type names and type name mappings
 */

import type { JSONSchema7Array, JSONSchema7Object, JSONSchema7Type, JSONSchema7TypeName } from 'json-schema';

export type JSONSchemaPrimitiveTypeName = Exclude<JSONSchema7TypeName, 'array'>;
export type JSONSchemaPrimitiveType = Exclude<Exclude<JSONSchema7Type, JSONSchema7Object>, JSONSchema7Array>;

export type JSONSchemaPrimitiveArrayTypeName = `Array<${JSONSchemaPrimitiveTypeName}>`;
export type JSONSchemaPrimitiveArrayType = Array<JSONSchemaPrimitiveType>;

export type JSONSchemaPrimitiveRecordTypeName = `Record<${JSONSchemaPrimitiveTypeName}>`;
export type JSONSchemaPrimitiveRecordType = Record<PropertyKey, JSONSchemaPrimitiveType>;

export type JSONSchemaPrimitiveTypeFromTypeName<
  TName extends JSONSchemaPrimitiveTypeName | JSONSchemaPrimitiveArrayTypeName | JSONSchemaPrimitiveRecordTypeName,
  TDefault = any,
> = [TName] extends [never]
  ? TDefault
  : // null
    TName extends 'null'
    ? null | JSONSchemaPrimitiveTypeFromTypeName<Exclude<TName, 'null'>, null>
    : TName extends 'Array<null>'
      ? null[] | JSONSchemaPrimitiveTypeFromTypeName<Exclude<TName, 'Array<null>'>, null[]>
      : TName extends 'Record<null>'
        ? Record<PropertyKey, null> | JSONSchemaPrimitiveTypeFromTypeName<Exclude<TName, 'Record<null>'>, Record<PropertyKey, null>>
        : // string
          TName extends 'string'
          ? string | JSONSchemaPrimitiveTypeFromTypeName<Exclude<TName, 'string'>, string>
          : TName extends 'Array<string>'
            ? string[] | JSONSchemaPrimitiveTypeFromTypeName<Exclude<TName, 'Array<string>'>, string[]>
            : TName extends 'Record<string>'
              ? Record<PropertyKey, string> | JSONSchemaPrimitiveTypeFromTypeName<Exclude<TName, 'Record<string>'>, Record<PropertyKey, string>>
              : // number
                TName extends 'number' | 'integer' | 'float' | 'double'
                ? number | JSONSchemaPrimitiveTypeFromTypeName<Exclude<TName, 'number' | 'integer' | 'float' | 'double'>, number>
                : TName extends 'Array<number>' | 'Array<integer>' | 'Array<float>' | 'Array<double>'
                  ? | number[]
                    | JSONSchemaPrimitiveTypeFromTypeName<Exclude<TName, 'Array<number>' | 'Array<integer>' | 'Array<float>' | 'Array<double>'>, number[]>
                  : TName extends 'Record<number>' | 'Record<integer>' | 'Record<float>' | 'Record<double>'
                    ? | Record<PropertyKey, number>
                      | JSONSchemaPrimitiveTypeFromTypeName<
                          Exclude<TName, 'Record<number>' | 'Record<integer>' | 'Record<float>' | 'Record<double>'>,
                          Record<PropertyKey, number>
                        >
                    : // boolean
                      TName extends 'boolean'
                      ? boolean | JSONSchemaPrimitiveTypeFromTypeName<Exclude<TName, 'boolean'>, boolean>
                      : TName extends 'Array<boolean>'
                        ? boolean[] | JSONSchemaPrimitiveTypeFromTypeName<Exclude<TName, 'Array<boolean>'>, boolean[]>
                        : TName extends 'Record<boolean>'
                          ? Record<PropertyKey, boolean> | JSONSchemaPrimitiveTypeFromTypeName<Exclude<TName, 'Record<boolean>'>, Record<PropertyKey, boolean>>
                          : // object
                            TName extends 'object'
                            ? object | JSONSchemaPrimitiveTypeFromTypeName<Exclude<TName, 'object'>, object>
                            : TName extends 'Array<object>'
                              ? object[] | JSONSchemaPrimitiveTypeFromTypeName<Exclude<TName, 'Array<object>'>, object[]>
                              : TName extends 'Record<object>'
                                ? | Record<PropertyKey, object>
                                  | JSONSchemaPrimitiveTypeFromTypeName<Exclude<TName, 'Record<object>'>, Record<PropertyKey, object>>
                                : never;
