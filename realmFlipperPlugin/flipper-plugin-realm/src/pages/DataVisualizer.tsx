import React from 'react';

import { Layout } from 'flipper-plugin';
import { Menu, Radio } from 'antd';
import { SchemaPropertyValue, SchemaResponseObject } from '../index';
import ObjectAdder from '../components/ObjectAdder';
import { useState } from 'react';
import { DataTable } from '../components/DataTable';
import { RealmDataInspector } from '../components/RealmDataInspector';
import { AddObject, ObjectRequest } from '../index';
import DataPagination from '../components/DataPagination';
import PageSizeSelect from '../components/PageSizeSelect';

export default function DataVisualizer(props: {
  objects: Array<Object>;
  singleObject: Object;
  schemas: Array<SchemaResponseObject>;
  selectedSchema: string;
  addObject: (object: AddObject) => Promise<any>;
  modifyObject: (newObject: AddObject) => Promise<any>;
  removeObject: (object: AddObject) => Promise<any>;
  getOneObject: (data: ObjectRequest) => Promise<Object[]>;
}) {
  const [inspectData, setInspectData] = useState<Object>();
  const [showSidebar, setShowSidebar] = useState(false);

  const [goBackStack, setGoBackStack] = useState<
    Array<Object>
  >([]);
  const [goForwardStack, setGoForwardStack] = useState<
    Array<Object>
  >([]);

  const getCurrentSchema = () => {
    return props.schemas.find((schema) => schema.name === props.selectedSchema);
  };

  const currentSchema = getCurrentSchema();

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
          Delete selected {schema.name}{' '}
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
            const object = {};
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
        <Layout.Horizontal
          style={{
            paddingBottom: 10,
            paddingTop: 15,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <DataPagination></DataPagination>
          <PageSizeSelect></PageSizeSelect>
        </Layout.Horizontal>
        <DataTable
          columns={columns}
          objects={props.objects}
          schemas={props.schemas}
          sortDirection={props.sortDirection}
          sortingColumn={props.sortingColumn}
          selectedSchema={props.selectedSchema}
          loading={props.loading}
          renderOptions={dropDown}
        />
        <Layout.Horizontal
          style={{
            paddingTop: 20,
            paddingBottom: 20,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <DataPagination></DataPagination>
          <PageSizeSelect></PageSizeSelect>
        </Layout.Horizontal>
      </Layout.Container>
    );
  }

  function setNewInspectData(newInspectData: Object) {
    if (inspectData !== undefined) {
      goBackStack.push(inspectData);
      setGoBackStack(goBackStack);
      setGoForwardStack([]);
    }
    setInspectData(newInspectData);
  }
}
