import { Table, Typography } from 'antd';
import { DataTableColumn, Layout, styled, theme, useMemoize, usePlugin, useValue } from 'flipper-plugin';
import React from "react";
import { plugin, SchemaPropertyValue, SchemaResponseObject } from '../index';
import { Value } from '../utils/TypeBasedValueRenderer';
const {Text} = Typography;
const {Link} = Typography;

const NonWrappingText = styled(Text)({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});
const BooleanValue = styled(NonWrappingText)<{active?: boolean}>((props) => ({
  '&::before': {
    content: '""',
    display: 'inline-block',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: props.active ? theme.successColor : theme.errorColor,
    marginRight: 5,
    marginTop: 1,
  },
}));
  


  export function createRows(properties: { [key: string]: SchemaPropertyValue; }, primaryKey: String): Object[] {
    let newRows: Object[] = []
    Object.values(properties).forEach((value: SchemaPropertyValue, index: number) => {
      newRows.push({...value, key: index, primaryKey: value.name===primaryKey});
  })

    return newRows;
  }
export default React.memo((props: {schemas: Array<SchemaResponseObject>, selectedSchema: string}) => {
    const instance = usePlugin(plugin);
    const state = useValue(instance.state);

    const onSchemaSelected = 
        (selected: string) => {
            instance.getObjects({realm: state.selectedRealm,schema: selected});
          instance.updateSelectedSchema({
            schema: selected,
          });    
    };

function createColumnConfig(columns: string[]) {
  const columnObjs: DataTableColumn<{[key: string]: Value}>[] = columns.map(
    (col) => ({
      key: col,
      title: col,
      dataIndex: col,
      sorter: (a, b) => {
        if (a[col] > b[col]) {
          return 1;
        }
        else if (a[col] < b[col]) {
          return -1;
        }
        else {
          return 0;
        }
      },
      onFilter: (value: string, record: any) => record[col].startsWith(value),
      render: (text) => renderTableCells(text, typeof text, col),
      filterSearch: true,
    }),
  );
  return columnObjs;
}
    function renderTableCells(value: string, type: string, column: string) {
      if (column === 'objectType' && value ) {
        return <Link onClick={() => onSchemaSelected(value)}>{value}</Link>
      }
      switch (type) {
        case 'boolean':
          return (
            <BooleanValue active={Boolean(value)}>{value.toString()}</BooleanValue>
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
          if (Array.isArray(value)) return <Text>[{value.toString()}]</Text>
          else return <Text>{JSON.stringify(value)}</Text>
        default: 
          return <Text />;
      }
    }
    const {schemas, selectedSchema} = props;
    console.log(schemas)
    if (!schemas || !schemas.length) {
      return (<div>No schemas found</div>);
    }
    let currentSchema: SchemaResponseObject = schemas[0];
    schemas.forEach((schema) => {
      if (schema.name === selectedSchema) {
        currentSchema = schema;
        return;
      }
    })

    const {properties, primaryKey} = currentSchema;
    const columns =  ["name","type", "mapTo","indexed", "optional", "primaryKey", "objectType"]
    const columnObjs = useMemoize(
        (columns: string[]) => createColumnConfig(columns),
        [columns],
    );
    const rows = createRows(properties, primaryKey);
    return (
       <Layout.Container height={800}>
        <Table dataSource={rows} columns={columnObjs} />
    </Layout.Container>
    )
})