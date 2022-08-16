import { Modal, Radio } from 'antd';
import { useState } from 'react';
import { AddObject, SchemaProperty, SchemaObject } from '../CommonTypes';

import React from 'react';
import { PropertyRender } from './PropertyRender';
import { plugin } from '..';
import { Layout, usePlugin } from 'flipper-plugin';
import { PropertiesModify } from './PropertiesModify';

type PropertyType = {
  schema: SchemaObject | null;
};

const ObjectAdder = ({ schema }: PropertyType) => {
  const { addObject } = usePlugin(plugin);

  const empty: { [prop: string]: any } = {};
  const [values, setValues] = useState(empty);
  const [visible, setVisible] = useState(false);
  const [_, setInputReset] = useState(0);

  const refresh = () => setInputReset((v) => v + 1);

  const showModal = () => {
    refresh();
    setValues({});
    setVisible(true);
  };

  const hideModal = () => {
    setValues({});
    refresh();
    setVisible(false);
  };

  const onOk = () => {
    addObject(values);
    hideModal();
  };

  if (!schema) {
    return;
  }

  return (
    <Layout.Horizontal
      style={{ justifyContent: 'right', marginLeft: 'auto', marginRight: 7 }}
    >
      <Radio.Button type="primary" onClick={showModal}>
        Create {schema.name}
      </Radio.Button>
      <Modal
        title={'Create ' + schema.name}
        visible={visible}
        onOk={onOk}
        onCancel={hideModal}
        okText="Create"
        cancelText="Cancel"
        destroyOnClose
      >
        <PropertiesModify schema={schema} initialObject={values}/>
      </Modal>
    </Layout.Horizontal>
  );
};

export default React.memo(ObjectAdder);
