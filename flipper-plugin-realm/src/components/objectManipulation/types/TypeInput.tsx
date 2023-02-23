import React from 'react';
import { BoolInput } from './BoolInput';
import { DataInput } from './DataInput';
import { DateInput } from './DateInput';
import { DecimalInput } from './DecimalInput';
import { DictionaryInput } from './DictionaryInput';
import { IntInput } from './IntInput';
import { ListInput } from './ListInput';
import { MixedInput } from './MixedInput';
import { ObjectIdInput } from './ObjectIdInput';
import { ObjectInput } from './ObjectInput';
import { SetInput } from './SetInput';
import { StringInput } from './StringInput';
import { UUIDInput } from './UUIDInput';
import { UUID, ObjectId } from 'bson';

export type TypeInputProps = {
  property: TypeDescription;
  defaultValue?: unknown;
  set: (val: unknown) => void;
  extraProps?: Record<string, unknown>;
  isPrimary: boolean;
};

export type CollectionInputProps = {
  property: TypeDescription;
  defaultValue?: unknown[];
  set: (val: unknown[]) => void;
  extraProps?: Record<string, unknown>;
  isPrimary: boolean;
};

type TypeDescription = {
  type: string;
  optional: boolean;
  objectType?: string;
}

export const getDefault = (property: TypeDescription) => {
  const isContainer = (type: string) => {
    return ["dictionary", "list", "set"].includes(type); 
  };

  if (property.optional && !isContainer(property.type)) return null;

  const type = property.type;
  switch (type) {
    case 'int':
    case 'float':
    case 'double':
      return 0;
    case 'bool':
      return false;
    case 'date':
      return new Date();
    case 'uuid':
      return new UUID();
    case 'decimal128':
      // storing as a string
      return "0";
    case 'string':
      return '';
    case 'list':
      return [];
    case 'set':
      return []; //problem with serializing Set
    case 'dictionary':
      return new Object();
    case 'objectId':
      return new ObjectId();
    case 'data':
      return [];
    default:
      return null;
  }
};

export const TypeInput = (props: TypeInputProps) => {
  switch (props.property.type) {
    case 'int':
    case 'float':
    case 'double':
      return <IntInput {...props} />;
    case 'string':
      return <StringInput {...props} />;
    case 'bool':
      return <BoolInput {...props} />;
    case 'date':
      return <DateInput {...props} />;
    case 'uuid':
      return <UUIDInput {...props} />;
    case 'set':
      return <SetInput {...props as CollectionInputProps} />;
    case 'list':
      return <ListInput {...props as CollectionInputProps} />;
    case 'mixed':
      return <MixedInput {...props} />;
    case 'decimal128':
      return <DecimalInput {...props} />;
    case 'data':
      return <DataInput {...props} />;
    case 'dictionary':
      return <DictionaryInput {...props} />;
    case 'objectId':
      return <ObjectIdInput {...props} />;
    case 'object':
      return <ObjectInput {...props} />;
    default:
      // container of objects
      props.property.objectType = props.property.type;
      props.property.type = 'object';
      return <ObjectInput {...props} />;
  }
};
