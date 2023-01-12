import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CloseOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { Button, Col, Layout, Radio, Row, Space, Tooltip } from 'antd';
import { DataInspector, DetailSidebar } from 'flipper-plugin';
import React, { useEffect, useState } from 'react';
import { BoldSpan } from './SchemaSelect';

export type InspectionDataType = {
  data: Record<string, unknown>;
  view: 'object' | 'schema' | 'property';
};

type PropertyType = {
  schemas: Realm.CanonicalObjectSchema[];
  inspectionData: InspectionDataType | undefined;
  setInspectionData: React.Dispatch<
    React.SetStateAction<InspectionDataType | undefined>
  >;
  showSidebar: boolean;
  setShowSidebar: (value: boolean) => void;
  goBackStack: Array<InspectionDataType>;
  setGoBackStack: React.Dispatch<React.SetStateAction<InspectionDataType[]>>;
  goForwardStack: Array<InspectionDataType>;
  setGoForwardStack: React.Dispatch<React.SetStateAction<InspectionDataType[]>>;
  setNewInspectionData: (newInspectionData: InspectionDataType) => void;
};

// Helper function to traverse through a Realm object given a path
// Can return any type that a Realm Object could contain.
function traverseThroughObject<Type>(object: any, path: string[]) {
  let traversedObject: unknown = object;
  path.forEach(
    //@ts-expect-error We expect traversal path to be correct.
    (key) => (traversedObject = traversedObject[key])
  );
  return traversedObject as Type
}

export const RealmDataInspector = ({
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

  /** Utilities to trigger a brief flickering when the InspectionData is updated.
   * In some cases this makes it easier to see when the data changed. */
  const [flickering, setFlickering] = useState(false);
  const doFlicker = () => {
    setFlickering(true);
    setTimeout(() => setFlickering(false), 5);
  };
  useEffect(doFlicker, [inspectionData]);
  const flickerStyle = {
    backgroundColor: flickering ? '#6932c9' : 'transparent',
  };

  return (
    <DetailSidebar>
      <Space direction="vertical" size="middle" style={flickerStyle}>
        <Layout style={flickerStyle}>
          <Space
            direction="vertical"
            size="middle"
            style={{ display: 'flex', ...flickerStyle }}
          >
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
              <Col
                span={12}
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '5px',
                  padding: '5px',
                }}
              >
                {/* <Radio.Group> */}
                <Button
                  disabled={!goBackStack.length}
                  onClick={() => goBackInspector()}
                >
                  <ArrowLeftOutlined />
                </Button>

                <Button
                  disabled={!goForwardStack.length}
                  onClick={() => goForwardInspector()}
                >
                  <ArrowRightOutlined />
                </Button>
                {/* </Radio.Group> */}
              </Col>
            </Row>
          </Space>
        </Layout>

        <Layout style={flickerStyle}>
          <Row>
            <Col offset={1} span={22}>
              {/* @ts-expect-error See https://github.com/facebook/flipper/issues/3996 */}
              <DataInspector
                data={inspectionData.data}
                expandRoot={true}
                collapsed={false}
                onRenderName={(path, name) => {
                  // Finding out if the currently rendered value has a schema belonging to it and assigning it to linkedSchema
                  let linkedSchema: Realm.CanonicalObjectSchema | undefined = schemas.find(
                    (schema) =>
                      schema.properties[name] && // The schema has the currently rendered property
                      schemas.find(
                        (
                          innerSchema // And there is a schema that fits the objectType of that property
                        ) =>
                          schema.properties[name].objectType ===
                          innerSchema.name
                      )
                  );

                  // If the current field is named objectType find the Realm.ObjectSchema corresponding to its value (if there is one) and assign it to linkedSchema.
                  // Traverse the current inspection data using path to get the linkedSchemaName.
                  if (name === 'objectType' && inspectionData.data) {
                    let linkedSchemaName = traverseThroughObject<string>(inspectionData.data, path) 

                    linkedSchema = schemas.find(
                      (schema) => schema.name === linkedSchemaName
                    );
                  }

                  // If there is a schema for the object to be rendered.
                  if (linkedSchema !== undefined) {
                    // Deprecated code for inspecting schemas. Might be relevant later when implementing DataInspector into schemas tab
                    // if (name === 'objectType') {
                    //   return (
                    //     <>
                    //       {name + ' '}
                    //       <Tooltip title="Explore Schema" placement="topLeft">
                    //         <Button
                    //           shape="circle"
                    //           type="primary"
                    //           size="small"
                    //           icon={<SearchOutlined />}
                    //           ghost
                    //           onClick={() => {
                    //             setNewInspectionData({
                    //               data: {
                    //                 [linkedSchema.name]: linkedSchema,
                    //               },
                    //               view: 'schema',
                    //             });
                    //           }}
                    //         />
                    //       </Tooltip>
                    //     </>
                    //   );
                    // }

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
                            onClick={(event) => {
                              event.stopPropagation();
                              if (!linkedSchema) {
                                return;
                              }
                              
                              let traversedObject = traverseThroughObject<any>(inspectionData.data, path)
                              setNewInspectionData({
                                data: {
                                  [linkedSchema.name]: traversedObject,
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
  }

  function goForwardInspector() {
    const data = goForwardStack.pop();
    if (data !== undefined) {
      inspectionData === undefined ? null : goBackStack.push(inspectionData);
      setInspectionData(data);
    }
    setGoForwardStack(goForwardStack);
    setGoBackStack(goBackStack);
  }
};
