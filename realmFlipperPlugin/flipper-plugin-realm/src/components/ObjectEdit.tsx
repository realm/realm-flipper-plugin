import { Modal } from 'antd';
import React, { useState } from 'react';
import { plugin } from '..';
import { RealmObject, SchemaObject } from '../CommonTypes';
import { PropertiesModify } from './PropertiesModify';
import { usePlugin } from 'flipper-plugin';

type InputType = {
  schema: SchemaObject;
  initialObject: RealmObject;
  setVisible: (value: boolean) => void;
  visible: boolean;
};

export const ObjectEdit = ({ schema, initialObject, setVisible, visible }: InputType) => {
    // const [visible, setVisible] = useState(false);
    const [value, setValue] = useState(initialObject);
    const { modifyObject } = usePlugin(plugin);

    const onOk = () => {
        console.log('onOk');
        modifyObject(value);
        hideModal();
    }

    const hideModal = () => {
        setVisible(false);
        // setEditingObject(false);
    }
    return (
        <Modal visible={visible} title={'Modify ' + schema.name} onOk={onOk} onCancel={hideModal}>
            <PropertiesModify schema={schema} initialObject={value}></PropertiesModify>
        </Modal>
    )
};
