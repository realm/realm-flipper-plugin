import { Layout, Tag } from "antd";
import React, { useState } from "react";
import { SchemaPropertyValue } from "..";
import { getDefault, TypeInput } from "./types/TypeInput";

type inputType = {
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
}: inputType) => {
  const [value, setValue] = useState(getDefault(property));

  console.log("renderProperty");
  if (values[property.name] === undefined)
    values[property.name] = getDefault(property);

  let name;
  switch (property.type) {
    case "list":
      name = property.objectType + "[]";
      break;
    case "set":
      name = property.objectType + "<>";
      break;
    default:
      name = property.type;
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
        {name}
        <span style={{ float: "right" }}>
          <Tag color="default">{property.type}</Tag>
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
