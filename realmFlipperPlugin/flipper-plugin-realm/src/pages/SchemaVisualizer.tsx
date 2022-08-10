import { Table, Typography } from 'antd';
import { DataTableColumn, Layout, styled, theme, useMemoize, usePlugin, useValue } from 'flipper-plugin';
import React from "react";
import { plugin } from '../index';
import { SchemaProperty, SchemaObject } from "../CommonTypes";
import { Value } from '../utils/TypeBasedValueRenderer';
import { isPropertyLinked } from '../utils/linkedObject';
 import { BooleanValue } from '../components/BooleanValue';
const {Text} = Typography;
const {Link} = Typography;

  export function createRows(
    properties: { [key: string]: SchemaProperty },
    primaryKey: string
  ): RealmObject[] {
    const newRows: RealmObject[] = [];
    Object.values(properties).forEach(
      (value: SchemaProperty, index: number) => {
        newRows.push({
          ...value,
          key: index,
          primaryKey: value.name === primaryKey,
        });
      }
    );

    return newRows;
  }
  const SchemaVisualizer = (props: {
    schemas: Array<SchemaObject>;
    currentSchema: SchemaObject | null;
  }) => {
    const { schemas, currentSchema } = props;
    if (!schemas || !schemas.length) {
      return <div>No schemas found</div>;
    }
    const instance = usePlugin(plugin);

    const onSchemaSelected = (selectedSchema: SchemaObject) => {
      instance.getObjectsForward();
      instance.updateSelectedSchema(selectedSchema);
    };

    function createColumnConfig(columns: string[]) {
      const columnObjs: DataTableColumn<{ [key: string]: Value }>[] =
        columns.map((col) => ({
          key: col,
          title: col,
          dataIndex: col,
          onFilter: (value: string, record: any) =>
            record[col].startsWith(value),
          render: (text, record) =>
            renderTableCells(text.name, typeof text, col, record),
          filterSearch: true,
        }));
      return columnObjs;
    }
    function renderTableCells(
      value: SchemaObject,
      type: string,
      column: string,
      record: any
    ) {
      if (column === 'objectType' && isPropertyLinked(record)) {
        return (
          <Link onClick={() => onSchemaSelected(value)}>{value.name}</Link>
        );
      }
      switch (type) {
        case 'boolean':
          return (
            <BooleanValue active={Boolean(value)}>
              {value.toString()}
            </BooleanValue>
          );
        case 'blob':
        case 'string':
          return <Text>{value}</Text>;
        case 'integer':
        case 'float':
        case 'double':
        case 'number':
          return <Text>{value}</Text>;
        case 'null':
          return <Text>NULL</Text>;
        case 'object':
          if (Array.isArray(value)) return <Text>[{value.toString()}]</Text>;
          else return <Text>{JSON.stringify(value)}</Text>;
        default:
          return <Text />;
      }
    }

    const { properties, primaryKey } = currentSchema;
    const columns = [
      'name',
      'type',
      'mapTo',
      'indexed',
      'optional',
      'primaryKey',
      'objectType',
    ];
    const columnObjs = useMemoize(
      (columns: string[]) => createColumnConfig(columns),
      [columns]
    );
    const rows = createRows(properties, primaryKey);
    return (
      <Layout.Container height={800}>
        <Table dataSource={rows} columns={columnObjs} />
      </Layout.Container>
    );
  };

export default React.memo(SchemaVisualizer);