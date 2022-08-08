import bigDecimal from 'js-big-decimal';
import moment from 'moment';
import React from 'react';
import uuid from 'react-native-uuid';
import { RealmObject } from '../../CommonTypes';
import { SchemaProperty } from "../RealmPluginState";
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

export type TypeInputProps = {
  property: SchemaProperty;
  value: any;
  set: (val: any) => void;
  style?: RealmObject;
};

export const getDefault = (property: SchemaProperty) => {
  if (property.optional && property.type != "dictionary" && property.type != 'list' && property.type != 'set') return null;

  const type = property.type;
  switch (type) {
    case 'int':
    case 'float':
    case 'double':
      return 0;
    case 'bool':
      return false;
    case 'date':
      return moment(new Date());
    case 'uuid':
      return uuid.v4();
    case 'decimal128':
      return new bigDecimal();
    case 'string':
      return '';
    case 'list':
      return [];
    case 'set':
      return new Set();
    case 'dictionary':
      return new Object();
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
      return <SetInput {...props} />;
    case 'list':
      return <ListInput {...props} />;
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
      return <>Input for {props.property.type} not implemented!</>;
  }
};
