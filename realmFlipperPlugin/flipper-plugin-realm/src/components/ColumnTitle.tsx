import React from "react";
import { Tag } from "antd";

export function ColumnTitle(props: {
  isOptional: boolean;
  name: string;
  objectType: string | undefined;
  propertyType: string;
  isPrimaryKey: boolean;
}) {
  let title = '';

  console.log(props)

  switch (props.propertyType) {
    case 'list':
      title = props.objectType + '[]';
      break;
    case 'set':
      title = props.objectType + '<>';
      break;
    case 'dictionary':
      title = props.objectType + '{}';
      break;
    case 'object':
      title = props.objectType + '';
      break;
    default:
      title = props.propertyType;
  }

  props.isOptional ? (title = title + '?') : null;

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
}
