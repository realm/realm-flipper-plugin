import React from "react";

import { Layout, DataInspector, DetailSidebar } from "flipper-plugin";
import { Dropdown, Menu, Radio, Table, Tooltip, Tag } from "antd";
import { SchemaPropertyValue, SchemaResponseObject } from "../index";
import ObjectAdder from "../components/ObjectAdder";
import { parseRows } from "../utils/Parser";
import EditableTable from "../components/EditableTable";
import { ColumnTitle } from "../components/ColumnTitle";
import { useState } from "react";
import { RealmDataInspector } from "../components/RealmDataInspector";
import PageSizeSelect from "../components/PageSizeSelect";
import DataPagination from "../components/DataPagination";

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

  const [inspectData, setInspectData] = useState({});
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
              <Radio.Button onClick={() => setShowSidebar(false)}>
                {" "}
                Close{" "}
              </Radio.Button>
            </Radio.Group>
            <DataInspector
              data={inspectData}
              expandRoot={true}

            />
            {/* <RealmDataInspector inspectData={inspectData} /> */}
            {/*<Layout.Container>
            <DataInspector data={[inspectData]} expandRoot={true} />
          </Layout.Container>{" "} */}
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
            setInspectData({ schema });
            setShowSidebar(true);
          }}
        >
          Inspect Schema
        </Menu.Item>
        <Menu.Item
          key={3}
          onClick={() => {
            setInspectData({ schemaProperty });
            setShowSidebar(true);
          }}
        >
          Inspect Schema Property
        </Menu.Item>
        <Menu.Item
          key={4}
          onClick={() => {
            // const linkedObjectSchema: SchemaResponseObject | undefined = props.schemas.find(schema => schema.name === schemaProperty.objectType)

            // linkedObjectSchema === undefined ?  {setInspectData({ [schemaProperty.name]: row[schemaProperty.name] })
            // setShowSidebar(true)}
            // :
            // null

            setInspectData({ [schemaProperty.name]: row[schemaProperty.name] });
            setShowSidebar(true);
          }}
        >
          Inspect Cell
        </Menu.Item>
        <Menu.Item
          key={5}
          onClick={() => {
            setInspectData({ row });
            setShowSidebar(true);
          }}
        >
          Inspect Row
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
              <Tooltip
                placement="topLeft"
                title={text}
                key={Math.floor(Math.random() * 10000000)}
              >
                {text}
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
        }      <Layout.Horizontal style={{
          paddingTop: 20,
          paddingBottom: 20,
        }}>
        <DataPagination></DataPagination>
        <PageSizeSelect></PageSizeSelect>
      </Layout.Horizontal>
      </Layout.Container>
    );
  }
}
