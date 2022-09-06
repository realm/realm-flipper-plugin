import { PlusOutlined } from '@ant-design/icons';
import { Button, Table } from 'antd';
import { SorterResult } from 'antd/lib/table/interface';
import { Layout, Spinner, usePlugin, useValue } from 'flipper-plugin';
import React, { useEffect, useState } from 'react';
import { plugin } from '..';
import { RealmObject, SchemaObject, SchemaProperty } from '../CommonTypes';
// import { parsePropToCell } from '../utils/Parser';
import InfiniteScroll from 'react-infinite-scroller';
import { InspectionDataType } from './RealmDataInspector';
import { renderValue } from '../utils/Renderer';
import { ColumnTitle } from './ColumnTitle';
import { MenuItemGenerator } from './CustomDropdown';

export type ColumnType = {
  optional: boolean;
  name: string;
  objectType?: string;
  type: string;
  isPrimaryKey: boolean;
};

type PropertyType = {
  columns: ColumnType[];
  objects: RealmObject[];
  schemas: SchemaObject[];
  currentSchema: SchemaObject;
  sortingDirection: 'ascend' | 'descend' | null;
  sortingColumn: string | null;
  generateMenuItems?: MenuItemGenerator;
  style?: Record<string, unknown>;
  setdropdownProp: Function;
  dropdownProp: Object;
  scrollX: number;
  scrollY: number;
  enableSort: boolean;
  hasMore: boolean;
  totalObjects?: number;
  fetchMore: () => void;
  setNewInspectionData: (
    inspectionData: InspectionDataType,
    wipeStacks?: boolean
  ) => void;
  clickAction?: (object: RealmObject) => void;
};

type ClickableTextType = {
  displayText: string;
  addThreeDots: boolean;
  value: Record<string, unknown>;
  inspectorView: 'object' | 'property';
};

// Receives a schema and returns column objects for the table.
export const schemaObjToColumns = (schema: SchemaObject): ColumnType[] => {
  return schema.order.map((propertyName) => {
    const obj = schema.properties[propertyName];
    const isPrimaryKey = obj.name === schema.primaryKey;
    return {
      name: obj.name,
      optional: obj.optional,
      objectType: obj.objectType,
      type: obj.type,
      isPrimaryKey: isPrimaryKey,
    };
  });
};

