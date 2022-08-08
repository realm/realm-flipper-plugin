import { Dropdown, Table, TablePaginationConfig, Tooltip } from 'antd';
import { SorterResult } from 'antd/lib/table/interface';
import { Layout, usePlugin, useValue } from 'flipper-plugin';
import React, { Key, ReactElement } from 'react';
import { plugin } from '..';
import { RealmObject, SchemaProperty, SchemaObject } from "../CommonTypes";
import { parseRows } from '../utils/Parser';
import { ColumnTitle } from './ColumnTitle';

type ColumnType = {
  isOptional: boolean;
  name: string;
  objectType: string | undefined;
  propertyType: string;
  isPrimaryKey: boolean;
};

export const schemaObjToColumns = (schema: SchemaObject) => {
  return Object.keys(schema.properties).map((key) => {
    const obj = schema.properties[key];
    const isPrimaryKey = obj.name === schema.primaryKey;
    return {
      name: obj.name,
      isOptional: obj.optional,
      objectType: obj.objectType,
      propertyType: obj.type,
      isPrimaryKey: isPrimaryKey,
    };
  });
};

export const DataTable = (props: {
  columns: ColumnType[];
  objects: RealmObject[];
  schemas: SchemaObject[];
  selectedSchema: string;
  sortDirection: 'ascend' | 'descend' | null;
  loading: boolean;
  sortingColumn: string | null;
  renderOptions: (
    row: RealmObject,
    schemaProperty: SchemaProperty,
    schema: SchemaObject
  ) => ReactElement; // for dropDown
}) => {
  const instance = usePlugin(plugin);
  const state = useValue(instance.state);
  const currentSchema = props.schemas.find(
    (schema) => schema.name === props.selectedSchema
  );

  //TODO: Sort objects after receiving them so that every component works with the same order.
  // Put primaryKey column in front.
  // const primaryKeyIndex = props.columns.findIndex((col) => col.isPrimaryKey);
  // const tempCol = props.columns[0];
  // props.columns[0] = props.columns[primaryKeyIndex];
  // props.columns[primaryKeyIndex] = tempCol;

  if (currentSchema === undefined) {
    return <Layout.Container>Please select schema.</Layout.Container>;
  }

  const sortableTypes = new Set(['string', 'int', 'uuid']);

  const filledColumns = props.columns.map((column) => {
    const property: SchemaProperty = currentSchema.properties[column.name];

    return {
      title: () => (
        <ColumnTitle
          isOptional={column.isOptional}
          name={column.name}
          objectType={column.objectType}
          propertyType={column.propertyType}
          isPrimaryKey={column.isPrimaryKey}
        />
      ),
      key: property.name,
      dataIndex: property.name,
      width: 300,
      ellipsis: {
        showTitle: false,
      },
      property,
      render: (text: {text: string | number, value: RealmObject}, row: RealmObject) => {
        return (
          <Dropdown
            overlay={props.renderOptions(row, property, currentSchema)}
            trigger={[`contextMenu`]}
          >
            <Tooltip placement="topLeft" title={text.text}>
              {text.text}
            </Tooltip>
          </Dropdown>
        );
      },
      sorter: sortableTypes.has(property.type), //TODO: false if object, list, set
      sortOrder:
        props.sortingColumn === property.name ? props.sortDirection : null,
    };
  });

  const rowObjs = parseRows(props.objects, currentSchema, props.schemas);

  const handleOnChange = (
    pagination: TablePaginationConfig,
    filters: Record<string, Key[] | null>,
    sorter: SorterResult<any> | SorterResult<any>[],
    extra: any
  ) => {
    //TODO: make type of a field
    console.log('ACTION', extra);
    if (extra.action === 'sort') {
      if (state.sortingColumn !== sorter.field) {
        console.log('swtiching');
        instance.setSortingDirection('ascend');
        instance.setSortingColumn(sorter.field);
      } else {
        console.log('standard');
        instance.toggleSortDirection();
      }
    }
    instance.getObjectsFoward({ realm: null, schema: null });
    instance.setCurrentPage({ currentPage: 1 });
  };

  // TODO: think about key as a property in the Realm DB
  return (
    <Table
      dataSource={rowObjs}
      columns={filledColumns}
      onChange={handleOnChange}
      pagination={false}
      loading={props.loading}
    />
  );
};
