import React from 'react';
import BooleanValue from '../components/BooleanValue';
import { Button, message, Typography } from 'antd';
import fileDownload from 'js-file-download';
import { CanonicalObjectSchema } from 'realm';
import { DeserializedRealmData, DeserializedRealmDecimal128, DeserializedRealmObject, DownloadDataFunction } from '../CommonTypes';
import { usePlugin } from 'flipper-plugin';
import { plugin } from '../index';

type TypeDescription = {
  type: string;
  objectType?: string;
};

export const renderValue = (
  value: unknown,
  property: TypeDescription,
  schemas: CanonicalObjectSchema[],
  downloadData: DownloadDataFunction,
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
    case 'uuid':
      return parseSimpleData(value as string | number);
    case 'bool':
      return parseBoolean(value as boolean);
    case 'list':
    case 'set':
      return parseSetOrList(value as Realm.Set<unknown>, property, schemas, downloadData);
    case 'data':
      return parseData(value as DeserializedRealmData, downloadData);
    case 'dictionary':
      return parseDictionary(value as Record<string, unknown>);
    case 'decimal128':
      return parseDecimal128(value as DeserializedRealmDecimal128);
    case 'object':
      // eslint-disable-next-line @typescript-eslint/no-shadow
      schema = schemas.find((schema) => schema.name === property.objectType);
      if(schema?.embedded) {
        return `[${schema.name}]`
      }
      return parseLinkedObject(schema as Realm.ObjectSchema, value as DeserializedRealmObject);
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
  downloadData: DownloadDataFunction,
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
        downloadData,
        true,
      );
    }

    return renderValue(
      value,
      {
        type: property.objectType as string,
      },
      schemas,
      downloadData,
      true,
    );
  });

  return '[' + output + ']';
}

function parseDictionary(input: Record<string, unknown>): string {
  return JSON.stringify(input);
}

function parseData(input: DeserializedRealmData,
  downloadData: DownloadDataFunction,
) {
  if (input.info === undefined) {
    return <Typography.Text disabled>data</Typography.Text>;
  }
  const handleDownload = () => {
    downloadData(input.info[0], input.info[1], input.info[2]).then(
      (res) => {
        fileDownload(new Uint8Array(res).buffer, 'data');
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

function parseDecimal128(input: DeserializedRealmDecimal128): string {
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
