import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CloseOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { Button, Col, Layout, Radio, Row, Space, Tooltip } from 'antd';
import { DataInspector, DetailSidebar } from 'flipper-plugin';
import React from 'react';
import { SchemaResponseObject } from '..';

type PropsType = {
  currentSchema: SchemaResponseObject;
  schemas: SchemaResponseObject[];
  inspectData?: Record<string, unknown> | undefined;
  setInspectData: (value: Record<string, unknown>) => void;
  showSidebar: boolean;
  setShowSidebar: (value: boolean) => void;
  goBackStack: Array<Record<string, unknown>>;
  setGoBackStack: (value: Array<Record<string, unknown>>) => void;
  goForwardStack: Array<Record<string, unknown>>;
  setGoForwardStack: (value: Array<Record<string, unknown>>) => void;
  setNewInspectData: (value: Array<Record<string, unknown>>) => void;
};

export const RealmDataInspector = ({
  currentSchema,
  schemas,
  inspectData,
  setInspectData,
  showSidebar,
  setShowSidebar,
  goBackStack,
  setGoBackStack,
  goForwardStack,
  setGoForwardStack,
  setNewInspectData,
}: PropsType) => {
  if (!showSidebar) return null;

  console.log('goForwardStack');
  console.log(goForwardStack);
  console.log('goBackStack');
  console.log(goBackStack);

  const { Header, Content } = Layout;

  return (
    <DetailSidebar>
      {/* <Header style={{ backgroundColor: 'white' }}> */}
      <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
        <Row>
          <Col span={24}>Inspector</Col>
        </Row>
        <Row gutter={8}>
          <Col span={12}>
            <Radio.Group>
              <Radio.Button onClick={() => setShowSidebar(false)}>
                {' '}
                <CloseOutlined />
              </Radio.Button>
            </Radio.Group>
          </Col>
          <Col span={12} style={{ display: 'flex', justifyContent: 'end' }}>
            <Radio.Group>
              <Radio.Button onClick={() => goBackInspector()}>
                {' '}
                <ArrowLeftOutlined />
              </Radio.Button>

              <Radio.Button onClick={() => goForwardInspector()}>
                <ArrowRightOutlined />
              </Radio.Button>
            </Radio.Group>
          </Col>
        </Row>
        {/* </Header> */}
        {/* <Content> */}
        <Row>
          <DataInspector
            data={inspectData}
            expandRoot={true}
            collapsed={true}
            onRenderName={(path, name) => {
              let linkedSchema = undefined;
              if (
                currentSchema !== undefined &&
                currentSchema.properties[name] !== undefined &&
                'objectType' in currentSchema.properties[name]
              ) {
                console.log(currentSchema?.properties[name].objectType);

                linkedSchema = schemas.find(
                  (schema) =>
                    schema.name === currentSchema?.properties[name].objectType
                );
              }

              if (linkedSchema !== undefined) {
                return (
                  <>
                    {name + ' '}
                    <Tooltip title="Explore" placement="topLeft">
                      <Button
                        shape="circle"
                        type="primary"
                        size="small"
                        icon={<SearchOutlined />}
                        ghost
                        onClick={() => {
                          let object = inspectData;
                          path.forEach(
                            (key) =>
                              (object = object
                                ? (object[key] as Record<string, unknown>)
                                : {})
                          );
                          console.log(object);
                          setNewInspectData({ object });
                        }}
                      />
                    </Tooltip>
                  </>
                );
              }
              {
                return <>{name}</>;
              }
            }}
          />
        </Row>
        {/* </Content> */}
      </Space>
    </DetailSidebar>
  );

  function goBackInspector() {
    const data = goBackStack.pop();
    if (data !== undefined) {
      inspectData === undefined ? null : goForwardStack.push(inspectData);
      setInspectData(data);
    }
    setGoForwardStack(goForwardStack);
    setGoBackStack(goBackStack);
    console.log('goForwardStack');

    console.log(goForwardStack);
    console.log('goBackStack');

    console.log(goBackStack);
  }

  function goForwardInspector() {
    const data = goForwardStack.pop();
    if (data !== undefined) {
      inspectData === undefined ? null : goBackStack.push(inspectData);
      setInspectData(data);
    }
    setGoForwardStack(goForwardStack);
    setGoBackStack(goBackStack);
    console.log('goForwardStack');

    console.log(goForwardStack);
    console.log('goBackStack');

    console.log(goBackStack);
  }
};
