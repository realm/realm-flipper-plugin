import { Layout, Tag } from 'antd';
import React, { useState } from 'react';
import { SchemaProperty } from 'RealmPluginState';
import { getDefault, TypeInput } from './types/TypeInput';

type PropertyType = {
  values: { [keys: string]: any };
  property: SchemaProperty;
  toClear: (() => void)[];
  isPrimary: boolean;
};

export const PropertyRender = ({
  values,
  property,
  toClear,
  isPrimary,
}: PropertyType) => {
  const [value, setValue] = useState(getDefault(property));

  // console.log("renderProperty");
  if (values[property.name] === undefined)
    values[property.name] = getDefault(property);

  let typeName;
  switch (property.type) {
    case 'list':
      typeName = property.objectType + '[]';
      break;
    case 'set':
      typeName = property.objectType + '<>';
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
        <div style={{ backgroundColor: 'white' }}>
          {property.name}
          <span style={{ float: 'right' }}>
            <Tag color="default">{typeName}</Tag>
            {!property.optional ? <Tag color="blue">required</Tag> : null}
            {isPrimary ? <Tag color="blue">primary key</Tag> : null}
          </span>
        </div>
      </Layout.Header>
      <Layout.Content>
        <TypeInput
          property={property}
          set={setter}
          defaultValue={value}
          extraProps={{ style: { width: '100%' } }}
        />
      </Layout.Content>
    </Layout>
  );
};
