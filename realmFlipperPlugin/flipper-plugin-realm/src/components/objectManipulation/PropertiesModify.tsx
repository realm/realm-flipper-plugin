import { Col, Row } from 'antd';
import React from 'react';
import { RealmObject, SchemaObject } from '../../CommonTypes';
import { PropertyRender } from './PropertyRender';
import { getDefault } from './types/TypeInput';

type InputType = {
  schema: SchemaObject;
  value: RealmObject;
  setValue: (v: RealmObject) => void;
};

export const PropertiesModify = ({ schema, value, setValue }: InputType) => {
  if (Object.keys(value).length === 0) {
    // console.log('inputType, here')
    schema.order.forEach((propertyName: string) => {
      const property = schema.properties[propertyName];
      value[propertyName] = getDefault(property);
    });
  }
  // console.log('inputType value', value == {} )
  return (
    <Row gutter={[16, 48]}>
      {schema.order.map((propertyName: string, index: number) => {
        const set = (val: unknown) => {
          console.log('setting', propertyName, 'to', val)
          setValue({
            ...value,
            [propertyName]: val,
          })
          // value[propertyName] = val;
          console.log('after set', value)
        };
        return (
          <Col key={index} span={24}>
            <PropertyRender
              // key={index}
              property={schema.properties[propertyName]}
              isPrimary={propertyName === schema.primaryKey}
              set={set}
              initialValue={value[propertyName]} />
          </Col>
        );
      })}
    </Row>
  );
};
