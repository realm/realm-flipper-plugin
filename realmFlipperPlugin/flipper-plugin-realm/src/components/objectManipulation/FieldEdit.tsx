import React from 'react';
import { SchemaObject, SchemaProperty } from '../../CommonTypes';
import { ObjectEdit } from './ObjectEdit';

type InputType = {
  schema: SchemaObject;
  fieldName: string;
  value: RealmObject;
  setVisible: (value: boolean) => void;
  visible: boolean;
};

export const FieldEdit = ({
  schema,
  fieldName,
  value,
  setVisible,
  visible,
}: InputType) => {
    // console.log(`FieldEdit`, schema, fieldName, value, setVisible, visible)
  const mockSchema: SchemaObject = {
    name: fieldName,
    embedded: false,
    asymmetric: false,
    primaryKey: '',
    properties: { [fieldName]: schema.properties[fieldName] },
    order: [fieldName],
  };
  return (
    <ObjectEdit
      schema={mockSchema}
      initialObject={value}
      setVisible={setVisible}
      visible={visible}
    />
  );
};
