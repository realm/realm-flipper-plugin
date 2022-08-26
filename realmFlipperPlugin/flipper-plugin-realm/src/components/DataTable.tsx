import { EnterOutlined } from '@ant-design/icons';
import { Button, Table } from 'antd';
import { SorterResult } from 'antd/lib/table/interface';
import { Layout, Spinner, usePlugin, useValue } from 'flipper-plugin';
import React, { useState } from 'react';
import { plugin } from '..';
import { RealmObject, SchemaObject, SchemaProperty } from '../CommonTypes';
// import { parsePropToCell } from '../utils/Parser';
import { renderValue } from '../utils/Renderer';
import { ColumnTitle } from './ColumnTitle';
import { MenuItemGenerator } from './CustomDropdown';
import { InspectionDataType } from '../components/RealmDataInspector';
import InfiniteScroll from 'react-infinite-scroller';

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
  handleDataInspector: (inspectionData: InspectionDataType) => void;
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
  handleDataInspector,
  enableSort,
}: // rowSelection
PropertyType) => {
  const instance = usePlugin(plugin);
  const state = useValue(instance.state);

  const [loading, setLoading] = useState(false);
  const sortableTypes = new Set([
    'string',
    'int',
    'uuid',
    'date',
    'decimal128',
    'decimal',
    'float',
  ]);

  const [rowExpansionProp, setRowExpansionProp] = useState({
    expandedRowRender: () => {
      return;
    },
    // expandIcon: () => null,
    expandedRowKeys: [],
    showExpandColumn: false,
  });

  if (!currentSchema) {
    return <Layout.Container>Please select schema.</Layout.Container>;
  }

  type ClickableTextType = {
    displayText: string;
    addThreeDots: boolean;
    value: Record<string, unknown>;
    inspectorView: 'object' | 'property';
  };

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
            textDecoration: isHovering ? 'underline' : undefined,
          }}
          onClick={() =>
            handleDataInspector({ data: value, view: inspectorView })
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

  const filledColumns = columns.map((column) => {
    const property: SchemaProperty = currentSchema.properties[column.name];

    /*  A function that is applied for every cell to specify what to render in each cell
      on top of the pure value specified in the 'dataSource' property of the antd table.*/
    const render = (value: unknown, row: RealmObject) => {
      const cellValue: string | number | JSX.Element = renderValue(
        value,
        property,
        schemas
      );

      const linkedSchema = schemas.find(
        (schema) => schema.name === property.objectType
      );
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
              icon={<EnterOutlined />}
              onClick={() =>
                expandRow(
                  row[currentSchema.primaryKey],
                  linkedSchema,
                  value as RealmObject
                )
              }
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
      minWidth: 20000,
      title: createTitle(column),
      key: property.name,
      dataIndex: property.name,
      width: 300,
      ellipsis: {
        showTitle: false,
      },
      property,
      render,
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
                pointerY: env.clientY - 195,
                scrollX,
                scrollY,
              });
            },
          };
        }
      },
      sorter: enableSort && sortableTypes.has(property.type), //TODO: false if object, list, set
      sortOrder:
        state.sortingColumn === property.name ? state.sortingDirection : null,
    };
  });

  const expandRow = (
    rowToExpandKey: any,
    linkedSchema: SchemaObject,
    objectToRender: RealmObject
  ) => {
    console.log('objectToRender', objectToRender);

    // const fetchedObject = await getLinkedObject(
    //   linkedSchema.name,
    //   objectToRender[linkedSchema.primaryKey]
    // );

    // console.log('fetchedObject', fetchedObject);

    if (
      !rowExpansionProp.expandedRowKeys.find(
        (rowKey) => rowKey === rowToExpandKey
      )
    ) {
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
              generateMenuItems={generateMenuItems}
              setdropdownProp={setdropdownProp}
              dropdownProp={dropdownProp}
            />
          );
        },
      };
      setRowExpansionProp(newRowExpansionProp);
    } else {
      const newRowExpansionProp = {
        ...rowExpansionProp,
        expandedRowKeys: [],
        expandedRowRender: () => {
          return (
            <NestedTable
              columns={schemaObjToColumns(linkedSchema)}
              objects={[objectToRender]}
              schemas={schemas}
              currentSchema={linkedSchema}
              sortingColumn={null}
              generateMenuItems={generateMenuItems}
              setdropdownProp={setdropdownProp}
              dropdownProp={dropdownProp}
            />
          );
        },
      };
      setRowExpansionProp(newRowExpansionProp);
    }
  };

  const handleInfiniteOnLoad = () => {
    console.log('more');
    if (state.loading) {
      return;
    }
    setLoading(true);
    if (state.objects.length >= state.totalObjects) {
      message.warning('Infinite List loaded all');
      return;
    }
    instance.getObjects();
    console.log('objects in state', state.objects);
  };

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
        instance.setSortingColumnAndType(
          sorter.field,
          state.currentSchema?.properties[sorter.field].type
        );
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
        hasMore={state.hasMore}
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
          dataSource={objects}
          rowKey={(record) => {
            return record[currentSchema.primaryKey];
          }}
          expandable={rowExpansionProp}
          columns={filledColumns}
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

const NestedTable = ({
  columns,
  objects,
  schemas,
  currentSchema,
  sortingColumn,
  generateMenuItems,
  setdropdownProp,
  dropdownProp,
}: PropertyType) => {
  return (
    <DataTable
      columns={columns}
      objects={objects}
      schemas={schemas}
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
