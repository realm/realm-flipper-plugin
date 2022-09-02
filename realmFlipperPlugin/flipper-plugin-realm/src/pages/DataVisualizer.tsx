import { Alert } from 'antd';
import { usePlugin } from 'flipper-plugin';
import React, { useEffect, useRef, useState } from 'react';
import { plugin } from '..';
import { RealmObject, SchemaObject, SchemaProperty } from '../CommonTypes';
import { DataTable, schemaObjToColumns } from '../components/DataTable';
import { FieldEdit } from '../components/objectManipulation/FieldEdit';
import { ObjectEdit } from '../components/objectManipulation/ObjectEdit';
import {
  RealmDataInspector,
  InspectionDataType,
} from '../components/RealmDataInspector';
import {
  CustomDropdown,
  DropdownPropertyType,
  MenuItemGenerator,
} from '../components/CustomDropdown';

type PropertyType = {
  objects: Array<RealmObject>;
  schemas: Array<SchemaObject>;
  currentSchema: SchemaObject | null;
  sortingDirection: 'ascend' | 'descend' | null;
  sortingColumn: string | null;
  hasMore: boolean;
  totalObjects: number;
  enableSort: boolean;
  clickAction?: (object: RealmObject) => void;
  fetchMore: () => void;
};

const DataVisualizer = ({
  objects,
  schemas,
  currentSchema,
  sortingDirection,
  sortingColumn,
  hasMore,
  totalObjects,
  enableSort,
  clickAction,
  fetchMore,
}: PropertyType) => {
  const [inspectionData, setInspectionData] = useState<InspectionDataType>();
  const [showSidebar, setShowSidebar] = useState(false);
  const [goBackStack, setGoBackStack] = useState<Array<InspectionDataType>>([]);
  const [goForwardStack, setGoForwardStack] = useState<
    Array<InspectionDataType>
  >([]);

  const [editingObject, setEditingObject] = useState<{
    editing: boolean;
    object?: unknown;
    // schemaProperty?: SchemaProperty;
    type?: 'field' | 'object';
    fieldName?: string;
  }>({
    editing: false,
  });

  const pluginState = usePlugin(plugin);
  const { removeObject, getOneObject, state, clearError } = pluginState;

  const scrollX = useRef(0);
  const scrollY = useRef(0);

  const handleDataInspector = (inspectionData: InspectionDataType) => {
    showSidebar ? null : setShowSidebar(true);
    setNewInspectionData(inspectionData);
  };

  const deleteRow = (row: RealmObject) => {
    removeObject(row);
  };

  const editField = (row: RealmObject, schemaProperty: SchemaProperty) => {
    setEditingObject({
      editing: true,
      object: row,
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

  /**  Generate MenuItem objects for the context menu with all necessary data and functions.*/
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
        handleDataInspector({
          data: {
            [schema.name]: object,
          },
          view: 'object',
        });
      },
    },
    {
      key: 2,
      text: 'Inspect Property',
      onClick: () => {
        handleDataInspector({
          data: {
            [schema.name + '.' + schemaProperty.name]: row[schemaProperty.name],
          },
          view: 'property',
        });
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

  /**  Managing dropdown properties.*/
  const [dropdownProp, setdropdownProp] = useState<DropdownPropertyType>({
      generateMenuItems,
    record: {},
    schemaProperty: null,
    visible: false,
    pointerX: 0,
    pointerY: 0,
    scrollX: 0,
    scrollY: 0,
  });

  /** Hook to close the dropdown when clicked outside of it. */
  useEffect(() => {
    const closeDropdown = () => {
      setdropdownProp({ ...dropdownProp, visible: false });
    };
    document.body.addEventListener('click', closeDropdown);
    return () => document.body.removeEventListener('click', closeDropdown);
  }, []);

  /** Handler to keep track of the current x and y position of the scrollcontainer. This is needed to render the dropdown in the correct place when scrolled. */
  const handleScroll = (event: React.BaseSyntheticEvent) => {
    const { scrollLeft, scrollTop } = event.target;
    scrollX.current = scrollLeft;
    scrollY.current = scrollTop;
  };

  if (!currentSchema) {
    return <div>Please select a schema.</div>;
  }

  if (!schemas || !schemas.length) {
    return <div>No schemas found. Check selected Realm.</div>;
  }

  /** Take the current dropdownProp and update it with the current x and y scroll values.
   This cannot be done with useState because it would cause too many rerenders.*/
  const updatedDropdownProp = {
    ...dropdownProp,
    scrollX: scrollX.current,
    scrollY: scrollY.current,
  };

  const columns = schemaObjToColumns(currentSchema);
  return (
    <div
      onScroll={handleScroll}
      style={{
        flex: `1 1 0`,
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'auto',
      }}
    >
      <div
        style={{
          position: 'absolute',
          height: '100%',
        }}
      >
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
        <DataTable
          columns={columns}
          objects={objects}
          schemas={schemas}
          hasMore={hasMore}
          sortingDirection={sortingDirection}
          sortingColumn={sortingColumn}
          currentSchema={currentSchema}
          totalObjects={totalObjects}
          generateMenuItems={generateMenuItems}
          getOneObject={getOneObject}
          setdropdownProp={setdropdownProp}
          dropdownProp={dropdownProp}
          scrollX={scrollX.current}
          scrollY={scrollY.current}
          handleDataInspector={handleDataInspector}
          enableSort={enableSort}
          fetchMore={fetchMore}
          clickAction={clickAction}
        />
        <CustomDropdown {...updatedDropdownProp} />
        <RealmDataInspector
          currentSchema={currentSchema}
          schemas={schemas}
          inspectionData={inspectionData}
          setInspectionData={setInspectionData}
          showSidebar={showSidebar}
          setShowSidebar={setShowSidebar}
          goBackStack={goBackStack}
          setGoBackStack={setGoBackStack}
          goForwardStack={goForwardStack}
          setGoForwardStack={setGoForwardStack}
          setNewInspectionData={setNewInspectionData}
        />
      </div>
    </div>
  );

  // update inspectionData and push object to GoBackStack
  function setNewInspectionData(newInspectionData: InspectionDataType) {
    if (inspectionData !== undefined) {
      goBackStack.push(inspectionData);
      setGoBackStack(goBackStack);
      setGoForwardStack([]);
    }
    setInspectionData(newInspectionData);
  }
};

export default DataVisualizer;
