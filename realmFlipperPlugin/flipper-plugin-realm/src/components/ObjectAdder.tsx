import { Modal, Radio } from 'antd';
import { useState } from 'react';
import { AddObject,  SchemaProperty, SchemaObject} from "../CommonTypes";

import React from 'react';
import { PropertyRender } from './PropertyRender';
import { plugin } from '..';
import { Layout, usePlugin } from 'flipper-plugin';

type PropertyType = {
  schema: SchemaObject;
}
const ObjectAdder = ({
  schema,
}: PropertyType) => {

  const {addObject} = usePlugin(plugin);

  const empty: { [prop: string]: any } = {};
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
    // console.log('hidemodal');
    toClear.forEach((f) => f());
    toClear = [];
    setValues({});
    refresh();
    setVisible(false);
  };

  const onOk = () => {
    // console.log('addObject', values);
    // console.log(props.addObject);
    addObject(values);
    hideModal();
  };

  return (
    <Layout.Horizontal style={{ justifyContent: 'right' }}>
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
        onOk={onOk}
        onCancel={hideModal}
        okText="Create"
        cancelText="Cancel"
      >
        {schema.order.map((property, index) => (
          <PropertyRender
            values={values}
            property={schema.properties[property]}
            toClear={toClear}
            isPrimary={property == schema.primaryKey}
            key={
              inputReset *
                Object.keys(schema.properties).length *
                Object.keys(schema.properties).length +
              index
            }
          />
        ))}
      </Modal>
    </Layout.Horizontal>
  );
};

export default React.memo(ObjectAdder);
