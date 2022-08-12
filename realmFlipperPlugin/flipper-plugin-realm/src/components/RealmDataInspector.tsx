import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CloseOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { Button, Col, Layout, Radio, Row, Space, Tooltip } from 'antd';
import { DataInspector, DetailSidebar } from 'flipper-plugin';
import React from 'react';
import { RealmObject, SchemaObject } from '../CommonTypes';
import { BoldSpan } from '../components/RealmSchemaSelect';

type PropertyType = {
  currentSchema: SchemaObject;
  schemas: SchemaObject[];
  inspectData?: RealmObject;
  setInspectData: (value: RealmObject) => void;
  showSidebar: boolean;
  setShowSidebar: (value: boolean) => void;
  goBackStack: Array<RealmObject>;
  setGoBackStack: (value: Array<RealmObject>) => void;
  goForwardStack: Array<RealmObject>;
  setGoForwardStack: (value: Array<RealmObject>) => void;
  setNewInspectData: (value: RealmObject) => void;
  view: string;
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
  view,
}: PropertyType) => {
  if (!showSidebar) return null;

  console.log('goForwardStack');
  console.log(goForwardStack);
  console.log('goBackStack');
  console.log(goBackStack);

  return (
    <DetailSidebar>
      <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
        <Layout style={{ backgroundColor: 'white' }}>
          <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
            <Row gutter={16}>
              <Col span={24} offset={1}>
                <BoldSpan>{view} </BoldSpan>
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

        <Layout style={{ backgroundColor: 'white' }}>
          <Row>
            <Col offset={1} span={22}>
              <DataInspector
                data={inspectData}
                expandRoot={true}
                collapsed={true}
                onRenderName={(path, name) => {
                  let linkedSchema: SchemaObject | undefined = undefined;
                  if (
                    currentSchema && // The schema of the object that is currently rendered.
                    // If the property with the current name exists.
                    currentSchema.properties[name] &&
                    // If the current schema contains the field objectType, i.e. it is an object.
                    'objectType' in currentSchema.properties[name]
                  ) {
                    console.log(currentSchema?.properties[name].objectType);

                    // Find the schema the current object belongs to.
                    linkedSchema = schemas.find(
                      (schema) =>
                        schema.name ===
                        currentSchema?.properties[name].objectType
                    );
                  }

                  // If the current field is named objectType find the SchemaObject corresponding to its value (if there is one) and assign it to linkedSchema.
                  // Assigning inspectData to linkedSchemaName and then traverse it using path to get the linkedSchemaName.
                  if (name === 'objectType' && inspectData) {
                    let linkedSchemaName: string | RealmObject = inspectData;
                    path.forEach(
                      //@ts-ignore
                      (key) => (linkedSchemaName = linkedSchemaName[key])
                    );

                    linkedSchema = schemas.find(
                      (schema) => schema.name === linkedSchemaName
                    );
                  }

                  // If there is a schema for the object to be rendered.
                  if (linkedSchema !== undefined) {
                    if (name === 'objectType') {
                      return (
                        <>
                          {name + ' '}
                          <Tooltip title="Explore Schema" placement="topLeft">
                            <Button
                              shape="circle"
                              type="primary"
                              size="small"
                              icon={<SearchOutlined />}
                              ghost
                              onClick={() => {
                                console.log(linkedSchema);
                                setNewInspectData({
                                  [linkedSchema.name]: linkedSchema,
                                });
                              }}
                            />
                          </Tooltip>
                        </>
                      );
                    }

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
                                [linkedSchema.name]: object,
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
