import uuid from "react-native-uuid";
import bigDecimal from "js-big-decimal";
import React, { useState } from "react";
import { SchemaPropertyValue } from "../..";
import { BoolInput } from "./BoolInput";
import { DateInput } from "./DateInput";
import { IntInput } from "./IntInput";
import { StringInput } from "./StringInput";
import { UUIDInput } from "./UUIDInput";
import { ListInput } from "./ListInput";
import moment from "moment";
import { MixedInput } from "./MixedInput";
import { DecimalInput } from "./DecimalInput";

export type TypeInputProps = {
  property: SchemaPropertyValue;
  value: any;
  set: (val: any) => void;
  style?: Object;
};

export const getDefault = (property: SchemaPropertyValue) => {
  if (property.optional) return null;

  const type = property.type;
  switch (type) {
    case "int":
    case "float":
    case "double":
      return 0;
    case "bool":
      return false;
    case "date":
      return moment(new Date());
    case "uuid":
      return uuid.v4();
    case "decimal128":
      return new bigDecimal();
    case "string":
      return "";
    case "list":
      return [];
    case "set":
      return new Set();
    default:
      return null;
  }
};

export const TypeInput = (props: TypeInputProps) => {
  // const clearButton = 
  switch (props.property.type) {
    case "int":
    case "float":
    case "double":
      return <IntInput {...props} />;
    case "string":
      return <StringInput {...props} />;
    case "bool":
      return <BoolInput {...props} />;
    case "date":
      return <DateInput {...props} />;
    case "uuid":
      return <UUIDInput {...props} />;
    // case "set":
    case "list":
      return <ListInput {...props} />;
    case "mixed":
      return <MixedInput {...props}/>;
    case 'decimal128':
      return <DecimalInput {...props} />;
    default:
      return <>Input for {props.property.type} not implemented!</>;
  }
};
