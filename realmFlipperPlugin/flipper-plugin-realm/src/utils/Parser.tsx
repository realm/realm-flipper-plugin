import { SchemaObject, SchemaProperty } from '../CommonTypes';
import { BooleanValue } from '../components/BooleanValue';
import React from 'react';

export const parsePropToCell = (
  value: string | number | Record<string, unknown>,
  property: SchemaProperty,
  schema: SchemaObject,
  schemas: Array<SchemaObject>
): JSX.Element | string | number => {

  if (!value) {
    return value;
  }

  let returnValue: JSX.Element | string | number = '';
  console.log('value', value);

  switch (property.type) {
    case 'string':
    case 'double':
    case 'int':
    case 'float':
    case 'objectId':
    case 'date':
    case 'uuid': //@ts-ignore --> These type errors are okay because the Realm data types guarantee type safety here.
      returnValue = parseSimpleData(value);
      break;
    case 'bool': //@ts-ignore
      returnValue = parseBoolean(value);
      break;
    case 'list':
    case 'set': //@ts-ignore
      console.log('setlist', value);
      //@ts-ignore
      returnValue = parseSetOrList(value);
      break;
    case 'data':
    case 'dictionary': //@ts-ignore
      returnValue = parseDataOrDictionary(value);
      break;
    case 'decimal128': //@ts-ignore
      returnValue = parseDecimal128(value);
      break;
    case 'object': //@ts-ignore
      returnValue = parseLinkedObject(schema, schemas, value, property.name);
      break;
    case 'mixed':
      returnValue = parseMixed(value);
      break;
  }
  // console.log('returnValue', returnValue);

  return returnValue;
};

function parseSimpleData(input: string | number): string | number {
  return input;
}

function parseSetOrList(input: any[]): string {
  console.log('parseSetOrList', input);

  const output = input.map((value) => {
    return parseJavaScriptTypes(value);
  });

  return '[' + output + ']';
}

function parseDataOrDictionary(input: Record<string, unknown>): string {
  return JSON.stringify(input);
}

function parseBoolean(input: boolean): JSX.Element {
  const inputAsString = input.toString();

  return <BooleanValue active={input} > {inputAsString}</BooleanValue>;
}

function parseDecimal128(input: { $numberDecimal: string }): string {
  return input.$numberDecimal;
}

function parseLinkedObject(
  schema: SchemaObject,
  schemas: Array<SchemaObject>,
  linkedObj: Record<string, unknown>,
  key: string
): string {
  console.log('schema', schema);
  console.log('schemas', schemas);
  console.log('linkedObj', linkedObj);
  console.log('key', key);
  let returnValue = '';
  const childSchema: SchemaObject | undefined = schemas.find(
    (s) => s.name === schema.properties[key].objectType
  );
  console.log('childSchema', childSchema);
  if (childSchema !== undefined) {
    returnValue =
      '[' +
      childSchema.name +
      ']' +
      '.' +
      childSchema.primaryKey +
      ': ' +
      linkedObj[childSchema.primaryKey];
  }

  return returnValue;
}

function parseMixed(input: any): string {
  return JSON.stringify(input);
}

function parseJavaScriptTypes(input: any): string | number | JSX.Element {
  const type = typeof input;
  console.log('parseJavaScriptTypes', input);

  switch (type) {
    case 'string':
    case 'number':
    case 'symbol':
      return parseSimpleData(input);
    case 'boolean':
      return parseBoolean(input);
    case 'object':
      if (Array.isArray(input)) {
        return parseSetOrList(input);
      }
      //else if ('$numberDecimal' in input) {
      //   return input.$numberDecimal;
      //}
      else {
        return parseMixed(input);
      }
    case 'undefined':
    case 'bigint':
    case 'function':
    default:
      return input;
  }
}
