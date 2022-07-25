import uuid from 'react-native-uuid';
import bigDecimal from "js-big-decimal";
import React from "react";
import { SchemaPropertyValue } from "../..";
import { BoolInput } from "./BoolInput";
import { DateInput } from "./DateInput";
import { IntInput } from "./IntInput";
import { StringInput } from "./StringInput";
import { UUIDInput } from "./UUIDInput";
import { ListInput } from './ListInput';

export type TypeInputProps = {
  property: SchemaPropertyValue;
  setter: (val: any) => void;
  value: any;
  inputReset: number;
};

export const getDefault = (property: SchemaPropertyValue) => {
    if (property.optional)
        return null
    
    const type = property.type
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
            return uuid.v4();
        case 'decimal128':
            return new bigDecimal();
        case 'string':
            return '';
        case 'list':
            return [];
        case 'set':
            return new Set();
        default:
            return null;
    }
}

export const TypeInput = (props: TypeInputProps) => {
  const properties = {
    property: props.property,
    setter: props.setter,
    value: props.value,
    inputReset: props.inputReset
  }

  switch (props.property.type) {
    case "int":
    case "float":
    case "double":
      return (
        <IntInput
          {...properties}
        />
      );
    case "string":
      return (
        <StringInput
        {...properties}
        />
      );
    case "bool":
      return (
        <BoolInput
        {...properties}
        />
      );
    case "date":
      return (
        <DateInput
        {...properties}
        />
      );
    case "uuid":
      return (
        <UUIDInput
        {...properties}
        />
      );
    case "list":
      return (
        <ListInput
          {...properties}
          />);
    default:
      return <></>;
  }
};
