import { Dropdown, Table, Tooltip } from 'antd';
import { SorterResult } from 'antd/lib/table/interface';
import { Layout, usePlugin, useValue } from 'flipper-plugin';
import React, { ReactElement } from 'react';
import { plugin } from '..';
import { RealmObject, SchemaProperty, SchemaObject } from '../CommonTypes';
import { parsePropToCell } from '../utils/Parser';
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

type PropertyType = {
  columns: ColumnType[];
  objects: RealmObject[];
  schemas: SchemaObject[];
  currentSchema: SchemaObject;
  sortDirection: 'ascend' | 'descend' | null;
  loading: boolean;
  sortingColumn: string | null;
  renderOptions: (
    // for dropDown
    row: RealmObject,
    schemaProperty: SchemaProperty,
    schema: SchemaObject
  ) => ReactElement;
  // rowSelection?: TableRowSelection<RealmObject>;
};

export const DataTable = ({
  columns,
  objects,
  schemas,
  currentSchema,
  sortDirection,
  loading,
  sortingColumn,
  renderOptions,
}: // rowSelection
PropertyType) => {
  const instance = usePlugin(plugin);
  const state = useValue(instance.state);

  if (currentSchema === undefined) {
    return <Layout.Container>Please select schema.</Layout.Container>;
  }

  const sortableTypes = new Set(['string', 'int', 'uuid']);

  const filledColumns = columns.map((column) => {
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
      render: (value: RealmObject, row: RealmObject) => {
        console.log('value', value);
        console.log('objects', objects);
        return (
          <Dropdown
            overlay={renderOptions(row, property, currentSchema)}
            trigger={[`contextMenu`]}
          >
            <Tooltip placement="topLeft" title={JSON.stringify(value)}>
              {parsePropToCell(value, property, currentSchema, schemas)}
            </Tooltip>
          </Dropdown>
        );
      },
      sorter: sortableTypes.has(property.type), //TODO: false if object, list, set
      sortOrder: sortingColumn === property.name ? sortDirection : null,
    };
  });

  const handleOnChange = (
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
    instance.getObjectsForward();
    instance.setCurrentPage(1);
  };

  // TODO: think about key as a property in the Realm DB
  return (
    <Table
      dataSource={objects}
      columns={filledColumns}
      onChange={handleOnChange}
      pagination={false}
      loading={loading}
    />
  );
};
