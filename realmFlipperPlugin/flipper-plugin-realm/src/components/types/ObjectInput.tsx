import { ClearOutlined } from '@ant-design/icons';
import { Button, Col, Menu, Modal, Row, Tag } from 'antd';
import { usePlugin, useValue, Layout } from 'flipper-plugin';
import React, { useState } from 'react';
import { plugin } from '../..';
import { RealmObject } from '../../CommonTypes';
import { RealmQueryLanguage } from '../../pages/RealmQueryLanguage';
import { TypeInputProps } from './TypeInput';

export const ObjectInput = ({
  property,
  set,
}: // value,
TypeInputProps) => {
  const instance = usePlugin(plugin);
  const { schemas } = useValue(instance.state);

  const [value, setValue] = useState<RealmObject>();
  const [chosen, setChosen] = useState(false);
  const [visible, setVisible] = useState(false);

  const targetSchema = schemas.find(
    (schema) => schema.name === property.objectType
  );

  if (!targetSchema) {
    return <>Object has no objectType</>;
  }

  const renderChosen = () => {
    const val = value[targetSchema.primaryKey];
    const content = `${targetSchema?.primaryKey}: ${val}`;
    return (
      <Row style={{ width: '100%', backgroundColor: 'white' }} align="middle">
        <Col>
        <Tag color="success">
            {targetSchema?.name}
        </Tag>
        </Col>
        <Col flex="auto">{content}</Col>
        <Col>
          <Button
            icon={<ClearOutlined />}
            onClick={() => {
              set(null);
              setChosen(false);
            }}
          ></Button>
        </Col>
      </Row>
    );
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
    };

    const chooseOption = (row: RealmObject) => (
      <Menu>
        <Menu.Item key={1} onClick={() => onChosen(row)}>
          Choose the object
        </Menu.Item>
      </Menu>
    );

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
            <RealmQueryLanguage
              schema={targetSchema}
              renderOptions={chooseOption}
            />
          </Layout.Container>
        </Modal>
      </Layout.Container>
    );
  };

  return chosen ? renderChosen() : renderSelector();
};
