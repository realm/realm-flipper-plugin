import React from 'react';
import BooleanValue from '../components/BooleanValue';
import { Button, message, Typography } from 'antd';
import fileDownload from 'js-file-download';
import { CanonicalObjectSchema } from 'realm';
import { DeserializedRealmData, DeserializedRealmDecimal128, DeserializedRealmObject, DownloadDataFunction } from '../CommonTypes';
import { ClickableText } from '../components/ClickableText';

type TypeDescription = {
  type: string;
  objectType?: string;
};

export const renderValue = (
  value: unknown,
  property: TypeDescription,
  schemas: CanonicalObjectSchema[],
  helpers: {
    downloadData: DownloadDataFunction; 
    inspectValue?: (value: any) => void;
  },
  inner?: boolean,
  /** Inspect longer length values */
): JSX.Element | string | number => {
  const {downloadData, inspectValue} = helpers;
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

  const withCutoff = (displayValue: string, cutoff: number) => {
    /** If the cell contains a string which is too long cut it off and render it as a clickable text. */
    if (!inner && inspectValue && displayValue.length > cutoff) {
      return (
        <ClickableText
        displayValue={displayValue.substring(0, cutoff)}
        onClick={() => inspectValue(value)}
        ellipsis
        />
      );
    }
    return displayValue
  }

  switch (property.type) {
    case 'string':
      return withCutoff(value as string, 40);
    case 'double':
    case 'int':
    case 'float':
      return withCutoff(value.toString(), 10);
    case 'date':
    case 'objectId':
    case 'uuid':
      return value as string;
    case 'bool':
      return parseBoolean(value as boolean);
    case 'list':
    case 'set':
      return withCutoff(parseSetOrList(value as Realm.Set<unknown>, property, schemas, downloadData), 40);
    case 'data':
      return parseData(value as DeserializedRealmData, downloadData);
    case 'dictionary':
      return withCutoff(parseDictionary(value as Record<string, unknown>), 20);
    case 'decimal128':
      return withCutoff(parseDecimal128(value as DeserializedRealmDecimal128), 20);
    case 'object':
      // eslint-disable-next-line @typescript-eslint/no-shadow
      schema = schemas.find((schema) => schema.name === property.objectType);
      if(schema?.embedded) {
        return `[${schema.name}]`
      }
      return parseLinkedObject(schema as Realm.ObjectSchema, value as DeserializedRealmObject);
    case 'mixed':
      return withCutoff(parseMixed(value), 40);
    default:
      return <Typography.Text disabled>Unsupported type</Typography.Text>
  }
};

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
        {downloadData},
        true,
      );
    }

    return renderValue(
      value,
      {
        type: property.objectType as string,
      },
      schemas,
      {downloadData},
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

function parseMixed(input: unknown): string {
  return JSON.stringify(input);
}
