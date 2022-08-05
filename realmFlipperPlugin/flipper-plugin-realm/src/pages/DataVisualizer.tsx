import React from 'react';

import { Layout } from 'flipper-plugin';
import { Menu, Radio } from 'antd';
import { SchemaProperty, SchemaObject, RealmObject } from "../CommonTypes";
import ObjectAdder from '../components/ObjectAdder';
import { useState } from 'react';
import { DataTable } from '../components/DataTable';
import { RealmDataInspector } from '../components/RealmDataInspector';
import { AddObject, ObjectRequest } from "../CommonTypes";
import DataPagination from '../components/DataPagination';
import PageSizeSelect from '../components/PageSizeSelect';

export default function DataVisualizer(props: {
  objects: Array<RealmObject>;
  singleObject: RealmObject;
  schemas: Array<SchemaObject>;
  selectedSchema: string;
  sortDirection: 'ascend' | 'descend' | null;
  loading: boolean;
  sortingColumn: string | null;
  addObject: (object: AddObject) => void;
  modifyObject: (newObject: AddObject) => void;
  removeObject: (object: RealmObject) => void;
  getOneObject: (data: ObjectRequest) => void;
}) {
  const [inspectData, setInspectData] = useState<RealmObject>();
  const [showSidebar, setShowSidebar] = useState(false);

  const [goBackStack, setGoBackStack] = useState<
    Array<RealmObject>
  >([]);
  const [goForwardStack, setGoForwardStack] = useState<
    Array<RealmObject>
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

    const deleteRow = (row: RealmObject) => {
      props.removeObject(row);
    };

    const dropDown = (
      row: RealmObject,
      schemaProperty: SchemaProperty,
      schema: SchemaObject
    ) => (
      <Menu>
        <Menu.Item key={1} onClick={() => deleteRow(row)}>
          Delete selected {schema.name}{' '}
        </Menu.Item>
        <Menu.Item
          key={2}
          onClick={() => {
            setNewInspectData({ [schema.name]: schema });
            showSidebar ? null : setShowSidebar(true);
          }}
        >
          Inspect Schema
        </Menu.Item>
        <Menu.Item
          key={3}
          onClick={() => {
            setNewInspectData({
              [schema.name + '.' + schemaProperty.name]: schemaProperty,
            });
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

            setNewInspectData({ [schema.name]: object });
            showSidebar ? null : setShowSidebar(true);
          }}
        >
          Inspect Row
        </Menu.Item>
        <Menu.Item
          key={5}
          onClick={() => {
            setNewInspectData({
              [schema.name + '.' + schemaProperty.name]:
                row[schemaProperty.name].value,
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

  function setNewInspectData(newInspectData: RealmObject) {
    if (inspectData !== undefined) {
      goBackStack.push(inspectData);
      setGoBackStack(goBackStack);
      setGoForwardStack([]);
    }
    setInspectData(newInspectData);
  }
}
