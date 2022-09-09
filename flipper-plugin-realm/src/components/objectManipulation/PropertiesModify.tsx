import { Col, Row } from 'antd';
import React from 'react';
import { RealmObject, SchemaObject } from '../../CommonTypes';
import { PropertyRender } from './PropertyRender';
import { getDefault } from './types/TypeInput';

type InputType = {
  schema: SchemaObject;
  value: RealmObject;
  setValue: (v: RealmObject) => void;
  setPropsChanges?: React.Dispatch<React.SetStateAction<Set<string>>>;
};

export const PropertiesModify = ({ schema, value, setValue, setPropsChanges }: InputType) => {
  // if no default value provided => we should init the new object
  if (Object.keys(value).length === 0) {
    schema.order.forEach((propertyName: string) => {
      const property = schema.properties[propertyName];
      value[propertyName] = getDefault(property);
    });
  }
  return (
    <Row gutter={[16, 48]}>
      {schema.order.map((propertyName: string, index: number) => {
        const set = (val: unknown) => {
          if (setPropsChanges) {
            setPropsChanges((old: Set<string>) => {
              return old.add(propertyName);
            })
          }
          setValue({
            ...value,
            [propertyName]: val,
          })
        };
        return (
          <Col key={index} span={24}>
            <PropertyRender
              property={schema.properties[propertyName]}
              isPrimary={propertyName === schema.primaryKey && Boolean(setPropsChanges)} //if setPropsChanges is null => you are adding an object
              set={set}
              initialValue={value[propertyName]} />
          </Col>
        );
      })}
    </Row>
  );
};
