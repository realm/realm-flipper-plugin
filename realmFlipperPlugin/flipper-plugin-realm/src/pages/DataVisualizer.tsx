import React from 'react';
import { Menu } from 'antd';
import { Layout } from 'flipper-plugin';
import { useState } from 'react';
import { RealmObject, SchemaObject, SchemaProperty } from '../CommonTypes';
import { DataTable } from '../components/DataTable';
import { RealmDataInspector } from '../components/RealmDataInspector';
import { plugin } from '..';
import { usePlugin } from 'flipper-plugin';

type PropertyType = {
  objects: Array<RealmObject>;
  schemas: Array<SchemaObject>;
  currentSchema: SchemaObject;
  sortDirection: 'ascend' | 'descend' | null;
  loading: boolean;
  sortingColumn: string | null;
};

export const DataVisualizer = ({
  objects,
  schemas,
  currentSchema,
  sortDirection,
  loading,
  sortingColumn,
}: PropertyType) => {
  const [inspectData, setInspectData] = useState<RealmObject>();
  const [inspectorView, setInspectorView] = useState<string>();
  const [showSidebar, setShowSidebar] = useState(false);
  const [goBackStack, setGoBackStack] = useState<Array<RealmObject>>([]);
  const [goForwardStack, setGoForwardStack] = useState<Array<RealmObject>>([]);
  const { removeObject } = usePlugin(plugin);

  if (currentSchema === undefined) {
    return <>Please select a schema.</>;
  }

  const { removeObject } = usePlugin(plugin);

  // Return buttons + tableView
  return (
    <Layout.Container grow>
      <Layout.ScrollContainer>
        <Layout.Container>
          <TableView />
          <RealmDataInspector
            currentSchema={currentSchema}
            schemas={schemas}
            inspectData={inspectData}
            setInspectData={setInspectData}
            showSidebar={showSidebar}
            setShowSidebar={setShowSidebar}
            goBackStack={goBackStack}
            setGoBackStack={setGoBackStack}
            goForwardStack={goForwardStack}
            setGoForwardStack={setGoForwardStack}
            setNewInspectData={setNewInspectData}
            view={inspectorView}
          />
        </Layout.Container>
      </Layout.ScrollContainer>
    </Layout.Container>
  );

  function TableView() {
    if (currentSchema === undefined) {
      return <>Please select a schema.</>;
    }

    const deleteRow = (row: RealmObject) => {
      removeObject(row);
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
            setInspectorView('Inspector - Realm Schema');
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
            setInspectorView('Inspector - Realm Schema Property');
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
              object[key] = row[key];
            });
            setInspectorView('Inspector - Realm Object');
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
                row[schemaProperty.name],
            });
            setInspectorView('Inspector - Realm Object Property');
            showSidebar ? null : setShowSidebar(true);
          }}
        >
          Inspect Cell
        </Menu.Item>
      </Menu>
    );

    const columns = currentSchema.order.map((key) => {
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
          objects={objects}
          schemas={schemas}
          sortDirection={sortDirection}
          sortingColumn={sortingColumn}
          selectedSchema={currentSchema.name}
          loading={loading}
          renderOptions={dropDown}
        />
      </Layout.Container>
    );
  }

  // update inspectData and push object to GoBackStack
  function setNewInspectData(newInspectData: RealmObject) {
    if (inspectData !== undefined) {
      goBackStack.push(inspectData);
      setGoBackStack(goBackStack);
      setGoForwardStack([]);
    }
    setInspectData(newInspectData);
  }
};
