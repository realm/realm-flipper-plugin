import React from "react";

import { Layout, DataInspector, DetailSidebar } from "flipper-plugin";
import { Dropdown, Menu, Radio, Table, Tooltip, Tag } from "antd";
import { SchemaPropertyValue, SchemaResponseObject } from "../index";
import ObjectAdder from "../components/ObjectAdder";
import { parseRows } from "../utils/Parser";
import EditableTable from "../components/EditableTable";
import { ColumnTitle } from "../components/ColumnTitle";
import { useState } from "react";
//import { RealmDataInspector } from "../components/RealmDataInspector";
import PageSizeSelect from "../components/PageSizeSelect";
import DataPagination from "../components/DataPagination";

const DataVisualizer = (props: {
  objects: Array<Object>;
  singleObject: Object;
  schemas: Array<SchemaResponseObject>;
  selectedSchema: String;
  loading: boolean;
  sortDirection: 'ascend' | 'descend' | null;
  sortingColumn: string | null;
  addObject: Function;
  modifyObject: Function;
  removeObject: Function;
  getOneObject: Function;
}) => {
  const getCurrentSchema = () => {
    return props.schemas.find((schema) => schema.name === props.selectedSchema);
  };

  const [inspectData, setInspectData] = useState({});
  const [showSidebar, setShowSidebar] = useState(false);
  const sortableTypes = new Set(['string', 'int', 'uuid']);

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
                {' '}
                Close{' '}
              </Radio.Button>
            </Radio.Group>
            <DataInspector data={inspectData} expandRoot={true} />
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
          Delete selected {currentSchema.name}{' '}
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
            let object = {};
            Object.keys(row).forEach((key) => {
              object[key] = row[key].value;
            });

            setInspectData({ object });
            setShowSidebar(true);
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

            setInspectData({
              [schemaProperty.name]: row[schemaProperty.name].value,
            });
            setShowSidebar(true);
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
              <Tooltip
                placement="topLeft"
                title={text.text}
                key={Math.floor(Math.random() * 10000000)}
              >
                {text.text}
              </Tooltip>
            </Dropdown>
          );
        },
        sorter: sortableTypes.has(property.type), //TODO: false if object, list, set
        sortOrder:
          props.sortingColumn === propName ? props.sortDirection : null,
      };
    });

    const rowObjs = parseRows(props.objects, currentSchema, props.schemas);

    return (
      <Layout.Container height={800}>
        {/* <Table dataSource={rowObjs} columns={columns}/> */}
        {
          <div>
            <Layout.Horizontal
              style={{
                paddingTop: 20,
                paddingBottom: 20,
              }}
            >
              <DataPagination></DataPagination>
              <PageSizeSelect></PageSizeSelect>
            </Layout.Horizontal>
            <EditableTable
              data={rowObjs}
              //@ts-ignore
              columns={columnObjs}
              loading={props.loading}
              primaryKey={currentSchema.primaryKey}
              modifyObject={props.modifyObject}
              schemaName={props.selectedSchema}
              removeObject={props.removeObject}
            ></EditableTable>
          </div>
        }{' '}
        <Layout.Horizontal
          style={{
            paddingTop: 20,
            paddingBottom: 20,
          }}
        >
          <DataPagination></DataPagination>
          <PageSizeSelect></PageSizeSelect>
        </Layout.Horizontal>
      </Layout.Container>
    );
  }
};

export default React.memo(DataVisualizer);