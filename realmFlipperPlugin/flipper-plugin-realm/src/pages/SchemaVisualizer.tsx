import { Table, Typography } from 'antd';
import { Layout, useMemoize, usePlugin } from 'flipper-plugin';
import React from 'react';
import { plugin } from '../index';
import { SchemaProperty, SchemaObject } from '../CommonTypes';
import { isPropertyLinked } from '../utils/linkedObject';
import { BooleanValue } from '../components/BooleanValue';
import { RealmObject } from '../CommonTypes';

const { Text } = Typography;
const { Link } = Typography;

const createRows = (
  properties: { [key: string]: SchemaProperty },
  primaryKey: string
): RealmObject[] => {
  const newRows: RealmObject[] = [];
  Object.values(properties).forEach((value: SchemaProperty, index: number) => {
    newRows.push({
      ...value,
      key: index,
      primaryKey: value.name === primaryKey,
    });
  });

  return newRows;
};

type InputType = {
  schemas: Array<SchemaObject>;
  currentSchema: SchemaObject | null;
};

const SchemaVisualizer = ({ schemas, currentSchema }: InputType) => {
  if (!currentSchema) {
    return <div> Please select a schema.</div>;
  }

  if (!schemas || !schemas.length) {
    return <div>No schemas found</div>;
  }
  const instance = usePlugin(plugin);

  const onSchemaSelected = (selectedSchema: SchemaObject) => {
    // instance.getObjects();
    instance.updateSelectedSchema(selectedSchema);
  };
  

  function createColumnConfig(columns: string[]) {
    const columnObjs = columns.map((columnName) => ({
      key: columnName,
      title: columnName,
      dataIndex: columnName,
      // onFilter: (value: string, record: any) => record[col].startsWith(value),
      render: (cellContent: string, record: SchemaProperty) =>
        renderTableCells(cellContent, typeof cellContent, columnName, record),
      // filterSearch: true,
    }));
  
    return columnObjs;
  }
  
  const renderTableCells = (
    value: unknown,
    type: string,
    column: string,
    record: SchemaProperty
  ) => {
    console.log('rendering, ', value, type, column, record)
    if (column === 'objectType' && isPropertyLinked(record)) {
      const targetSchema = schemas.find(schema => schema.name === record.objectType);
      return (
        <Link onClick={() => onSchemaSelected(targetSchema as SchemaObject)}>
          {value}
        </Link>
      );
    }
    switch (type) {
      case 'boolean':
        return (
          <BooleanValue active={value as boolean}>
            {(value as boolean).toString()}
          </BooleanValue>
        );
      case 'blob':
      case 'string':
        return <Text>{value as string}</Text>;
      case 'integer':
      case 'float':
      case 'double':
      case 'number':
        return <Text>{value as number}</Text>;
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
  console.log('currentSchema', currentSchema);
  console.log('createRowsproperties', properties);
  const rows = createRows(properties, primaryKey);

  return (
    <Layout.Container height={800}>
      <Table dataSource={rows} columns={columnObjs} size="middle" />
    </Layout.Container>
  );
};

export default React.memo(SchemaVisualizer);
