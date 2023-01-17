import { Modal } from 'antd';
import React, { useState } from 'react';
import { PropertiesModify } from './PropertiesModify';
import { usePlugin } from 'flipper-plugin';
import { plugin } from '../..';
import { DeserializedRealmObject, SortedObjectSchema } from '../../CommonTypes';

type InputType = {
  schema: SortedObjectSchema;
  initialObject: DeserializedRealmObject;
  setVisible: (value: boolean) => void;
  visible: boolean;
};

export const ObjectEdit = ({
  schema,
  initialObject,
  setVisible,
  visible,
}: InputType) => {
  const [value, setValue] = useState(initialObject);
  // Use a different state for modification to prevent updating the global state on cancellation.
  const [displayValue, setDisplayValue] = useState(structuredClone({...value}));
  const { modifyObject } = usePlugin(plugin);
  const [propsChanged, setPropsChanges] = useState<Set<string>>(new Set());
  const onOk = () => {
    setValue(displayValue);
    modifyObject(displayValue, propsChanged);
    hideModal();
  };

  const hideModal = () => {
    setVisible(false);
  };

  return (
    <Modal
      visible={visible}
      title={'Modify ' + schema.name}
      onOk={onOk}
      onCancel={hideModal}
      okText="Modify"
    >
      <PropertiesModify
        schema={schema}
        value={displayValue}
        setValue={setDisplayValue}
        setPropsChanges={setPropsChanges}
      />
    </Modal>
  );
};
