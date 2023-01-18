import { message, Table, Typography } from 'antd';
import { Layout, useMemoize, usePlugin } from 'flipper-plugin';
import React from 'react';
import { plugin } from '../index';
import { isPropertyLinked } from '../utils/linkedObject';
import BooleanValue from '../components/BooleanValue';
import {
  CanonicalObjectSchemaPropertyRow,
  SortedObjectSchema,
} from '../CommonTypes';

const { Text } = Typography;
const { Link } = Typography;

const createRows = (currentSchema: SortedObjectSchema) => {
  const { order, properties, primaryKey } = currentSchema;
  const newRows: CanonicalObjectSchemaPropertyRow[] = [];
  order.forEach((propName: string, index: number) => {
    const value = properties[propName];
    newRows.push({
      ...value,
      key: index,
      primaryKey: value.name === primaryKey,
    });
  });

  return newRows;
};
const renderPropertyLinked = (
  objectType: string,
  schemas: SortedObjectSchema[],
  onSchemaSelected: (selectedSchema: SortedObjectSchema) => void,
): string | JSX.Element => {
  const targetSchema = schemas.find((schema) => schema.name === objectType);
  if (!targetSchema) {
    return objectType;
  }
  return (
    <Link onClick={() => onSchemaSelected(targetSchema)}>
      {targetSchema.name}
    </Link>
  );
};

const renderFullType = (
  property: Realm.CanonicalObjectSchemaProperty,
  schemas: SortedObjectSchema[],
  onSchemaSelected: (selectedSchema: SortedObjectSchema) => void,
): string | JSX.Element => {
  let title;

  switch (property.type) {
    case 'list':
    case 'set':
    case 'dictionary':
    case 'object':
      title = (
        <>
          {renderPropertyLinked(
            property.objectType as string,
            schemas,
            onSchemaSelected,
          )}
        </>
      );
      break;
    default:
      title = <>{property.type}</>;
  }

  if (property.optional) {
    title = <>{title}?</>;
  }

  switch (property.type) {
    case 'list':
      title = (
        <>
          {title}
          {'[]'}
        </>
      );
      break;
    case 'set':
      title = (
        <>
          {title}
          {'<>'}
        </>
      );
      break;
    case 'dictionary':
      title = (
        <>
          {title}
          {'{}'}
        </>
      );
      break;
  }

  return title;
};

type InputType = {
  schemas: Array<SortedObjectSchema>;
  currentSchema: SortedObjectSchema | null;
};

const SchemaVisualizer = ({ schemas, currentSchema }: InputType) => {
  if (!currentSchema) {
    return <div> Please select a schema.</div>;
  }

  if (!schemas || !schemas.length) {
    return <div>No schemas found</div>;
  }
  const instance = usePlugin(plugin);

  const onSchemaSelected = (selectedSchema: SortedObjectSchema) => {
    if (currentSchema.name === selectedSchema.name) {
      message.info('You are already viewing this schema');
    }
    instance.setSelectedSchema(selectedSchema);
  };

  function createColumnConfig() {
    const simpleColumnGenerator = (columnName: string) => ({
      key: columnName,
      title: columnName,
      dataIndex: columnName,
      // onFilter: (value: string, record: any) => record[col].startsWith(value),
      render: (cellContent: string, record: CanonicalObjectSchemaPropertyRow) =>
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
          render: (
            cellContent: string,
            record: CanonicalObjectSchemaPropertyRow,
          ) => {
            return renderFullType(record, schemas, onSchemaSelected);
          },
        },
        ...innerTypeColumns,
      ],
    };

    // TODO: Consider using more descriptive column names
    const simpleColumns = ['primaryKey', 'name', 'indexed'].map(
      simpleColumnGenerator,
    );

    return [...simpleColumns, typeColumnGroup];
  }

  const renderTableCells = (
    value: unknown,
    type: string,
    column: string,
    record: Realm.CanonicalObjectSchemaProperty,
  ) => {
    if (column === 'objectType' && isPropertyLinked(record)) {
      return renderPropertyLinked(
        record.objectType as string,
        schemas,
        onSchemaSelected,
      );
    }

    switch (type) {
      case 'boolean':
        return (
          <BooleanValue
            active={!!value as boolean}
            value={(!!value as boolean) ? 'True' : 'False'}
          />
        );
      case 'string':
        return <Text>{value as string}</Text>;
      default:
        return <Text />;
    }
  };

  const columns = [
    'primaryKey',
    'name',
    'type',
    // 'mapTo',
    'indexed',
    'optional',
    'objectType',
  ];
  const columnObjs = useMemoize((_) => createColumnConfig(), [columns]);

  const rows = createRows(currentSchema);

  return (
    <Layout.Container height={800}>
      <Table
        showSorterTooltip={false}
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
