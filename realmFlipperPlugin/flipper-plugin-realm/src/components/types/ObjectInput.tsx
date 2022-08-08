import { Button, Menu, Modal } from 'antd';
import { TableRowSelection } from 'antd/lib/table/interface';
import { usePlugin, useValue, Layout } from 'flipper-plugin';
import React, { useState } from 'react';
import { plugin } from '../..';
import { RealmObject, SchemaObject, SchemaProperty } from '../../CommonTypes';
import { RealmQueryLanguage } from '../../pages/RealmQueryLanguage';
import { StringInput } from './StringInput';
import { TypeInputProps } from './TypeInput';

export const ObjectInput = ({
  property,
  set,
  style,
  // value,
}: TypeInputProps) => {
  const [_, setReset] = useState(false);
  const [value, setValue] = useState<RealmObject>();
  const [chosen, setChosen] = useState(false);
  const [visible, setVisible] = useState(false);
  const instance = usePlugin(plugin);
  const state = useValue(instance.state);
  const targetSchema = state.schemas.find(
    (schema) => schema.name === property.objectType
  );
  console.log('targetSchema', targetSchema)
  if (!targetSchema) {
    return <>Object has no objectType</>
  }
  // console.log('targetSchema', targetSchema)
  // print chosen object
  const renderChosen = () => {
    // console.log('renderChosen', value[targetSchema.primaryKey])
    if (chosen) {
      const val = value[targetSchema.primaryKey].text;
      const content = `[${targetSchema?.name}].${targetSchema?.primaryKey}: ${val}`
      return (
      <>{content}</>
      )
    }
    else {
    }
  };
  // style={{ width: '400px', height: '800px' }}
  const renderSelector = () => {
    const onOk = () => {
      setChosen(true);
      setVisible(false);
    };
    const onCancel = () => {
      setVisible(false);
    };
    const onChosen = (object: RealmObject) => {
      setValue(object);
      set(object);
      setChosen(true);
      setVisible(false);  
    }

    const chooseOption = (
      row: RealmObject
    ) => (
      <Menu>
        <Menu.Item key={1} onClick={() => onChosen(row)}>Choose the object</Menu.Item>
      </Menu>
    )
    
    return (
      <Layout.Container grow>
        <Button onClick={() => setVisible(true)}>
          Select {property.objectType}
        </Button>
        <Modal
          onOk={onOk}
          onCancel={onCancel}
          forceRender
          visible={visible}
          width={800}
        >
          <Layout.Container grow>
            <RealmQueryLanguage schema={targetSchema} renderOptions={chooseOption}/>
          </Layout.Container>
        </Modal>
      </Layout.Container>
    );
  };

  return chosen ? renderChosen() : renderSelector();
};
