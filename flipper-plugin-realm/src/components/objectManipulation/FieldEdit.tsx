import React from 'react';
import { RealmObject, SchemaObject } from '../../CommonTypes';
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
  const mockSchema: SchemaObject = {
    name: fieldName,
    embedded: false,
    asymmetric: false,
    primaryKey: schema.primaryKey,
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
