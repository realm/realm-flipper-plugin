import { ClearOutlined } from '@ant-design/icons';
import { Button, Col, Menu, Modal, Row, Tag, Typography } from 'antd';
import { Layout, usePlugin, useValue } from 'flipper-plugin';
import React, { useState } from 'react';
import { plugin } from '../../..';
import { ObjectsMessage, RealmObject } from '../../../CommonTypes';
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
  const [objects, setObjects] = useState<RealmObject[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setcursor] = useState<number | null>(null);
  const [totalObjects, setTotalObjects] = useState(0);

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
            onClick={(e) => {
              setObjects([]);
              setcursor(null);
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
      setObjects([])
      setcursor(null);
    };
    const onChosen = (object: RealmObject) => {
      if (!object) {
        return;
      }
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

    const fetchMore = () => {
      instance
        .requestObjects(targetSchema.name, selectedRealm, undefined, cursor)
        .then((response: ObjectsMessage) => {
          setObjects([...objects,...response.objects]);
          setHasMore(response.hasMore);
          setcursor(response.nextCursor);
          setTotalObjects(response.total);
        });
    }

    const openModal = () => {
      setVisible(true);
      if (!targetSchema) {
        return;
      }
      fetchMore();
    };

    return (
      <Layout.Container grow>
        <Button onClick={() => openModal()}>
          Select {property.objectType}
        </Button>
        <Modal
          onOk={onOk}
          onCancel={onCancel}
          forceRender={true}
          visible={visible}
          width={800}
          closable={false}
        >
          <Layout.Container height={800}>
            <Typography.Title style={{ marginBottom: '5px' }}>
              {targetSchema.name}
            </Typography.Title>
            <DataVisualizer
              objects={objects}
              sortingColumn={sortingColumn}
              sortingDirection={sortingDirection}
              schemas={schemas}
              currentSchema={targetSchema}
              hasMore={hasMore}
              totalObjects={totalObjects}
              clickAction={onChosen}
              fetchMore={fetchMore}
              enableSort={false}
            ></DataVisualizer>
          </Layout.Container>
        </Modal>
      </Layout.Container>
    );
  };

  return chosen ? renderChosen() : renderSelector();
};
