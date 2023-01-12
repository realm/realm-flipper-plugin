import { usePlugin } from 'flipper-plugin';
import React, { useEffect, useRef, useState } from 'react';
import { CanonicalObjectSchemaProperty } from 'realm';
import { plugin } from '..';
import { DropdownPropertyType, MenuItemGenerator, DeserializedRealmObject, SortedObjectSchema, PlainRealmObject, RealmObjectReference } from '../CommonTypes';
import {
  CustomDropdown,
} from '../components/CustomDropdown';
import { DataTable, schemaObjToColumns } from '../components/DataTable';
import { FieldEdit } from '../components/objectManipulation/FieldEdit';
import { ObjectEdit } from '../components/objectManipulation/ObjectEdit';
import {
  InspectionDataType,
  RealmDataInspector,
} from '../components/RealmDataInspector';

type PropertyType = {
  objects: Array<DeserializedRealmObject>;
  schemas: Array<SortedObjectSchema>;
  currentSchema: SortedObjectSchema;
  sortingDirection: 'ascend' | 'descend' | null;
  sortingColumn: string | null;
  hasMore: boolean;
  totalObjects?: number;
  enableSort: boolean;
  clickAction?: (object: DeserializedRealmObject) => void;
  fetchMore: () => void;
  handleDataInspector?: () => void;
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
  /** Hooks to manage the state of the DataInspector and open/close the sidebar. */
  const [inspectionData, setInspectionData] = useState<InspectionDataType>();
  const [showSidebar, setShowSidebar] = useState(false);
  const [goBackStack, setGoBackStack] = useState<Array<InspectionDataType>>([]);
  const [goForwardStack, setGoForwardStack] = useState<Array<InspectionDataType>>([]);

  /** Hook to open/close the editing dialog and set its properties. */
  const [editingObject, setEditingObject] = useState<{
    editing: boolean;
    object?: DeserializedRealmObject;
    // schemaProperty?: SchemaProperty;
    type?: 'field' | 'object';
    fieldName?: string;
  }>({
    editing: false,
  });
  const pluginState = usePlugin(plugin);
  const { removeObject, getObject } = pluginState;
  const { selectedRealm } = pluginState.state.get();

  /** refs to keep track of the current scrolling position for the context menu */
  const scrollX = useRef(0);
  const scrollY = useRef(0);

  /** Functions for deleting and editing rows/objects */
  const deleteRow = (row: DeserializedRealmObject) => {
    removeObject(row);
  };
  const editField = (
    row: DeserializedRealmObject,
    schemaProperty: CanonicalObjectSchemaProperty,
  ) => {
    setEditingObject({
      editing: true,
      object: row,
      type: 'field',
      fieldName: schemaProperty.name,
    });
  };
  const editObject = (row: DeserializedRealmObject) => {
    setEditingObject({
      editing: true,
      object: row,
      type: 'object',
    });
  };

  /**  Generate MenuItem objects for the context menu with all necessary data and functions.*/
  const generateMenuItems: MenuItemGenerator = (
    row: DeserializedRealmObject,
    schemaProperty: CanonicalObjectSchemaProperty,
    schema: Realm.ObjectSchema,
  ) => [
    {
      key: 1,
      text: 'Inspect Object',
      onClick: () => {
        setNewInspectionData(
          {
            data: {
              [schema.name]: row.realmObject,
            },
            view: 'object',
            isReference: false,
          },
          true,
        );
      },
    },
    {
      key: 2,
      text: 'Inspect Property',
      onClick: () => {
        const propertyValue = row.realmObject[schemaProperty.name]
 
        // If it is a linked object
        //@ts-expect-error Property value should have objectKey
        if(schemaProperty.objectType && propertyValue.objectKey) {
          setNewInspectionData(
            {
              data: propertyValue as RealmObjectReference,
              view: 'object',
              isReference: true,
            },
            true,
          );
        } else {
          // Otherwise visualize property as usual.
          setNewInspectionData(
            {
              data: {
                [schema.name + '.' + schemaProperty.name]:
                propertyValue,
              },
              view: 'property',
              isReference: false,
            },
            true,
          );
        }
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
    currentSchema: currentSchema,
    record: null,
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
  });

  /** Handler to keep track of the current x and y position of the scrollcontainer. This is needed to render the dropdown in the correct place when scrolled. */
  const handleScroll = (event: React.BaseSyntheticEvent) => {
    const { scrollLeft, scrollTop } = event.target;
    scrollX.current = scrollLeft;
    scrollY.current = scrollTop;
  };

  /** Take the current dropdownProp and update it with the current x and y scroll values.
   This cannot be done with useState because it would cause too many rerenders.*/
  const updatedDropdownProp = {
    ...dropdownProp,
    scrollX: scrollX.current,
    scrollY: scrollY.current,
  };

  return (
    <div
      onScroll={handleScroll}
      style={{
        flex: '1 1 0',
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
        {editingObject.object && editingObject.editing && editingObject.type === 'object' ? (
          <ObjectEdit
            schema={currentSchema}
            initialObject={editingObject.object}
            setVisible={(val: boolean) => {
              setEditingObject((obj) => ({
                ...obj,
                editing: val,
              }));
            }}
            visible={editingObject.editing}
          />
        ) : editingObject.editing &&
          editingObject.type === 'field' &&
          editingObject.object ? (
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
          columns={schemaObjToColumns(currentSchema)}
          objects={objects}
          schemas={schemas}
          hasMore={hasMore}
          sortingDirection={sortingDirection}
          sortingColumn={sortingColumn}
          currentSchema={currentSchema}
          totalObjects={totalObjects}
          generateMenuItems={generateMenuItems}
          setdropdownProp={setdropdownProp}
          dropdownProp={dropdownProp}
          scrollX={scrollX.current}
          scrollY={scrollY.current}
          enableSort={enableSort}
          setNewInspectionData={setNewInspectionData}
          fetchMore={fetchMore}
          clickAction={clickAction}
        />
        <CustomDropdown {...updatedDropdownProp} />
        <RealmDataInspector
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
          getObject={(object: RealmObjectReference) => {return getObject(selectedRealm, object.objectType!, object.objectKey)}}
        />
      </div>
    </div>
  );

  // update inspectionData and push object to GoBackStack
  function setNewInspectionData(
    newInspectionData: InspectionDataType,
    wipeStacks?: boolean,
  ) {
    showSidebar ? null : setShowSidebar(true);
    if (inspectionData !== undefined && !wipeStacks) {
      goBackStack.push(inspectionData);
      setGoBackStack(goBackStack);
      setGoForwardStack([]);
    } else if (wipeStacks) {
      setGoBackStack([]);
      setGoForwardStack([]);
    }
    setInspectionData(newInspectionData);
  }
};

export default DataVisualizer;
