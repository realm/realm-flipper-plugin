import { Button, Modal } from 'antd';
import { usePlugin, useValue, Layout } from 'flipper-plugin';
import React, { useState } from 'react';
import { plugin } from '../..';
import { RealmQueryLanguage } from '../../pages/RealmQueryLanguage';
import { StringInput } from './StringInput';
import { TypeInputProps } from './TypeInput';

export const ObjectInput = ({
  property,
  set,
  style,
  value,
}: TypeInputProps) => {
  const [chosen, setChosen] = useState(false);
  const [visible, setVisible] = useState(false);
  const instance = usePlugin(plugin);
  const state = useValue(instance.state);
  const targetSchema = state.schemas.find(schema => schema.name === property.objectType);
  console.log('targetSchema', targetSchema)
  // print chosen object
  const renderChosen = () => {
    return <></>
  };
  // style={{ width: '400px', height: '800px' }}
  const renderSelector = () => {
    const onOk = () => {
        
        setChosen(true);
        setVisible(false);
    }
    const onCancel = () => {
        setVisible(false);
    }
    // <Layout style={{ overflow: 'auto' }}>
    return (
        <Layout.Container grow>
          <Button onClick={() => setVisible(true)}>
            Select {property.objectType}
          </Button>
          <Modal onOk={onOk} onCancel={onCancel} forceRender visible={visible} width={800}>
            <Layout.Container grow>
            <RealmQueryLanguage schema={targetSchema}/>
            </Layout.Container>
          </Modal>
        </Layout.Container>
      );
  };

  return chosen ? renderChosen() : renderSelector();
};
