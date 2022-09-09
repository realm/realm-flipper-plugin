import { Modal, Radio } from 'antd';
import { useState } from 'react';
import { RealmObject, SchemaObject } from '../../CommonTypes';

import { PlusOutlined } from '@ant-design/icons';
import { Layout, usePlugin } from 'flipper-plugin';
import React from 'react';
import { plugin } from '../..';
import { PropertiesModify } from './PropertiesModify';

type PropertyType = {
  schema: SchemaObject;
};

export const ObjectAdd = ({ schema }: PropertyType) => {
  const { addObject } = usePlugin(plugin);

  const [values, setValues] = useState<RealmObject>({});
  const [visible, setVisible] = useState(false);

  const showModal = () => {
    setValues({});
    setVisible(true);
  };

  const hideModal = () => {
    setValues({});
    setVisible(false);
  };

  const onOk = () => {
    addObject(values);
    hideModal();
  };

  if (!schema) {
    return <></>;
  }

  return (
    <Layout.Horizontal
      style={{ padding: 7, justifyContent: 'right', marginLeft: 'auto', marginRight: 7 }}
    >
      <Radio.Group>
        <Radio.Button type="primary" onClick={showModal}>
          {<PlusOutlined />} Create {schema.name}
        </Radio.Button>
      </Radio.Group>
      <Modal
        title={'Create ' + schema.name}
        visible={visible}
        onOk={onOk}
        onCancel={hideModal}
        okText="Create"
        cancelText="Cancel"
        destroyOnClose
      >
        <PropertiesModify schema={schema} value={values} setValue={setValues} />
      </Modal>
    </Layout.Horizontal>
  );
};
