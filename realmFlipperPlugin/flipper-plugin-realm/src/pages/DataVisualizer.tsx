import React from 'react';
import { Menu, Modal } from 'antd';
import { Layout } from 'flipper-plugin';
import { useState } from 'react';
import { RealmObject, SchemaObject, SchemaProperty } from '../CommonTypes';
import { DataTable, schemaObjToColumns } from '../components/DataTable';
import { RealmDataInspector } from '../components/RealmDataInspector';
import { plugin } from '..';
import { usePlugin } from 'flipper-plugin';
import { ObjectEdit } from '../components/objectManipulation/ObjectEdit';
import { FieldEdit } from '../components/objectManipulation/FieldEdit';

type PropertyType = {
  objects: Array<RealmObject>;
  schemas: Array<SchemaObject>;
  currentSchema: SchemaObject | null;
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

  const [editingObject, setEditingObject] = useState<{
    editing: boolean;
    object?: unknown;
    // schemaProperty?: SchemaProperty;
    type?: 'field' | 'object';
    fieldName?: string;
  }>({
    editing: false,
  });

  const { removeObject, getOneObject } = usePlugin(plugin);

  if (!currentSchema) {
    return <div>Please select a schema.</div>;
  }

  if (!schemas || !schemas.length) {
    return <div>No schemas found. Check selected Realm.</div>;
  }

  // Return buttons + tableView
  return (
    <Layout.Container grow>
      <Layout.ScrollContainer>
        <Layout.Container>
          {editingObject.editing && editingObject.type === 'object' ? (
            <ObjectEdit
              schema={currentSchema}
              initialObject={editingObject.object as RealmObject}
              setVisible={(val: boolean) => {
                setEditingObject((obj) => ({
                  ...obj,
                  editing: val,
                }));
              }}
              visible={editingObject.editing}
            ></ObjectEdit>
          ) : editingObject.editing && editingObject.type === 'field' ? (
            <FieldEdit
              schema={currentSchema}
              fieldName={editingObject.fieldName as string}
              setVisible={(val: boolean) => {
                setEditingObject((obj) => ({
                  ...obj,
                  editing: val,
                }));
              }}
              visible={editingObject.editing}
              value={editingObject.object}
            />
          ) : null}
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
    const deleteRow = (row: RealmObject) => {
      removeObject(row);
    };

    const editField = (row: RealmObject, schemaProperty: SchemaProperty) => {
      setEditingObject({
        editing: true,
        object: row[schemaProperty.name],
        type: 'field',
        fieldName: schemaProperty.name,
      });
    };
    const editObject = (row: RealmObject) => {
      setEditingObject({
        editing: true,
        object: row,
        type: 'object',
      });
    };
    const dropDown = (
      row: RealmObject,
      schemaProperty: SchemaProperty,
      schema: SchemaObject
    ) => (
      <Menu>
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
          Inspect Object
        </Menu.Item>
        <Menu.Item
          key={1}
          onClick={() => {
            setNewInspectData({
              [schema.name + '.' + schemaProperty.name]:
                row[schemaProperty.name],
            });
            setInspectorView('Inspector - Realm Object Property');
            showSidebar ? null : setShowSidebar(true);
          }}
        >
          Inspect Property
        </Menu.Item>
        <Menu.Item key={2} onClick={() => editObject(row)}>
          Edit Object
        </Menu.Item>
        <Menu.Item key={3} onClick={() => editField(row, schemaProperty)}>
          Edit Property
        </Menu.Item>

        <Menu.Item key={4} onClick={() => deleteRow(row)}>
          Delete Object
        </Menu.Item>
      </Menu>
    );

    const columns = schemaObjToColumns(currentSchema);
    return (
      <Layout.Container height={800}>
        <DataTable
          columns={columns}
          objects={objects}
          schemas={schemas}
          sortDirection={sortDirection}
          sortingColumn={sortingColumn}
          currentSchema={currentSchema}
          loading={loading}
          renderOptions={dropDown}
          getOneObject={getOneObject}
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

// export const createColumns = (currentSchema: SchemaObject) => {
//   return currentSchema.order.map((key) => {
//     const obj = currentSchema.properties[key];
//     const isPrimaryKey = obj.name === currentSchema.primaryKey;
//     return {
//       name: obj.name,
//       isOptional: obj.optional,
//       objectType: obj.objectType,
//       propertyType: obj.type,
//       isPrimaryKey: isPrimaryKey,
//     };
//   });
// };
