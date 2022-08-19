import { SchemaObject } from '../CommonTypes';
import React from 'react';
import { BooleanValue } from '../components/BooleanValue';
import { Typography } from 'antd';

type TypeDescription = {
  type: string;
  objectType?: string;
};

export const renderValue = (
  schemas: SchemaObject[],
  value: unknown,
  property: TypeDescription
) => {
  if (value === null) {
    return <Typography.Text disabled>null</Typography.Text>;
  }
  let schema;
  let returnValue: JSX.Element | string | number = '';

  switch (property.type) {
    case 'string':
      returnValue = parseSimpleData(value);
      break;
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
      //@ts-ignore
      returnValue = parseSetOrList(schemas, value);
      break;
    case 'data': //@ts-ignore
      returnValue = parseData(value);
      break;
    case 'dictionary': //@ts-ignore
      returnValue = parseDictionary(value);
      break;
    case 'decimal128': //@ts-ignore
      returnValue = parseDecimal128(value);
      break;
    case 'object': //@ts-ignore
      schema = schemas.find((schema) => schema.name === property.objectType);
      returnValue = parseLinkedObject(schema as SchemaObject, value);
      break;
    case 'mixed':
      // console.log('rendering mixed', value);
      returnValue = parseMixed(value, schemas);
      // console.log('rendering mixed, return is', returnValue);
      break;
  }

  return returnValue;
};

function parseSimpleData(input: string | number): string | number {
  return input;
}

function parseSetOrList(schemas: SchemaObject[], input: any[]): string {
  const output = input.map((value) => {
    // return renderValue()
    return parseJavaScriptTypes(schemas, value);
  });

  return '[' + output + ']';
}

function parseDictionary(input: Record<string, unknown>): string {
  return JSON.stringify(input);
}

function parseData(input) {
  const blob = new Blob([input]);
  // / Convert Blob to URL
  const blobUrl = URL.createObjectURL(blob);

  // Create an a element with blobl URL
  const anchor = document.createElement('a');
  anchor.href = blobUrl;
  anchor.target = '_blank';
  anchor.download = 'file';
  return (
    <a href={blobUrl} target="_blank" rel="noreferrer" download="file">
      ccc
    </a>
  );
  // return anchor;
}

function parseBoolean(input: boolean): JSX.Element {
  const inputAsString = input.toString();

  return <BooleanValue active={input}> {inputAsString}</BooleanValue>;
}

function parseDecimal128(input: { $numberDecimal: string }): string {
  return input.$numberDecimal;
}

function parseLinkedObject(
  schema: SchemaObject,
  linkedObj: Record<string, unknown>
): string {
  let returnValue = '';
  const childSchema: SchemaObject | undefined = schema;
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

function parseMixed(
  input: any,
  schemas: SchemaObject[]
): string | JSX.Element | number {
  const type = input.type;
  const value = input.value;
  // console.log('schemas got:', schemas)
  const schema = schemas.find((schema) => schema.name === type);
  // console.log('rendering ')
  if (schema) {
    // we are dealing with a linked object
    return renderValue(schemas, value, {
      type: 'object',
      objectType: schema.name,
    });
  } else {
    return renderValue(schemas, value, {
      type,
    });
  }
  return JSON.stringify(input);
}

function parseJavaScriptTypes(
  schemas: SchemaObject[],
  input: any
): string | number | JSX.Element {
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
        return parseSetOrList(schemas, input);
      }
      //else if ('$numberDecimal' in input) {
      //   return input.$numberDecimal;
      //}
      else {
        return parseMixed(input, schemas);
      }
    case 'undefined':
    case 'bigint':
    case 'function':
    default:
      return input;
  }
}
