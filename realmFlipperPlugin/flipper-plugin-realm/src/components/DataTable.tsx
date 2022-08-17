import { SearchOutlined } from '@ant-design/icons';
import { Button, Dropdown, Table, Tooltip } from 'antd';
import { SorterResult } from 'antd/lib/table/interface';
import { Layout, usePlugin, useValue } from 'flipper-plugin';
import React, { ReactElement, useState } from 'react';
import { plugin } from '..';
import { RealmObject, SchemaObject, SchemaProperty } from '../CommonTypes';
import { createColumns } from '../pages/DataVisualizer';
import { parsePropToCell } from '../utils/Parser';
import { ColumnTitle } from './ColumnTitle';

type ColumnType = {
  isOptional: boolean;
  name: string;
  objectType: string | undefined;
  propertyType: string;
  isPrimaryKey: boolean;
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
  getOneObject: (schema: string, primaryKey: string) => Promise<RealmObject>;
  // rowSelection?: TableRowSelection<RealmObject>;
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

export const DataTable = ({
  columns,
  objects,
  schemas,
  currentSchema,
  sortDirection,
  loading,
  sortingColumn,
  renderOptions,
  getOneObject,
}: // rowSelection
PropertyType) => {
  const instance = usePlugin(plugin);
  const state = useValue(instance.state);

  const [rowSelectionProp, setRowSelectionProp] = useState({
    selectedRowKeys: [],
    hideSelectAll: true,
    columnWidth: '0px',
    renderCell: () => <></>,
  });

  const expandedRowRender = () => {
    return <></>;
  };

  const [rowExpansionProp, setRowExpansionProp] = useState({
    expandedRowRender,
    expandedRowKeys: [],
  });

  if (!currentSchema) {
    return <Layout.Container>Please select schema.</Layout.Container>;
  }

  const sortableTypes = new Set(['string', 'int', 'uuid']);

  const filledColumns = columns.map((column) => {
    const property: SchemaProperty = currentSchema.properties[column.name];
    return {
      title: createTitle(column),
      key: property.name,
      dataIndex: property.name,
      width: 300,
      ellipsis: {
        showTitle: false,
      },
      property,
      render: (value: RealmObject, row: RealmObject) => {
        if (property.objectType && value) {
          console.log('property.objectType', property.objectType);

          const linkedSchema = schemas.find(
            (schema) => schema.name === property.objectType
          );
          if (linkedSchema) {
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
                  // onClick={() => highlightRow(value[currentSchema.primaryKey])}
                  onClick={() =>
                    expandRow(
                      row[currentSchema.primaryKey],
                      linkedSchema,
                      value
                    )
                  }
                  ghost
                />
                <Dropdown
                  overlay={renderOptions(row, property, currentSchema)}
                  trigger={[`contextMenu`]}
                >
                  <Tooltip placement="topLeft" title={JSON.stringify(value)}>
                    {parsePropToCell(value, property, currentSchema, schemas)}
                  </Tooltip>
                </Dropdown>
              </Layout.Container>
            );
          }
        }
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

  // const highlightRow = (key: string | number) => {
  //   let newRowSelectionProp = {
  //     ...rowSelectionProp,
  //     selectedRowKeys: rowSelectionProp.selectedRowKeys.concat([
  //       key.toString(),
  //     ]),
  //   };
  //   setRowSelectionProp(newRowSelectionProp);

  //   setTimeout(
  //     () => setRowSelectionProp({ ...rowSelectionProp, selectedRowKeys: [] }),
  //     5000
  //   );
  // };

  const expandRow = async (
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
        // expandedRowKeys: rowExpansionProp.expandedRowKeys.concat([
        //   rowToExpandKey,
        // ]),
        expandedRowKeys: [rowToExpandKey],
        expandedRowRender: () =>
          NestedTable({
            columns: createColumns(linkedSchema),
            objects: [objectToRender],
            schemas: schemas,
            currentSchema: linkedSchema,
            sortDirection: sortDirection,
            loading: false,
            sortingColumn: null,
            renderOptions: renderOptions,
            getOneObject: getOneObject,
          }),
      };
      setRowExpansionProp(newRowExpansionProp);
    } else {
      const newRowExpansionProp = {
        ...rowExpansionProp,
        expandedRowKeys: [],
        expandedRowRender: () =>
          NestedTable({
            columns: createColumns(linkedSchema),
            objects: [objectToRender],
            schemas: schemas,
            currentSchema: linkedSchema,
            sortDirection: sortDirection,
            loading: false,
            sortingColumn: null,
            renderOptions: renderOptions,
            getOneObject: getOneObject,
          }),
      };
      setRowExpansionProp(newRowExpansionProp);
    }
  };

  // TODO: think about key as a property in the Realm DB
  return (
    <Table
      dataSource={objects}
      rowSelection={rowSelectionProp}
      rowKey={(record) => {
        return record[currentSchema.primaryKey];
      }}
      expandable={rowExpansionProp}
      columns={filledColumns}
      onChange={handleOnChange}
      pagination={false}
      loading={loading}
      size="small"
    />
  );
};

const createTitle = (column: {
  isOptional: boolean;
  isPrimaryKey: boolean;
  name: string;
  objectType?: string;
  propertyType: string;
}) => {
  return (
    <ColumnTitle
      isOptional={column.isOptional}
      name={column.name}
      objectType={column.objectType}
      propertyType={column.propertyType}
      isPrimaryKey={column.isPrimaryKey}
    />
  );
};

const NestedTable = ({
  columns,
  objects,
  schemas,
  currentSchema,
  sortDirection,
  loading,
  sortingColumn,
  renderOptions,
  getOneObject,
}: PropertyType) => {
  return (
    <div
      style={{
        backgroundColor: '#00684A',
        display: 'flex',
        columnGap: '100px',
        flexDirection: 'column',
      }}
    >
      <div style={{ height: '10px' }} />
      <DataTable
        columns={columns}
        objects={objects}
        schemas={schemas}
        currentSchema={currentSchema}
        sortDirection={sortDirection}
        loading={loading}
        sortingColumn={sortingColumn}
        renderOptions={renderOptions}
        getOneObject={getOneObject}
      ></DataTable>{' '}
      <div style={{ height: '10px' }} />
    </div>
  );
};
