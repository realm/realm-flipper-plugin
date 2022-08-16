import { Layout, Tag } from 'antd';
import React from 'react';
import { SchemaProperty } from '../../CommonTypes';
import { TypeInput } from './types/TypeInput';

type PropertyType = {
  initialValue: unknown;
  property: SchemaProperty;
  isPrimary: boolean;
  set: (value: unknown) => void;
};

export const PropertyRender = ({
  initialValue,
  property,
  isPrimary,
  set,
}: PropertyType) => {
  let typeName;
  switch (property.type) {
    case 'list':
      typeName = property.objectType + '[]';
      break;
    case 'set':
      typeName = property.objectType + '<>';
      break;
    case 'object':
      typeName = property.objectType;
      break;
    default:
      typeName = property.type;
      break;
  }

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
          set={set}
          defaultValue={initialValue}
          extraProps={{ style: { width: '100%' } }}
        />
      </Layout.Content>
    </Layout>
  );
};
