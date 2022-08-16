import React from 'react';
import { Tag } from 'antd';

type PropertyType = {
  isOptional: boolean;
  name: string;
  objectType?: string;
  propertyType: string;
  isPrimaryKey: boolean;
};

export const ColumnTitle = ({
  isOptional,
  name,
  objectType,
  propertyType,
  isPrimaryKey,
}: PropertyType) => {
  let title;

  switch (propertyType) {
    case 'list':
      title = objectType + '[]';
      break;
    case 'set':
      title = objectType + '<>';
      break;
    case 'dictionary':
      title = objectType + '{}';
      break;
    case 'object':
      title = objectType;
      break;
    default:
      title = propertyType;
  }

  isOptional ? (title = title + '?') : null;

  return isPrimaryKey ? (
    <div>
      {' '}
      {name + ' '} <Tag color="default">{title}</Tag>{' '}
      <Tag color="green">Primary Key</Tag>{' '}
    </div>
  ) : (
    <div>
      {' '}
      {name + ' '} <Tag color="default">{title}</Tag>
    </div>
  );
};
