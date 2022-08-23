import React, { useEffect, useRef } from 'react';
import { Layout } from 'flipper-plugin';
import { useState } from 'react';
import { RealmObject, SchemaObject, SchemaProperty } from '../CommonTypes';
import { DataTable, schemaObjToColumns } from '../components/DataTable';
import { RealmDataInspector } from '../components/RealmDataInspector';
import { plugin } from '..';
import { usePlugin } from 'flipper-plugin';
import { ObjectEdit } from '../components/objectManipulation/ObjectEdit';
import { FieldEdit } from '../components/objectManipulation/FieldEdit';
import {
  CustomDropdown,
  DropdownPropertyType,
  MenuItemGenerator,
} from '../components/CustomDropdown';

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

  const scrollX = useRef(0);
  const scrollY = useRef(0);

  const { removeObject, getOneObject } = usePlugin(plugin);

  // Generate MenuItem objects for the context menu with all necessary data and functions.
  const generateMenuItems: MenuItemGenerator = (
    row: RealmObject,
    schemaProperty: SchemaProperty,
    schema: SchemaObject
  ) => [
    {
      key: 1,
      text: 'Inspect Object',
      onClick: () => {
        const object = {};
        Object.keys(row).forEach((key) => {
          object[key] = row[key];
        });
        setInspectorView('Inspector - Realm Object');
        setNewInspectData({ [schema.name]: object });
        showSidebar ? null : setShowSidebar(true);
      },
    },
    {
      key: 2,
      text: 'Inspect Property',
      onClick: () => {
        setNewInspectData({
          [schema.name + '.' + schemaProperty.name]: row[schemaProperty.name],
        });
        setInspectorView('Inspector - Realm Object Property');
        showSidebar ? null : setShowSidebar(true);
      },
    },
    {
      key: 3,
      text: 'Edit Object',
      onClick: () => editObject(row),
    },
    {
      key: 4,
      text: 'Edit Property',
      onClick: () => editField(row, schemaProperty),
    },
    {
      key: 5,
      text: 'Delete Object',
      onClick: () => deleteRow(row),
    },
  ];

  // Utilities for opening and closing the context menu.
  const [dropdownProp, setdropdownProp] = useState<DropdownPropertyType>({
    generateMenuItems,
    record: {},
    schemaProperty: null,
    // currentSchema: currentSchema,
    visible: false,
    x: 100,
    y: 100,
    scrollX: 0,
    scrollY: 0,
  });

  useEffect(() => {
    const closeDropdown = () => {
      setdropdownProp({ ...dropdownProp, visible: false });
    };
    document.body.addEventListener('click', closeDropdown);
    return () => document.body.removeEventListener('click', closeDropdown);
  }, []);

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

  if (!currentSchema) {
    return <div>Please select a schema.</div>;
  }

  if (!schemas || !schemas.length) {
    return <div>No schemas found. Check selected Realm.</div>;
  }

  const handleScroll = (event) => {
    // console.log(event), console.log(window);
    const { scrollLeft, scrollTop } = event.target;

    // console.log(scrollTop);
    scrollX.current = scrollLeft;
    scrollY.current = scrollTop;

    // console.log('scrollX.current', scrollX.current);
    // console.log('scrollY.current', scrollY.current);
  };

  // Return buttons + tableView
  return (
    <Layout.Container grow>
      <Layout.ScrollContainer onScroll={handleScroll}>
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
    const prop = { ...dropdownProp, generateMenuItems, scrollX : scrollX.current, scrollY:scrollY.current };

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
          generateMenuItems={generateMenuItems}
          getOneObject={getOneObject}
          setdropdownProp={setdropdownProp}
          dropdownProp={dropdownProp}
        />
        <CustomDropdown {...prop} />
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
