import React from "react";
import {Value, renderValue} from '../utils/TypeBasedValueRenderer';
import {SchemaResponseObject, SchemaPropertyValue} from '../index'
import {DataTable, DataTableColumn, Layout, useMemoize} from 'flipper-plugin';

function createColumnConfig(columns: string[]) {
    const columnObjs: DataTableColumn<{[key: string]: Value}>[] = columns.map(
      (c) => ({
        key: c,
        title: c,
        onRender(row) {
          return renderValue(row[c]);
        },
      }),
    );
    return columnObjs;
  }

  function createRows(properties: { [key: string]: SchemaPropertyValue; }, primaryKey: String): {[key: string]: Value}[] {
    let newRows: {[key: string]: Value}[] = []
    Object.values(properties).forEach((value: SchemaPropertyValue) => {
      let rowObj: {[key: string]: Value} = {}
      Object.entries(value).forEach(([key, value]: [string, boolean | string | number]) => {
          rowObj[key]={type: typeof value, value: value} as Value
      })
      rowObj["primaryKey"]={type: "boolean", value: primaryKey===value.name}
      newRows.push(rowObj)
     
  })
    return newRows;
  }
export default React.memo((props: {schemas: Array<SchemaResponseObject>}) => {
    console.log(props)
    const {schemas} = props;
    const [schemaObjects] = schemas
    const {name, properties, primaryKey} = schemaObjects
    const columns =  ["name","type", "mapTo","indexed", "optional", "primaryKey"]
    const columnObjs = useMemoize(
        (columns: string[]) => createColumnConfig(columns),
        [columns],
      );
    const rows = createRows(properties, primaryKey);
    
    
    return (
       <Layout.Container height={400}>
        <Text>{name}</h1>
        <DataTable<{[key: string]: Value}>
          records={rows}
          columns={columnObjs}
          enableSearchbar={false}
        />
    </Layout.Container>
    )
})