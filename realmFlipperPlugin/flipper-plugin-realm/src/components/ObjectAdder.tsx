import { Layout, Modal, Radio } from 'antd';
import { useState } from 'react';
import { SchemaPropertyValue, SchemaResponseObject } from '..';
import { AddObject } from '../index';

import React from 'react';
import { PropertyRender } from './PropertyRender';

const forEachProp = (
  props: {
    [key: string]: SchemaPropertyValue;
  },
  f: (prop: SchemaPropertyValue, index: number) => any
) => {
  return Object.keys(props).map((property, index) => {
    return f(props[property], index);
  });
};

const ObjectAdder = (props: {
  schema: SchemaResponseObject | undefined;
  addObject: (object: AddObject) => void;
}) => {
  const empty: { [prop: string]: any } = {};

  const schema = props.schema;
  if (!schema) {
    return <></>;
  }

  const [values, setValues] = useState(empty);
  const [visible, setVisible] = useState(false);
  const [inputReset, setInputReset] = useState(0);
  let toClear: any[] = [];

  const refresh = () => setInputReset((v) => v + 1);

  const showModal = () => {
    refresh();
    setValues({});
    setVisible(true);
  };

  const hideModal = () => {
    console.log('hidemodal');
    toClear.forEach((f) => f());
    toClear = [];
    setValues({});
    refresh();
    setVisible(false);
  };

  const addObject = () => {
    console.log('addObject', values);
    console.log(props.addObject);
    props.addObject(values);

    hideModal();
  };

  console.log('here, values:', values);

  return (
    <Layout.Content>
      <Radio.Button
        type="primary"
        onClick={showModal}
        style={{ float: 'right' }}
      >
        Create {schema.name}
      </Radio.Button>
      <Modal
        title={'Create ' + schema.name}
        visible={visible}
        onOk={addObject}
        onCancel={hideModal}
        okText="Create"
        cancelText="Cancel"
      >
        {forEachProp(schema.properties, (property, index) => (
          <PropertyRender
            values={values}
            property={property}
            toClear={toClear}
            isPrimary={property.name == schema.primaryKey}
            key={
              inputReset *
                Object.keys(schema.properties).length *
                Object.keys(schema.properties).length +
              index
            }
          />
        ))}
      </Modal>
    </Layout.Content>
  );
};

export default React.memo(ObjectAdder);
