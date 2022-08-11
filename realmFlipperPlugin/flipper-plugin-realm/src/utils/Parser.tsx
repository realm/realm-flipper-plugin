import { SchemaObject, SchemaProperty } from '../CommonTypes';
import { BooleanValue } from '../components/BooleanValue';
import React from 'react';

export const parsePropToCell = (
  object: Record<string, unknown>,
  property: SchemaProperty,
  schema: SchemaObject,
  schemas: Array<SchemaObject>
): Record<string, unknown> => {
  // console.log('object', object);
  // console.log('property', property);

  if (!object ) {
    return;
  }

  let stringForPrint: string | Element 

  switch (property.type) {
    case 'string':
    case 'double':
    case 'int':
    case 'float':
    case 'objectId':
    case 'date':
    case 'uuid':
      stringForPrint = parseSimpleData(object);
      break;
    case 'bool':
      stringForPrint = parseBoolean(object);
      break;
    case 'list':
    case 'set':
      stringForPrint = parseSetOrList(object);
      break;
    case 'data':
    case 'dictionary':
      stringForPrint = parseDataOrDictionary(object);
      break;
    case 'decimal128':
      stringForPrint = parseDecimal128(object);
      break;
    case 'object':
      stringForPrint = parseLinkedObject(
        schema,
        schemas,
        object,
        property.name
      );
      break;
    case 'mixed':
      stringForPrint = parseMixed(object);
      break;
  }
  console.log('stringForPrint', stringForPrint);
  return stringForPrint;
};

function parseSimpleData(input: string): string {
  return input;
}

function parseSetOrList(input: any[]): string {
  const output = input.map((value) => {
    return parseJavaScriptTypes(value);
  });

  return '[' + output + ']';
}

function parseDataOrDictionary(input: Record<string, unknown>): string {
  return JSON.stringify(input);
}

function parseBoolean(input: boolean): Element {
  const inputAsString = input.toString();

  return <BooleanValue active={inputAsString}> {inputAsString}</BooleanValue>;
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
  let stringForPrint = '';
  const childSchema: SchemaObject | undefined = schemas.find(
    (s) => s.name === schema.properties[key].objectType
  );
  if (childSchema !== undefined) {
    stringForPrint =
      '[' +
      childSchema.name +
      ']' +
      '.' +
      childSchema.primaryKey +
      ': ' +
      //@ts-ignore
      linkedObj[childSchema.primaryKey];
  }

  return stringForPrint;
}

function parseMixed(input: any): string {
  return JSON.stringify(input);
}

function parseJavaScriptTypes(input: any): string | Element {
  const type = typeof input;

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
      } else if ('$numberDecimal' in input) {
        return input.$numberDecimal;
      } else {
        return parseMixed(input);
      }
    case 'undefined':
    case 'bigint':
    case 'function':
    default:
      return input;
  }
}
