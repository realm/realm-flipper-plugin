import React from 'react';
import { DataInspector, DetailSidebar } from 'flipper-plugin';
import {
  Radio,
  Tooltip,
  Button,
  Layout,
  Row,
  Col,
  Space,
  Typography,
} from 'antd';
import {
  SearchOutlined,
  CloseCircleOutlined,
  StepBackwardOutlined,
  StepForwardOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import { SchemaResponseObject } from '..';
import { BoldSpan } from '../components/RealmSchemaSelect';

type PropsType = {
  currentSchema: SchemaResponseObject;
  schemas: SchemaResponseObject[];
  inspectData?: Object;
  setInspectData: (value: Object) => void;
  showSidebar: boolean;
  setShowSidebar: (value: boolean) => void;
  goBackStack: Array<Object>;
  setGoBackStack: (value: Array<Object>) => void;
  goForwardStack: Array<Object>;
  setGoForwardStack: (value: Array<Object>) => void;
  setNewInspectData: (value: Array<Object>) => void;
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
        <Layout style={{ backgroundColor: 'white' }}>
          <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
            <Row gutter={16}>
              <Col span={24} offset={1}>
                <BoldSpan>Inspector </BoldSpan>
              </Col>
            </Row>
            <Row gutter={8}>
              <Col span={10} offset={1}>
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
          </Space>
        </Layout>
        {/* </Header> */}
        {/* <Content> */}
        <Layout style={{ backgroundColor: 'white' }}>
          <Row>
            <Col offset={1} span={22}>
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
                        schema.name ===
                        currentSchema?.properties[name].objectType
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
                              path.forEach((key) => (object = object[key]));
                              console.log(object);
                              setNewInspectData({
                                [linkedSchema.name]: object
                              });
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
            </Col>
          </Row>
        </Layout>
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
