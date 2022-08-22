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

export const typeToString = (property: SchemaProperty): string => {
  let title = '';
  
  switch (property.type) {
    case 'list':
    case 'set':
    case 'dictionary':
    case 'object':
      title += property.objectType;
      break;
    default:
      title += property.type;
  }
  
  if (property.optional) {
    title += '?';
  }

  switch (property.type) {
    case 'list':
      title += '[]';
      break;
    case 'set':
      title += '<>';
      break;
    case 'dictionary':
      title += '{}';
      break;
  }

  return title;
}

export const PropertyRender = ({
  initialValue,
  property,
  isPrimary,
  set,
}: PropertyType) => {
  const title = typeToString(property);

  return (
    <Layout>
      <Layout.Header style={{ paddingLeft: 0, paddingRight: 0 }}>
        <div style={{ backgroundColor: 'white' }}>
          {property.name}
          <span style={{ float: 'right' }}>
            <Tag color="default">{title}</Tag>
            {!property.optional ? <Tag color="blue">required</Tag> : null}
            {isPrimary ? <Tag color="green">primary key</Tag> : null}
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
