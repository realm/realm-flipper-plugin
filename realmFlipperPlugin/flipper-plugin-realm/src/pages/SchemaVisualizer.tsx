import { Table, Typography } from 'antd';
import { Layout, useMemoize, usePlugin } from 'flipper-plugin';
import React from 'react';
import { plugin } from '../index';
import { SchemaProperty, SchemaObject } from '../CommonTypes';
import { isPropertyLinked } from '../utils/linkedObject';
import BooleanValue from '../components/BooleanValue';

const { Text } = Typography;
const { Link } = Typography;

const createRows = (
  order: string[],
  properties: { [key: string]: SchemaProperty },
  primaryKey: string
): Record<string, unknown>[] => {
  const newRows: Record<string, unknown>[] = [];
  order.forEach((propName: string, index: number) => {
    const value = properties[propName];
    console.log('here?')
    newRows.push({
      ...value,
      key: index,
      primaryKey: value.name === primaryKey,
    });
  });

  return newRows;
};
const renderPropertyLinked = (objectType: string, schemas: SchemaObject[], onSchemaSelected: (selectedSchema: SchemaObject) => void): string | JSX.Element => {
  const targetSchema = schemas.find(
    (schema) => schema.name === objectType
  );
  if (!targetSchema) {
    return objectType;
  }
  return (
    <Link onClick={() => onSchemaSelected(targetSchema)}>
      {targetSchema.name}
    </Link>
  );
}

const renderFullType = (property: SchemaProperty, schemas: SchemaObject[], onSchemaSelected: (selectedSchema: SchemaObject) => void): string | JSX.Element => {
  let title;
  
  switch (property.type) {
    case 'list':
    case 'set':
    case 'dictionary':
    case 'object':
      title = <>{renderPropertyLinked(property.objectType as string, schemas, onSchemaSelected)}</>;
      break;
    default:
      title = <>{property.type}</>;
  }
  
  if (property.optional) {
    title = <>{title}?</>;
  }

  switch (property.type) {
    case 'list':
      title = <>{title}{"[]"}</>;
      break;
    case 'set':
      title = <>{title}{"<>"}</>;
      break;
    case 'dictionary':
      title = <>{title}{"{}"}</>;
      break;
  }

  return title;
}

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
    instance.setSelectedSchema(selectedSchema);
  };

  function createColumnConfig() {
    const simpleColumnGenerator = (columnName: string) => ({
        key: columnName,
        title: columnName,
        dataIndex: columnName,
        // onFilter: (value: string, record: any) => record[col].startsWith(value),
        render: (cellContent: string, record: SchemaProperty) =>
          renderTableCells(cellContent, typeof cellContent, columnName, record),
        // filterSearch: true,
      });
  
    const innerTypeColumns = ['type', 'optional'].map(simpleColumnGenerator);
    const typeColumnGroup = {
      title: 'type',
      children: [
        {
          title: 'full type',
          dataIndex: 'string format',
          key: 'string format',
          render: (cellContent: string, record: SchemaProperty) => {
            return renderFullType(record, schemas, onSchemaSelected);
          }
        },
        ...innerTypeColumns,
      ]
    }

    const simpleColumns = ['primaryKey', 'name', 'indexed'].map(simpleColumnGenerator);

    return [
      ...simpleColumns,
      typeColumnGroup,
    ];
  }

  const renderTableCells = (
    value: unknown,
    type: string,
    column: string,
    record: SchemaProperty
  ) => {
    // console.log('rendering, ', value, type, column, record);
    if (column === 'objectType' && isPropertyLinked(record)) {
      return renderPropertyLinked(record.objectType as string, schemas, onSchemaSelected);
    }

    switch (type) {
      case 'boolean':
        return (
          <BooleanValue active={!!value as boolean} value={value.toString()} />
        );
      case 'string':
        return <Text>{value as string}</Text>;
      default:
        return <Text />;
    }
  };

  const { order, properties, primaryKey } = currentSchema;
  const columns = [
    'primaryKey',
    'name',
    'type',
    // 'mapTo',
    'indexed',
    'optional',
    'objectType',
  ];
  const columnObjs = useMemoize(
    (columns: string[]) => createColumnConfig(),
    [columns]
  );

  // console.log('currentSchema', currentSchema);
  // console.log('createRowsproperties', properties);
  const rows = createRows(order, properties, primaryKey);

  return (
    <Layout.Container height={800}>
      <Table
        dataSource={rows}
        columns={columnObjs}
        size="middle"
        tableLayout="auto"
        bordered
      />
    </Layout.Container>
  );
};

export default React.memo(SchemaVisualizer);
