import React from 'react';
import BooleanValue from '../components/BooleanValue';
import { Button, message, Typography } from 'antd';
import fileDownload from 'js-file-download';
import { CanonicalObjectSchema } from 'realm';
import { IndexableRealmObject } from '../CommonTypes';

type TypeDescription = {
  type: string;
  objectType?: string;
};

export const renderValue = (
  value: unknown,
  property: TypeDescription,
  schemas: CanonicalObjectSchema[],
  inner?: boolean,
) => {
  if (value === null) {
    return inner ? 'null' : <Typography.Text disabled>null</Typography.Text>;
  }
  if (value === undefined) {
    return inner ? (
      'undefined'
    ) : (
      <Typography.Text disabled>undefined</Typography.Text>
    );
  }
  let schema;
  let returnValue: JSX.Element | string | number = '';

  switch (property.type) {
    case 'string':
      //@ts-expect-error These type errors are okay because the Realm data types guarantee type safety here.
      returnValue = parseSimpleData(value);
      break;
    case 'double':
    case 'int':
    case 'float':
    case 'objectId':
    case 'date':
    case 'uuid': //@ts-expect-error
      returnValue = parseSimpleData(value);
      break;
    case 'bool': //@ts-expect-error
      returnValue = parseBoolean(value);
      break;
    case 'list':
    case 'set': //@ts-expect-error
      returnValue = parseSetOrList(value, property, schemas);
      break;
    case 'data': //@ts-expect-error
      returnValue = parseData(value);
      break;
    case 'dictionary': //@ts-expect-error
      returnValue = parseDictionary(value);
      break;
    case 'decimal128': //@ts-expect-error
      returnValue = parseDecimal128(value);
      break;
    case 'object':
      // eslint-disable-next-line @typescript-eslint/no-shadow
      schema = schemas.find((schema) => schema.name === property.objectType);
      //@ts-expect-error
      returnValue = parseLinkedObject(schema as Realm.ObjectSchema, value);
      break;
    case 'mixed':
      returnValue = parseMixed(value);
      break;
  }

  return returnValue;
};

function parseSimpleData(input: string | number): string | number {
  return input;
}

function parseSetOrList(
  input: Realm.Set<unknown> | Realm.List<unknown>,
  property: TypeDescription,
  schemas: Realm.CanonicalObjectSchema[],
): string {
  const output = input.map((value: unknown) => {
    // check if the container holds objects
    if (schemas.some((schema) => schema.name === property.objectType)) {
      return renderValue(
        value,
        {
          type: 'object',
          objectType: property.objectType,
        },
        schemas,
        true,
      );
    }

    return renderValue(
      value,
      {
        type: property.objectType as string,
      },
      schemas,
      true,
    );
  });

  return '[' + output + ']';
}

function parseDictionary(input: Record<string, unknown>): string {
  return JSON.stringify(input);
}

function parseData(input: {
  downloadData: () => Promise<{ data: Uint8Array }>;
  length: number;
}) {
  if (input.downloadData === undefined) {
    return <Typography.Text disabled>data</Typography.Text>;
  }
  /* Structure of binary data:
  input: {
    downloadData: () => Promise<{ data: Uint8Array }>,
    length,
  }
  */
  const handleDownload = () => {
    input.downloadData().then(
      (res) => {
        fileDownload(new Uint8Array(res.data).buffer, 'data');
      },
      (reason) => {
        message.error('downloading failed', reason.message);
      },
    );
  };
  return <Button onClick={handleDownload}>[{input.length} bytes]</Button>;
}

function parseBoolean(input: boolean): JSX.Element {
  const inputAsString = input.toString();

  return <BooleanValue active={input} value={inputAsString} />;
}

function parseDecimal128(input: { $numberDecimal: string }): string {
  return input.$numberDecimal ?? input;
}

function parseLinkedObject(
  schema: Realm.ObjectSchema,
  linkedObj: IndexableRealmObject,
): string {
  let returnValue = '';
  const childSchema: Realm.ObjectSchema | undefined = schema;
  if (childSchema.primaryKey !== undefined && childSchema !== undefined) {
    returnValue =
      '[' +
      childSchema.name +
      ']' +
      '.' +
      childSchema.primaryKey +
      ': ' +
      linkedObj[childSchema.primaryKey];
  } else {
    returnValue =
      '[' + childSchema.name + ']._objectKey: ' + linkedObj._pluginObjectKey;
  }

  return returnValue;
}

function parseMixed(input: unknown): string | JSX.Element | number {
  return JSON.stringify(input);
}
