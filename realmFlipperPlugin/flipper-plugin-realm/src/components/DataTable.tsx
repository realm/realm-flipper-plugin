import { SearchOutlined } from '@ant-design/icons';
import { Button, Table, Tooltip } from 'antd';
import { SorterResult } from 'antd/lib/table/interface';
import { Layout, usePlugin, useValue } from 'flipper-plugin';
import React, {  useState } from 'react';
import { plugin } from '..';
import { RealmObject, SchemaObject, SchemaProperty } from '../CommonTypes';
// import { parsePropToCell } from '../utils/Parser';
import { ColumnTitle } from './ColumnTitle';
import {
  MenuItemGenerator,
} from './CustomDropdown';
import { renderValue } from '../utils/Renderer';

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
  loading: boolean;
  sortingColumn: string | null;
  generateMenuItems?: MenuItemGenerator;
  style?: Record<string, unknown>;
  setdropdownProp: Function;
  dropdownProp: Object;
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
  loading,
  generateMenuItems,
  style,
  setdropdownProp,
  dropdownProp,
}: // rowSelection
PropertyType) => {
  const instance = usePlugin(plugin);
  const state = useValue(instance.state);

  const [rowExpansionProp, setRowExpansionProp] = useState({
    expandedRowRender: () => {
      return <></>;
    },
    expandedRowKeys: [],
    showExpandColumn: false,
  });

  if (!currentSchema) {
    return <Layout.Container>Please select schema.</Layout.Container>;
  }

  const filledColumns = columns.map((column) => {
    const property: SchemaProperty = currentSchema.properties[column.name];

    /*  A function that is applied for every cell to specify what to render in each cell
      on top of the pure value specified in the 'dataSource' property of the antd table.*/
    const render = (value: unknown, row: RealmObject) => {
      const defaultCell = (
        <Tooltip placement="topLeft" title={JSON.stringify(value)}>
          {parsePropToCell(value, property, currentSchema, schemas)}
        </Tooltip>
      );
      const linkedSchema = schemas.find(
        (schema) => schema.name === property.objectType
      );
      if (value !== null && linkedSchema) {
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
              icon={<SearchOutlined />}
              onClick={() =>
                expandRow(
                  row[currentSchema.primaryKey],
                  linkedSchema,
                  value as RealmObject
                )
              }
              ghost
            />
            {defaultCell}
          </Layout.Container>
        );
      }
      return defaultCell;
    };

    return {
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
              // console.log(env);
              // console.log('pageX', env.pageX);
              // console.log('pageY', env.pageY);
              // console.log('pageX', env.clientX);
              // console.log('pageY', env.clientY);
              // console.log('window.pageYOffset', window.pageYOffset);
              // console.log('window.pageXOffset', window.pageXOffset);
              // console.log('window', window);

              env.preventDefault();
              setdropdownProp({
                ...dropdownProp,
                record: object,
                schemaProperty: property,
                currentSchema: currentSchema,
                visible: true,
                // TODO: Fix this ugly hardcoded offset
                //@ts-ignore
                x: env.clientX - 290,
                //@ts-ignore
                y: env.clientY - 190,
              });
            },
          };
        }
      },
    };
  });

  //TODO: Fix unused properties.
  const handleOnChange = (
    sorter: SorterResult<any> | SorterResult<any>[],
    extra: any
  ) => {
    //TODO: make type of a field
    if (extra.action === 'sort') {
      if (state.sortingColumn !== sorter.field) {
        instance.setSortingDirection('ascend');
        instance.setSortingColumn(sorter.field);
      } else {
        instance.toggleSortDirection();
      }
    }
    instance.getObjects();
    instance.setCurrentPage(1);
  };

  const expandRow =  (
    rowToExpandKey: any,
    linkedSchema: SchemaObject,
    objectToRender: RealmObject
  ) => {

    if (
      !rowExpansionProp.expandedRowKeys.find(
        (rowKey) => rowKey === rowToExpandKey
      )
    ) {
      const newRowExpansionProp = {
        ...rowExpansionProp,
        expandedRowRender: () => {
          return (
            <NestedTable
              columns={schemaObjToColumns(linkedSchema)}
              objects={[objectToRender]}
              schemas={schemas}
              currentSchema={linkedSchema}
              loading={false}
              sortingColumn={null}
              generateMenuItems={generateMenuItems}
            />
          );
        },
        expandedRowKeys: [rowToExpandKey],
      };

       setRowExpansionProp(newRowExpansionProp);
      // console.log(newRowExpansionProp);
      
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
              loading={false}
              sortingColumn={null}
              generateMenuItems={generateMenuItems}
            />
          );
        },
      };
      setRowExpansionProp(newRowExpansionProp);
    }
  };

  // TODO: think about key as a property in the Realm DB
  return (
    <div>
      <Table
        bordered={true}
        dataSource={objects}
        rowKey={(record) => {
          return record[currentSchema.primaryKey];
        }}
        expandable={rowExpansionProp}
        columns={filledColumns}
        onChange={handleOnChange}
        pagination={false}
        loading={loading}
        size="small"
        tableLayout="auto"
        style={style}
      />
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
  loading,
  sortingColumn,
  generateMenuItems,
}: PropertyType) => {

  console.log('NestedTable', objects)
  return (
    <DataTable
      columns={columns}
      objects={objects}
      schemas={schemas}
      currentSchema={currentSchema}
      loading={loading}
      sortingColumn={sortingColumn}
      generateMenuItems={generateMenuItems}
      style={{
        boxShadow: '20px 0px 50px grey',
        marginLeft: '-35px', //hacky but necessary to avoid weird indentation
      }}
    ></DataTable>
  );
};
