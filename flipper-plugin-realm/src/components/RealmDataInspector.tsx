import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CloseOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { Button, Col, Layout, Radio, Row, Space, Tag, Tooltip } from 'antd';
import { DataInspector, DetailSidebar, Spinner } from 'flipper-plugin';
import React, { useEffect, useState } from 'react';
import { DeserializedRealmObject, PlainRealmObject, RealmObjectReference } from '../CommonTypes';
import { BoldSpan } from './SchemaSelect';

export type InspectionDataType = {
  data: PlainRealmObject | RealmObjectReference;
  // Whether the data specified is a reference to another object that needs to be lazy loaded.
  isReference: boolean;
  view: 'object' | 'schema' | 'property';
};

type RealmDataInspectorProps = {
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
  getObject: (object: RealmObjectReference) => Promise<DeserializedRealmObject | null>;
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
  getObject,
}: RealmDataInspectorProps) => {
  if (!showSidebar || inspectionData === undefined) return null;

  /** Utilities to trigger a brief flickering when the InspectionData is updated.
   * In some cases this makes it easier to see when the data changed. */
  const [flickering, setFlickering] = useState(false);
  const doFlicker = () => {
    if(inspectionData.isReference && inspectionData.data != null) {
      getObject(inspectionData.data as RealmObjectReference).then((loadedObject) => {
        if(loadedObject === null) {
          // TODO: Better handling.
          return;
        }
        setInspectionData({
          data: {
            [inspectionData.data.objectType as string]:
            loadedObject.realmObject,
          },
          view: inspectionData.view,
          isReference: false,
        })
      })
      return;
    } else if(!inspectionData.isReference) {
      // Do not flicker when referenced data is being fetched.
      setFlickering(true);
      setTimeout(() => setFlickering(false), 5);
    }
  };
  useEffect(doFlicker, [inspectionData]);
  const flickerStyle = {
    backgroundColor: flickering ? '#6932c9' : 'transparent',
  };

  // // TODO: not sure if this is best way to go about this.
  // let formattedObjects: any = {};
  // Object.entries(inspectionData.data).forEach(([field, fieldValue]) => {
  //   if (typeof fieldValue === "object" && fieldValue.objectKey && fieldValue.objectType) {
  //     formattedObjects[field] = `[${fieldValue.objectType}]._objectKey=${fieldValue.objectKey}`
  //   } else {
  //     formattedObjects[field] = fieldValue;
  //   }
  // })

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
              {inspectionData.isReference ? <Spinner /> :
              /* @ts-expect-error See https://github.com/facebook/flipper/issues/3996 */
              <DataInspector
                data={inspectionData.data}
                expandRoot={true}
                collapsed={false}
                onRenderName={(path, name) => {
                  // Finding out if the currently rendered value has a schema belonging to it and assigning it to linkedSchema
                  let ownSchema: Realm.CanonicalObjectSchema | undefined;
                  let linkedSchema: Realm.CanonicalObjectSchema | undefined = schemas.find(
                    (schema) => schema.properties[name]
                  );
                  if(linkedSchema) {
                    ownSchema = schemas.find(
                      (
                        innerSchema // And there exists some schema that fits the objectType of that property
                      ) =>
                        linkedSchema && linkedSchema.properties[name].objectType ===
                        innerSchema.name
                    )
                  }
                  // If there is a linked existing, non-embedded schema on the property then this is a linked object
                  const isLinkedObject = linkedSchema && ownSchema && !ownSchema.embedded

                  // If this is a linked object field and there is a value assigned to it, add a clickable reference.
                  if (isLinkedObject && traverseThroughObject<RealmObjectReference>(inspectionData.data, path)) {
                    return (
                      <>
                        {name + ' '}
                        <Tag color="processing">Ref</Tag>
                        <Tooltip title="Inspect Referenced Object" placement="topLeft">
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
                              const traversedObject = traverseThroughObject<RealmObjectReference | PlainRealmObject>(inspectionData.data, path)
                              setNewInspectionData({
                                data: traversedObject,
                                view: 'object',
                                isReference: true,
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
              />}
            </Col>
          </Row>
        </Layout>
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
