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
    case 'set':
    case 'dictionary':
    case 'object':
      title = objectType;
      break;
    default:
      title = propertyType;
  }

  if (isOptional) {
    title += '?';
  }

  switch (propertyType) {
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
