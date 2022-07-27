import { Layout, Tag } from "antd";
import React, { useState } from "react";
import { SchemaPropertyValue } from "..";
import { getDefault, TypeInput } from "./types/TypeInput";

type InputType = {
  values: { [keys: string]: any };
  property: SchemaPropertyValue;
  toClear: (() => void)[];
  isPrimary: boolean;
  inputReset: number;
  refresh: () => void;
};

export const PropertyRender = ({
  values,
  property,
  toClear,
  isPrimary,
  inputReset,
  refresh,
}: InputType) => {
  const [value, setValue] = useState(getDefault(property));

  console.log("renderProperty");
  if (values[property.name] === undefined)
    values[property.name] = getDefault(property);

  let typeName;
  switch (property.type) {
    case "list":
      typeName = property.objectType + "[]";
      break;
    case "set":
      typeName = property.objectType + "<>";
      break;
    default:
      typeName = property.type;
      break;
  }

  toClear = [...toClear, () => setValue(getDefault(property))];

  const setter = (val: any) => {
    values[property.name] = val;
    setValue(val);
  };

  return (
    <Layout>
      <Layout.Header style={{ paddingLeft: 0, paddingRight: 0 }}>
        {property.name}
        <span style={{ float: "right" }}>
          <Tag color="default">{typeName}</Tag>
          {!property.optional ? <Tag color="blue">required</Tag> : null}
          {isPrimary ? <Tag color="blue">primary key</Tag> : null}
        </span>
      </Layout.Header>
      <Layout.Content>
        <TypeInput
          property={property}
          setter={setter}
          value={value}
          inputReset={inputReset}
          refresh={refresh}
        />
      </Layout.Content>
    </Layout>
  );
};
