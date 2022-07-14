import React from "react";
import {Value, renderValue} from './TypeBasedValueRenderer';
import {SchemaResponseObject} from '../index'
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
  function createRows(
    properties: Object[]
  ): Object[] {
    return rows.map((values) =>
      values.reduce((acc: {[key: string]: Value}, cur: Value, i: number) => {
        acc[columns[i]] = cur;
        return acc;
      }, {}),
    );
  }
export default React.memo((props: {schemas: Array<SchemaResponseObject>}) => {
    const {schemas} = props;
    const [schemaObjects] = schemas
    const {properties, primaryKey} = schemaObjects
    let newRows = []
    Object.entries(properties).forEach(([key, value], index) => {
        let newObj = {}
        Object.entries(value).forEach(([key, value]) => {
            newObj[key]={type: typeof value, value: value}
        })
        console.log("value here", value)
        newObj["primaryKey"]={type: "boolean", value: primaryKey===value.name}
        newRows.push(newObj)
       // newRows[index]=
    })
    const columns =  ["name","type", "mapTo","indexed", "optional", "primaryKey"]
    const columnObjs = useMemoize(
        (columns: string[]) => createColumnConfig(columns),
        [columns],
      );

      return (
       <Layout.Container height={400}>
      <DataTable<{[key: string]: Value}>
        records={newRows}
        columns={columnObjs}
        enableSearchbar={false}
      />
    </Layout.Container>
    )
})