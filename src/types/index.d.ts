export type { TSSchema } from './TSSchema';
export type { TSSchemaDefinitionName, TSSchemaDefinition } from './TSSchemaDefinition';

// /**
//  * Extracts available model names from a JSON schema type
//  */
// export type JSONSchemaModelNames<TJSONSchema extends JSONSchema> = TJSONSchema['__schema']['$defs'] extends never
//   ? unknown
//   : undefined extends TJSONSchema['__schema']['$defs']
//     ? unknown
//     : keyof TJSONSchema['__schema']['$defs'];
// type SchoolJSONSchemaModelNames = JSONSchemaModelNames<SchoolJSONSchema>;
// //   ^?

// /**
//  * Verifies if a specific model within a JSON schema type is an enum
//  */
// export type JSONSchemaModelIsEnum<
//   TJSONSchema extends JSONSchema,
//   TJSONSchemaModelName extends JSONSchemaModelNames<TJSONSchema>,
// > = TJSONSchemaModelName extends keyof TJSONSchema['__schema']['$defs']
//   ? TJSONSchema['__schema']['$defs'][TJSONSchemaModelName] extends { type: 'object' }
//     ? false
//     : true
//   : false;
// type SchoolJSONSchemaAssessmentIsEnum = JSONSchemaModelIsEnum<SchoolJSONSchema, 'Assessment'>;
// //   ^?
// type SchoolJSONSchemaAssessmentKindIsEnum = JSONSchemaModelIsEnum<SchoolJSONSchema, 'AssessmentKind'>;
// //   ^?

// /**
//  * Encapsulates a ref to a specific enum within a JSON schema type
//  */
// export type JSONSchemaEnum<TJSONSchema extends JSONSchema, TJSONSchemaModelName extends JSONSchemaModelNames<TJSONSchema>> = {
//   __enum: TJSONSchemaModelName extends keyof TJSONSchema['__schema']['$defs']
//     ? JSONSchemaModelIsEnum<TJSONSchema, TJSONSchemaModelName> extends false
//       ? unknown
//       : TJSONSchema['__schema']['$defs'][TJSONSchemaModelName]
//     : unknown;
// };
// type SchoolJSONSchemaAssessmentEnum = JSONSchemaEnum<SchoolJSONSchema, 'Assessment'>;
// //   ^?
// type SchoolJSONSchemaAssessmentKindEnum = JSONSchemaEnum<SchoolJSONSchema, 'AssessmentKind'>;
// //   ^?

// /**
//  * Verifies if a specific model within a JSON schema type is a model
//  */
// export type JSONSchemaModelIsModel<
//   TJSONSchema extends JSONSchema,
//   TJSONSchemaModelName extends JSONSchemaModelNames<TJSONSchema>,
// > = TJSONSchemaModelName extends keyof TJSONSchema['__schema']['$defs']
//   ? TJSONSchema['__schema']['$defs'][TJSONSchemaModelName] extends { type: 'object' }
//     ? true
//     : false
//   : false;
// type SchoolJSONSchemaAssessmentIsModel = JSONSchemaModelIsModel<SchoolJSONSchema, 'Assessment'>;
// //   ^?
// type SchoolJSONSchemaAssessmentKindIsModel = JSONSchemaModelIsModel<SchoolJSONSchema, 'AssessmentKind'>;
// //   ^?

// /**
//  * Encapsulates a ref to a specific model within a JSON schema type
//  */
// export type JSONSchemaModel<TJSONSchema extends JSONSchema, TJSONSchemaModelName extends JSONSchemaModelNames<TJSONSchema>> = {
//   __model: TJSONSchemaModelName extends keyof TJSONSchema['__schema']['$defs']
//     ? JSONSchemaModelIsModel<TJSONSchema, TJSONSchemaModelName> extends false
//       ? unknown
//       : TJSONSchema['__schema']['$defs'][TJSONSchemaModelName]
//     : unknown;
// };
// type SchoolJSONSchemaAssessmentModel = JSONSchemaModel<SchoolJSONSchema, 'Assessment'>;
// //   ^?
// type SchoolJSONSchemaAssessmentKindModel = JSONSchemaModel<SchoolJSONSchema, 'AssessmentKind'>;
// //   ^?

// /**
//  * Extracts available property names from a specific model within a JSON schema type
//  */
// export type JSONSchemaModelPropertyNames<TJSONSchemaModel extends JSONSchemaModel<JSONSchema, unknown>> = TJSONSchemaModel['__model'] extends never
//   ? unknown
//   : TJSONSchemaModel['__model'] extends {
//         properties: object;
//       }
//     ? keyof TJSONSchemaModel['__model']['properties']
//     : unknown;
// type SchoolJSONSchemaAssessmentModelPropertyNames = JSONSchemaModelPropertyNames<SchoolJSONSchemaAssessmentModel>;
// //   ^?
// type SchoolJSONSchemaAssessmentKindModelPropertyNames = JSONSchemaModelPropertyNames<SchoolJSONSchemaAssessmentKindModel>;
// //   ^?

// /**
//  * Extracts required property names from a specific model within a JSON schema type
//  */
// export type JSONSchemaModelRequiredPropertyNames<TJSONSchemaModel extends JSONSchemaModel<JSONSchema, unknown>> = TJSONSchemaModel['__model'] extends never
//   ? unknown
//   : TJSONSchemaModel['__model'] extends {
//         required: unknown;
//       }
//     ? TJSONSchemaModel['__model']['required']
//     : unknown;
// type SchoolJSONSchemaAssessmentModelRequiredPropertyNames = JSONSchemaModelRequiredPropertyNames<SchoolJSONSchemaAssessmentModel>;
// //   ^?
// type SchoolJSONSchemaAssessmentKindModelRequiredPropertyNames = JSONSchemaModelRequiredPropertyNames<SchoolJSONSchemaAssessmentKindModel>;
// //   ^?

// /**
//  * Encapsulates a ref to a specific property within a model of a JSON schema type
//  */
// export type JSONSchemaModelProperty<
//   TJSONSchemaModel extends JSONSchemaModel<JSONSchema, unknown>,
//   TJSONSchemaModelPropertyName extends JSONSchemaModelPropertyNames<TJSONSchemaModel> = JSONSchemaModelPropertyNames<TJSONSchemaModel>,
// > = {
//   __property: TJSONSchemaModel['__model'] extends never
//     ? unknown
//     : TJSONSchemaModel['__model'] extends {
//           properties: object;
//         }
//       ? TJSONSchemaModelPropertyName extends keyof TJSONSchemaModel['__model']['properties']
//         ? TJSONSchemaModel['__model']['properties'][TJSONSchemaModelPropertyName]
//         : unknown
//       : unknown;
// };
// type SchoolJSONSchemaAssessmentModelIdProperty = JSONSchemaModelProperty<SchoolJSONSchemaAssessmentModel, 'id'>;
// //   ^?
// type SchoolJSONSchemaAssessmentKindModelIdProperty = JSONSchemaModelProperty<SchoolJSONSchemaAssessmentKindModel, 'id'>;
// //   ^?
