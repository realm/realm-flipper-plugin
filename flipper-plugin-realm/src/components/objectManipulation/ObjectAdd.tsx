import { Modal, Radio } from 'antd';
import { useState } from 'react';

import { PlusOutlined } from '@ant-design/icons';
import { Layout, usePlugin } from 'flipper-plugin';
import React from 'react';
import { plugin } from '../..';
import { PropertiesModify } from './PropertiesModify';
import { DeserializedRealmObject, SortedObjectSchema } from '../../CommonTypes';

type PropertyType = {
  schema: SortedObjectSchema;
};

export const ObjectAdd = ({ schema }: PropertyType) => {
  const { addObject } = usePlugin(plugin);

  const [values, setValues] = useState<DeserializedRealmObject | null>(null);
  const [visible, setVisible] = useState(false);

  const showModal = () => {
    setValues(null);
    setVisible(true);
  };

  const hideModal = () => {
    setValues(null);
    setVisible(false);
  };

  const onOk = () => {
    if (!values) {
      return;
    }
    addObject(values.realmObject);
    hideModal();
  };

  if (!schema || !values) {
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
