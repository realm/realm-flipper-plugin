import {
  Typography
} from 'antd';
import { DataTable, DataTableColumn, Layout, useMemoize } from 'flipper-plugin';
import React from "react";
import { SchemaPropertyValue, SchemaResponseObject } from '../index';
import { renderValue, Value } from '../utils/TypeBasedValueRenderer';
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
    const {schemas} = props;
    const [schemaObjects] = schemas
    if (!schemaObjects) {
      return (<div>No schemas found</div>);
    }
    const {name, properties, primaryKey} = schemaObjects
    const columns =  ["name","type", "mapTo","indexed", "optional", "primaryKey"]
    const columnObjs = useMemoize(
        (columns: string[]) => createColumnConfig(columns),
        [columns],
      );
    const rows = createRows(properties, primaryKey);
    
    
    return (
       <Layout.Container height={400}>
        <Typography >{name}</Typography>
        <DataTable<{[key: string]: Value}>
          records={rows}
          columns={columnObjs}
          enableSearchbar={false}
        />
    </Layout.Container>
    )
})