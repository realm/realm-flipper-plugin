import React from 'react';
import { Tag } from 'antd';

// export const propertyToString = ({isOptional })

export const ColumnTitle = (props: {
  isOptional: boolean;
  name: string;
  objectType: string;
  propertyType: string;
  isPrimaryKey: boolean;
}) => {
  let title;

  switch (props.propertyType) {
    case 'list':
    case 'set':
    case 'dictionary':
    case 'object':
      title = props.objectType;
      break;
    default:
      title = props.propertyType;
  }

  if (props.isOptional) {
    title += '?';
  }

  switch (props.propertyType) {
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

  return props.isPrimaryKey ? (
    <div>
      {' '}
      {props.name + ' '} <Tag color="default">{title}</Tag>{' '}
      <Tag color="green">Primary Key</Tag>{' '}
    </div>
  ) : (
    <div>
      {' '}
      {props.name + ' '} <Tag color="default">{title}</Tag>
    </div>
  );
};
