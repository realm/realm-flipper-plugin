import React from 'react';
import { IndexableRealmObject, SortedObjectSchema } from '../../CommonTypes';
import { ObjectEdit } from './ObjectEdit';

type InputType = {
  schema: SortedObjectSchema;
  fieldName: string;
  value: IndexableRealmObject;
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
  const mockSchema: SortedObjectSchema = {
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