export const DataTable = ({
  columns,
  objects,
  schemas,
  currentSchema,
  generateMenuItems,
  setdropdownProp,
  dropdownProp,
  scrollX,
  scrollY,
  setNewInspectionData,
  enableSort,
  hasMore,
  totalObjects,
  fetchMore,
  clickAction,
}: // rowSelection
PropertyType) => {
  const instance = usePlugin(plugin);
  const state = useValue(instance.state);
  const sortableTypes = new Set([
    'string',
    'int',
    'uuid',
    'date',
    'decimal128',
    'decimal',
    'float',
    'bool',
  ]);

  const [rowExpansionProp, setRowExpansionProp] = useState({
    expandedRowRender: () => {
      return;
    },
    expandedRowKeys: [],
    showExpandColumn: false,
  });

  /** Hook to close the nested Table when clicked outside of it. */
  useEffect(() => {
    const closeNestedTable = () => {
      setRowExpansionProp({ ...rowExpansionProp, expandedRowKeys: [] });
    };
    document.body.addEventListener('click', closeNestedTable);
    return () => document.body.removeEventListener('click', closeNestedTable);
  }, []);

  if (!currentSchema) {
    return <Layout.Container>Please select schema.</Layout.Container>;
  }

  /**  Functional component to render clickable text which opens the DataInspector.*/
  const ClickableText = ({
    displayText,
    addThreeDots,
    value,
    inspectorView,
  }: ClickableTextType) => {
    const [isHovering, setHovering] = useState(false);
    return (
      <div>
        <div
          style={{
            display: 'inline',
            color: '#6831c7',
            textDecoration: isHovering ? 'underline' : undefined,
          }}
          onClick={() =>
            setNewInspectionData({ data: value, view: inspectorView }, true)
          }
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
        >
          {displayText}
        </div>
        {addThreeDots ? (
          <div
            style={{
              display: 'inline',
            }}
          >
            ...
          </div>
        ) : null}
      </div>
    );
  };

  /** Definition of antd-specific columns. This constant is passed to the antd table as a property. */
  const antdColumns = columns.map((column) => {
    const property: SchemaProperty = currentSchema.properties[column.name];

    /*  A function that is applied for every cell to specify what to render in each cell
      on top of the pure value specified in the 'dataSource' property of the antd table.*/
    const render = (value: unknown, row: RealmObject) => {
      /** Apply the renderValue function on the value in the cell to create a standard cell. */
      const cellValue: string | number | JSX.Element = renderValue(
        value,
        property,
        schemas
      );

      const linkedSchema = schemas.find(
        (schema) => schema.name === property.objectType
      );

      /** Render buttons to expand the row and a clickable text if the cell contains a linked Realm object. */
      if (value !== null && linkedSchema && property.type === 'object') {
        return (
          <Layout.Container
            style={{
              display: 'flex',
              flexDirection: 'row',
              gap: '5px',
            }}
          >
            <Button
              shape="circle"
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              onClick={(event) => {
                event.stopPropagation();
                expandRow(row._objectKey, linkedSchema, value as RealmObject);
              }}
              ghost
            />
            {
              <ClickableText
                value={value}
                displayText={cellValue}
                addThreeDots={false}
                inspectorView="object"
              />
            }
          </Layout.Container>
        );
      }

      /** If the cell contains a string which is too long cut it off and render it as a clickable text. */
      if (typeof cellValue === 'string' && cellValue.length > 70) {
        return (
          <ClickableText
            value={value}
            displayText={cellValue.substring(0, 70)}
            addThreeDots={true}
            inspectorView="property"
          />
        );
      }
      return cellValue;
    };

    return {
      /** Simple antd table props defined in their documentation */
      minWidth: 20000,
      key: property.name,
      dataIndex: property.name,
      width: 300,
      ellipsis: {
        showTitle: false,
      },

      /** The title appearing in the tables title row. */
      title: createTitle(column),

      /** The function that defines how each cell is rendered. */
      render,

      property,

      /** The function listening for onCell events, here listening for left-clicks on the cell to render the context menu.*/
      onCell: (object: RealmObject) => {
        if (generateMenuItems) {
          return {
            onContextMenu: (env: Event) => {
              env.preventDefault();
              setdropdownProp({
                ...dropdownProp,
                record: object,
                schemaProperty: property,
                currentSchema: currentSchema,
                visible: true,
                //@ts-ignore
                pointerX: env.clientX - 290,
                //@ts-ignore
                pointerY: env.clientY - 225,
                scrollX,
                scrollY,
              });
            },
          };
        }
      },

      /** Enabling/Disabling sorting if the property.type is a sortable type */
      sorter: enableSort && sortableTypes.has(property.type), //TODO: false if object, list, set

      /** Defining the sorting order. */
      sortOrder:
        state.sortingColumn === property.name ? state.sortingDirection : null,
    };
  });

  /** Updating the rowExpansion property of the antd table to expand the correct row and render a nested table inside of it. */
  const expandRow = (
    rowToExpandKey: any,
    linkedSchema: SchemaObject,
    objectToRender: RealmObject
  ) => {
    console.log('expandRow');
    console.log('objectToRender._objectKey', objectToRender._objectKey);
    console.log('objectToRender', objectToRender);

    const newRowExpansionProp = {
      ...rowExpansionProp,
      expandedRowKeys: [rowToExpandKey],
      expandedRowRender: () => {
        return (
          <NestedTable
            columns={schemaObjToColumns(linkedSchema)}
            objects={[objectToRender]}
            schemas={schemas}
            currentSchema={linkedSchema}
            sortingColumn={null}
            hasMore={false}
            generateMenuItems={generateMenuItems}
            setdropdownProp={setdropdownProp}
            dropdownProp={dropdownProp}
          />
        );
      },
    };
    setRowExpansionProp(newRowExpansionProp);
  };

  /** Loading new objects if the end of the table is reached. */
  const handleInfiniteOnLoad = () => {
    if (state.loading) {
      return;
    }
    if (objects.length >= totalObjects) {
      return;
    }
    fetchMore();
  };

  /** Handling the changes of objects. */
  const handleOnChange = (
    pagination: TablePaginationConfig,
    filters: Record<string, Key[] | null>,
    sorter: SorterResult<any> | SorterResult<any>[],
    extra: any
  ) => {
    //TODO: make type of a field
    if (extra.action === 'sort') {
      if (state.loading) {
        return;
      }
      if (state.sortingColumn !== sorter.field) {
        instance.setSortingDirection('ascend');
        instance.setSortingColumn(sorter.field);
      } else {
        instance.toggleSortingDirection();
      }
      instance.getObjects();
    }
  };
  // TODO: think about key as a property in the Realm DB
  return (
    <div
      style={{
        overflow: 'auto',
        height: '100%',
        width: '100%',
        textAlign: 'center',
        paddingBottom: '100px',
      }}
    >
      <InfiniteScroll
        initialLoad={false}
        pageStart={0}
        loadMore={handleInfiniteOnLoad}
        hasMore={hasMore}
        useWindow={false}
        loader={
          <div
            style={{
              marginTop: '20px',
              marginBottom: '25px',
              display: 'inline-block',
            }}
            key={0}
          >
            <Spinner size={30}></Spinner>
          </div>
        }
      >
        <Table
          sticky={true}
          bordered={true}
          showSorterTooltip={false}
          dataSource={objects}
          onRow={(object: RealmObject) => {
            if (clickAction) {
              return {
                onClick: () => {
                  clickAction(object);
                },
                // onDoubleClick: () => {
                //   if (clickAction) {
                //     clickAction(object);
                //   }
                // },
              };
            }
          }}
          rowKey={(record) => {
            return record._objectKey;
          }}
          expandable={rowExpansionProp}
          columns={antdColumns}
          onChange={handleOnChange}
          pagination={false}
          scroll={{ scrollToFirstRowOnChange: false }}
          // tableLayout="auto"
        />
      </InfiniteScroll>
    </div>
  );
};

const createTitle = (column: ColumnType) => {
  return (
    <ColumnTitle
      optional={column.optional}
      name={column.name}
      objectType={column.objectType}
      type={column.type}
      isPrimaryKey={column.isPrimaryKey}
    />
  );
};

/** Internal component to render a nested table for exploring linked objects. */
const NestedTable = ({
  columns,
  objects,
  schemas,
  currentSchema,
  sortingColumn,
  generateMenuItems,
  setdropdownProp,
  dropdownProp,
  hasMore,
}: PropertyType) => {
  console.log('NestedTable');

  return (
    <DataTable
      columns={columns}
      objects={objects}
      schemas={schemas}
      hasMore={hasMore}
      currentSchema={currentSchema}
      sortingColumn={sortingColumn}
      generateMenuItems={generateMenuItems}
      style={{
        boxShadow: '20px 0px 50px grey',
      }}
      setdropdownProp={setdropdownProp}
      dropdownProp={dropdownProp}
      enableSort={false}
    ></DataTable>
  );
};
