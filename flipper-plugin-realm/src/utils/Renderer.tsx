import React from 'react';
import BooleanValue from '../components/BooleanValue';
import { Button, message, Typography } from 'antd';
import fileDownload from 'js-file-download';
import { CanonicalObjectSchema } from 'realm';
import { DeserializedRealmObject } from '../CommonTypes';

type TypeDescription = {
  type: string;
  objectType?: string;
};

export const renderValue = (
  value: unknown,
  property: TypeDescription,
  schemas: CanonicalObjectSchema[],
  inner?: boolean,
): JSX.Element | string | number => {
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

  switch (property.type) {
    case 'string':
    case 'double':
    case 'int':
    case 'float':
    case 'objectId':
    case 'date':
    case 'uuid': //@ts-expect-error
      return parseSimpleData(value);
    case 'bool': //@ts-expect-error
      return parseBoolean(value);
    case 'list':
    case 'set': //@ts-expect-error
      return parseSetOrList(value, property, schemas);
    case 'data': //@ts-expect-error
      return parseData(value);
    case 'dictionary': //@ts-expect-error
      return parseDictionary(value);
    case 'decimal128': //@ts-expect-error
      return parseDecimal128(value);
    case 'object':
      // eslint-disable-next-line @typescript-eslint/no-shadow
      schema = schemas.find((schema) => schema.name === property.objectType);
      if(schema?.embedded) {
        return `[${schema.name}]`
      }
      //@ts-expect-error
      return parseLinkedObject(schema as Realm.ObjectSchema, value);
    case 'mixed':
      return parseMixed(value);
    default:
      return <Typography.Text disabled>Unsupported type</Typography.Text>
  }
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
  linkedObj: DeserializedRealmObject,
): string {
  const childSchema: Realm.ObjectSchema | undefined = schema;
  if (linkedObj.realmObject && childSchema.primaryKey !== undefined && childSchema !== undefined) {
    return '[' +
      childSchema.name +
      ']' +
      '.' +
      childSchema.primaryKey +
      ': ' +
      linkedObj.realmObject[childSchema.primaryKey];
  } else {
    return '[' + childSchema.name + ']._objectKey: ' + linkedObj.objectKey;
  }

}

function parseMixed(input: unknown): string | JSX.Element | number {
  return JSON.stringify(input);
}
