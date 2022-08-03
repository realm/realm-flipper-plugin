import React from "react";

import { Layout, DataInspector, DetailSidebar } from "flipper-plugin";
import { Dropdown, Menu, Radio, Table, Tooltip, Tag, Button } from "antd";
import { SchemaPropertyValue, SchemaResponseObject } from "../index";
import ObjectAdder from "../components/ObjectAdder";
import { parseRows } from "../utils/Parser";
import EditableTable from "../components/EditableTable";
import { ColumnTitle } from "../components/ColumnTitle";
import { useState } from "react";
import { DataTable } from "../components/DataTable";
import {
  SearchOutlined,
  CloseCircleOutlined,
  StepBackwardOutlined,
  StepForwardOutlined,
} from "@ant-design/icons";
import { RealmDataInspector } from "../components/RealmDataInspector";

export default function DataVisualizer(props: {
  objects: Array<Object>;
  singleObject: Object;
  schemas: Array<SchemaResponseObject>;
  selectedSchema: string;
  addObject: Function;
  sortDirection: 'ascend' | 'descend' | null;
  sortingColumn: string | null;
  modifyObject: Function;
  removeObject: Function;
  getOneObject: Function;
}) {
  const [inspectData, setInspectData] = useState<Object>();
  const [showSidebar, setShowSidebar] = useState(false);

  const [goBackStack, setGoBackStack] = useState<Array<Object>>([]);
  const [goForwardStack, setGoForwardStack] = useState<Array<Object>>([]);

  const getCurrentSchema = () => {
    return props.schemas.find((schema) => schema.name === props.selectedSchema);
  };

  const currentSchema = getCurrentSchema();
  const sortableTypes = new Set(['string', 'int', 'uuid']);

  if (currentSchema === undefined) {
    return <>Please select a schema.</>;
  }

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
        <RealmDataInspector
          currentSchema={currentSchema}
          schemas={props.schemas}
          inspectData={inspectData}
          setInspectData={setInspectData}
          showSidebar={showSidebar}
          setShowSidebar={setShowSidebar}
          goBackStack={goBackStack}
          setGoBackStack={setGoBackStack}
          goForwardStack={goForwardStack}
          setGoForwardStack={setGoForwardStack}
          setNewInspectData={setNewInspectData}
        />
      </Layout.Container>
    </Layout.ScrollContainer>
  );

  function TableView() {
    if (currentSchema === undefined) {
      return <>Please select a schema.</>;
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
          Delete selected {schema.name}{" "}
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

    const columns = Object.keys(currentSchema.properties).map((key) => {
      const obj = currentSchema.properties[key];
      const isPrimaryKey = obj.name === currentSchema.primaryKey;
      return {
        name: obj.name,
        isOptional: obj.optional,
        objectType: obj.objectType,
        propertyType: obj.type,
        isPrimaryKey: isPrimaryKey,
      };
    });
    return (
      <Layout.Container height={800}>
        <DataTable
          columns={columns}
          objects={props.objects}
          schemas={props.schemas}
          selectedSchema={props.selectedSchema}
          renderOptions={dropDown}
        />
      </Layout.Container>
    );
  }

  function setNewInspectData(newInspectData: {}) {
    if (inspectData !== undefined) {
      goBackStack.push(inspectData);
      setGoBackStack(goBackStack);
      setGoForwardStack([]);
    }
    setInspectData(newInspectData);
    console.log("goForwardStack");
    console.log(goForwardStack);
    console.log("goBackStack");
    console.log(goBackStack);
  }
}