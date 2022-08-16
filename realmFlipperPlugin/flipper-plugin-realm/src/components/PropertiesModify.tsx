import { Modal } from 'antd';
import React from 'react';
import { useState } from 'react';
import { RealmObject, SchemaObject } from '../CommonTypes';
import { PropertyRender } from './PropertyRender';
import { getDefault } from './types/TypeInput';

type InputType = {
  schema: SchemaObject;
  initialObject?: RealmObject;
};

export const PropertiesModify = ({ schema, initialObject }: InputType) => {
  const [value] = useState<RealmObject>(initialObject || {});
    console.log('len:', value.length);

  if (Object.keys(value).length === 0) {
    console.log('inputType, here')
    schema.order.forEach((propertyName) => {
      const property = schema.properties[propertyName];
      value[propertyName] = getDefault(property);
    });
  }
  console.log('inputType value', value == {} )
  return (
    <>
      {schema.order.map((propertyName, index) => {
        const set = (val: unknown) => {
          value[propertyName] = val;
        };
        return (
          <PropertyRender
            key={index}
            property={schema.properties[propertyName]}
            isPrimary={propertyName === schema.primaryKey}
            set={set}
            initialValue={value[propertyName]}
          />
        );
      })}
    </>
  );
};
