import { ClearOutlined } from '@ant-design/icons';
import { Button, Col, Menu, Modal, Row, Tag, Typography } from 'antd';
import { Layout, usePlugin, useValue } from 'flipper-plugin';
import React, { useState } from 'react';
import { plugin } from '../../..';
import { RealmObject } from '../../../CommonTypes';
import DataVisualizer from '../../../pages/DataVisualizer';
// import { RealmQueryLanguage } from '../../../pages/RealmQueryLanguage';
import { TypeInputProps } from './TypeInput';

export const ObjectInput = ({
  property,
  set,
  defaultValue,
  isPrimary,
}: TypeInputProps) => {
  console.log('objectInput defaultValue:', defaultValue);
  const instance = usePlugin(plugin);
  const { schemas, sortingDirection, sortingColumn, selectedRealm } = useValue(
    instance.state
  );

  const [value, setValue] = useState<RealmObject>(defaultValue as RealmObject);
  const [chosen, setChosen] = useState(!!value);
  const [visible, setVisible] = useState(false);
  const [objects, setObjects] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [cursorId, setCursorId] = useState(null);

  const targetSchema = schemas.find(
    (schema) => schema.name === property.objectType
  );

  if (!targetSchema) {
    return <>Target schema {property.objectType} not found</>;
  }

  const renderChosen = () => {
    const val = value[targetSchema.primaryKey];
    const content = `${targetSchema?.primaryKey}: ${val}`;
    return (
      <Row style={{ width: '100%' }} align="middle">
        <Col>
          <Tag color="success">{targetSchema?.name}</Tag>
        </Col>
        <Col flex="auto">{content}</Col>
        <Col>
          <Button
            disabled={isPrimary}
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
      if (!object) {
        return;
      }
      console.log((object))
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

    const openModal = () => {
      console.log('OPEN MODAL');
      setVisible(true);
      if (!targetSchema) {
        return;
      }
      instance
        .requestObjects(targetSchema.name, selectedRealm, null)
        .then((response) => {
          console.log('recevied', response);
          setObjects(response.objects);
          setHasMore(response.hasMore);
          setCursorId(response.nextCursor);
        });
    };

    return (
      <Layout.Container grow>
        <Button onClick={() => openModal()}>
          Select {property.objectType}
        </Button>
        <Modal
          onOk={onOk}
          onCancel={onCancel}
          forceRender
          visible={visible}
          width={800}
          closable={false}
        >
          <Layout.Container height={800}>
            <Typography.Title style={{marginBottom: "5px"}}>{targetSchema.name}</Typography.Title>
            <DataVisualizer
              objects={objects}
              sortingColumn={sortingColumn}
              sortingDirection={sortingDirection}
              schemas={schemas}
              currentSchema={targetSchema}
              hasMore={hasMore}
              doubleClickAction = {onChosen}
            ></DataVisualizer>
            {/* <RealmQueryLanguage
              schema={targetSchema}
              renderOptions={chooseOption}
            /> */}
          </Layout.Container>
        </Modal>
      </Layout.Container>
    );
  };

  return chosen ? renderChosen() : renderSelector();
};
