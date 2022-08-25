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
import { BoldSpan } from './SchemaSelect';

export type InspectionDataType = {
  data: RealmObject;
  view: 'object' | 'schema' | 'property';
};

type PropertyType = {
  currentSchema: SchemaObject;
  schemas: SchemaObject[];
  inspectionData: InspectionDataType;
  setInspectionData: (value: RealmObject) => void;
  showSidebar: boolean;
  setShowSidebar: (value: boolean) => void;
  goBackStack: Array<RealmObject>;
  setGoBackStack: (value: Array<RealmObject>) => void;
  goForwardStack: Array<RealmObject>;
  setGoForwardStack: (value: Array<RealmObject>) => void;
  setNewInspectionData: (newInspectionData: InspectionDataType) => void;
};

export const RealmDataInspector = ({
  currentSchema,
  schemas,
  inspectionData,
  setInspectionData,
  showSidebar,
  setShowSidebar,
  goBackStack,
  setGoBackStack,
  goForwardStack,
  setGoForwardStack,
  setNewInspectionData,
}: PropertyType) => {
  if (!showSidebar || inspectionData === undefined) return null;

console.log('inspectionData',inspectionData)

  console.log('goForwardStack');
  console.log(goForwardStack);
  console.log('goBackStack');
  console.log(goBackStack);

  return (
    <DetailSidebar>
      <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
        <Layout >
          <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
            <Row gutter={16}>
              <Col span={24} offset={1}>
                <BoldSpan>
                  {'Inspector - Realm ' + inspectionData.view}{' '}
                </BoldSpan>
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
              <Col span={12} style={{ display:'flex', justifyContent: 'flex-end', gap: '5px', padding:'5px' }}>
                {/* <Radio.Group> */}
                  <Button onClick={() => goBackInspector()}>
                    {' '}
                    <ArrowLeftOutlined />
                  </Button>

                  <Button onClick={() => goForwardInspector()}>
                    <ArrowRightOutlined />
                  </Button>
                {/* </Radio.Group> */}
              </Col>
            </Row>
          </Space>
        </Layout>

        <Layout>
          <Row>
            <Col offset={1} span={22}>
              <DataInspector
                data={inspectionData.data}
                expandRoot={true}
                collapsed={false}
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
                  // Assigning inspectionData to linkedSchemaName and then traverse it using path to get the linkedSchemaName.
                  if (name === 'objectType' && inspectionData.data) {
                    let linkedSchemaName: string | RealmObject =
                      inspectionData.data;
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
                                setNewInspectionData({
                                  data: {
                                    [linkedSchema.name]: linkedSchema,
                                  },
                                  view: 'schema',
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
                              let object = inspectionData.data;
                              path.forEach((key) => (object = object[key]));
                              console.log(object);
                              setNewInspectionData({
                                data: {
                                  [linkedSchema.name]: object,
                                },
                                view: 'object',
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
      inspectionData === undefined ? null : goForwardStack.push(inspectionData);
      setInspectionData(data);
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
      inspectionData === undefined ? null : goBackStack.push(inspectionData);
      setInspectionData(data);
    }
    setGoForwardStack(goForwardStack);
    setGoBackStack(goBackStack);
    console.log('goForwardStack');

    console.log(goForwardStack);
    console.log('goBackStack');

    console.log(goBackStack);
  }
};
