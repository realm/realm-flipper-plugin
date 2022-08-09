import { SchemaObject } from '../CommonTypes';
import { BooleanValue } from '../components/BooleanValue';
import React from 'react';

type propertyRepresentation = {
  value: unknown;
  text: string | number | null;
};

export const parseRows = (
  objects: Record<string, unknown>[],
  schema: SchemaObject,
  schemas: Array<SchemaObject>
): Array<Record<string, unknown>> => {
  // console.log(schema);

  const rows: Array<Record<string, unknown>> = objects.map(
    (obj: any, index: number) => {
      const returnObj = { key: index };

      Object.keys(schema.properties).forEach((propKey: string) => {
        const currentPropObject = schema.properties[propKey];
        const currentRealmPropType = currentPropObject.type;
        const currentFieldValue = obj[propKey];

        const propRep: propertyRepresentation = {
          value: currentFieldValue,
          text: null,
        };
        returnObj[propKey] = propRep;

        if (currentFieldValue === undefined) {
          return;
        }

        if (currentFieldValue === null) {
          // @ts-ignore
          returnObj[propKey].text = 'null';
          return;
        }

        let stringForPrint = '';

        switch (currentRealmPropType) {
          case 'string':
          case 'double':
          case 'int':
          case 'float':
          case 'objectId':
          case 'date':
          case 'uuid':
            stringForPrint = parseSimpleData(currentFieldValue);
            break;
          case 'bool':
            stringForPrint = parseBoolean(currentFieldValue);
            break;
          case 'list':
          case 'set':
            stringForPrint = parseSetOrList(currentFieldValue);
            break;
          case 'data':
          case 'dictionary':
            stringForPrint = parseDataOrDictionary(currentFieldValue);
            break;
          case 'decimal128':
            stringForPrint = parseDecimal128(currentFieldValue);
            break;
          case 'object':
            stringForPrint = parseLinkedObject(
              schema,
              schemas,
              currentFieldValue,
              propKey
            );
            break;
          case 'mixed':
            stringForPrint = parseMixed(currentFieldValue);
            break;
        }
        // @ts-ignore
        returnObj[propKey].text = stringForPrint;
      });
      return returnObj;
    }
  );

  return rows;
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
  return <BooleanValue active={Boolean.toString(input)}> input</BooleanValue>;
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
