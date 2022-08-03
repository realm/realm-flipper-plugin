import React from "react";

import { Layout, DataInspector, DetailSidebar } from "flipper-plugin";
import { Dropdown, Menu, Radio, Table, Tooltip, Tag, Button } from "antd";
import { SchemaPropertyValue, SchemaResponseObject } from "../index";
import ObjectAdder from "../components/ObjectAdder";
import { parseRows } from "../utils/Parser";
import EditableTable from "../components/EditableTable";
import { ColumnTitle } from "../components/ColumnTitle";
import { useState } from "react";
import {
  SearchOutlined,
  CloseCircleOutlined,
  StepBackwardOutlined,
  StepForwardOutlined,
} from "@ant-design/icons";

let goBackStack: Array<Object> = [];
let goForwardStack: Array<Object> = [];

export default function DataVisualizer(props: {
  objects: Array<Object>;
  singleObject: Object;
  schemas: Array<SchemaResponseObject>;
  selectedSchema: String;
  addObject: Function;
  modifyObject: Function;
  removeObject: Function;
  getOneObject: Function;
}) {
  const getCurrentSchema = () => {
    return props.schemas.find((schema) => schema.name === props.selectedSchema);
  };

  const currentSchema = props.schemas.find(
    (schema) => schema.name === props.selectedSchema
  );

  const [inspectData, setInspectData] = useState();

  const [showSidebar, setShowSidebar] = useState(false);

  // Return buttons + tableView
  return (
    <Layout.ScrollContainer>
      <Layout.Container>
        <Radio.Group>
          {
            <ObjectAdder
              schema={getCurrentSchema()}
              addObject={props.addObject}
            />
          }
        </Radio.Group>
      </Layout.Container>
      <Layout.Container>
        <TableView />
        {showSidebar ? (
          <DetailSidebar>
            <div>Inspector</div>
            <Radio.Group>
              <Button
                icon={<CloseCircleOutlined />}
                onClick={() => setShowSidebar(false)}
              />

              <Button
                icon={<StepBackwardOutlined />}
                onClick={() => goBackInspector()}
              />
              <Button
                icon={<StepForwardOutlined />}
                onClick={() => goForwardInspector()}
              />
            </Radio.Group>
            <DataInspector
              data={inspectData}
              expandRoot={true}
              collapsed={true}
              onRenderName={(path, name) => {
                let linkedSchema = undefined;
                if (
                  currentSchema !== undefined &&
                  currentSchema.properties[name] !== undefined &&
                  "objectType" in currentSchema.properties[name]
                ) {
                  console.log(currentSchema?.properties[name].objectType);

                  linkedSchema = props.schemas.find(
                    (schema) =>
                      schema.name === currentSchema?.properties[name].objectType
                  );
                }

                if (linkedSchema !== undefined) {
                  return (
                    <>
                      {name + " "}
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
          </DetailSidebar>
        ) : null}
      </Layout.Container>
    </Layout.ScrollContainer>
  );

  function TableView() {
    const currentSchema = props.schemas.find(
      (schema) => schema.name === props.selectedSchema
    );

    if (currentSchema === undefined) {
      return <Layout.Container>Please select schema.</Layout.Container>;
    }

    const deleteRow = (row: Object) => {
      props.removeObject(row);
    };

    const dropDown = (
      row: Object,
      schemaProperty: SchemaPropertyValue,
      schema: SchemaResponseObject
    ) => (
      <Menu>
        <Menu.Item key={1} onClick={() => deleteRow(row)}>
          Delete selected {currentSchema.name}{" "}
        </Menu.Item>
        <Menu.Item
          key={2}
          onClick={() => {
            setNewInspectData({ schema });
            showSidebar ? null : setShowSidebar(true);
          }}
        >
          Inspect Schema
        </Menu.Item>
        <Menu.Item
          key={3}
          onClick={() => {
            setNewInspectData({ schemaProperty });
            showSidebar ? null : setShowSidebar(true);
          }}
        >
          Inspect Schema Property
        </Menu.Item>
        <Menu.Item
          key={4}
          onClick={() => {
            let object = {};
            Object.keys(row).forEach((key) => {
              object[key] = row[key].value;
            });

            setNewInspectData({ object });
            showSidebar ? null : setShowSidebar(true);
          }}
        >
          Inspect Row
        </Menu.Item>
        <Menu.Item
          key={5}
          onClick={() => {
            const linkedObjectSchema: SchemaResponseObject | undefined =
              props.schemas.find(
                (schema) => schema.name === schemaProperty.objectType
              );

            setNewInspectData({
              [schemaProperty.name]: row[schemaProperty.name].value,
            });
            showSidebar ? null : setShowSidebar(true);
          }}
        >
          Inspect Cell
        </Menu.Item>
      </Menu>
    );

    const columnObjs = Object.keys(currentSchema.properties).map((propName) => {
      const property: SchemaPropertyValue = currentSchema.properties[propName];

      const objectType: string | undefined = property.objectType;
      const isPrimaryKey: boolean = currentSchema.primaryKey === property.name;

      return {
        title: () => {
          return (
            <ColumnTitle
              isOptional={property.optional}
              name={property.name}
              objectType={objectType}
              propertyType={property.type}
              isPrimaryKey={isPrimaryKey}
            />
          );
        },
        key: property.name,
        dataIndex: property.name,
        width: 300,
        ellipsis: {
          showTitle: false,
        },
        property,
        render: (text: any, row: Object) => {
          return (
            <Dropdown
              overlay={() => dropDown(row, property, currentSchema)}
              trigger={[`contextMenu`]}
            >
              <Tooltip placement="topLeft" title={text.text}>
                {text.text}
              </Tooltip>
            </Dropdown>
          );
        },
        sorter: (a: any, b: any) => {
          if (a[propName] > b[propName]) {
            return 1;
          } else if (a[propName] < b[propName]) {
            return -1;
          } else {
            return 0;
          }
        },
      };
    });

    const rowObjs = parseRows(props.objects, currentSchema, props.schemas);

    return (
      <Layout.Container height={800}>
        {/* <Table dataSource={rowObjs} columns={columns}/> */}
        {
          <div>
            <EditableTable
              data={rowObjs}
              //@ts-ignore
              columns={columnObjs}
              primaryKey={currentSchema.primaryKey}
              modifyObject={props.modifyObject}
              schemaName={props.selectedSchema}
              removeObject={props.removeObject}
            ></EditableTable>
          </div>
        }
      </Layout.Container>
    );
  }

  function setNewInspectData(newInspectData: {}) {
    if (inspectData !== undefined) {
      goBackStack.push(inspectData);
      goForwardStack = [];
    }
    setInspectData(newInspectData);
  }

  function goBackInspector() {
    const data = goBackStack.pop();
    if (data !== undefined) {
      inspectData === undefined ? null : goForwardStack.push(inspectData);
      setInspectData(data);
    }
  }

  function goForwardInspector() {
    const data = goForwardStack.pop();
    if (data !== undefined) {
      inspectData === undefined ? null : goBackStack.push(inspectData);
      setInspectData(data);
    }
  }
}
