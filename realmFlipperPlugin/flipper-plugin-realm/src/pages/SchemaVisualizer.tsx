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
            console.log("row",row)
            console.log("c", c)
          return renderValue(row[c]);
        },
      }),
    );
    return columnObjs;
  }
  function createRows(
    columns: string[],
    rows: Value[][],
  ): {[key: string]: Value}[] {
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
    const {properties} = schemaObjects
    console.log("schemaobjects",schemaObjects)
    console.log("properties",properties)
    let newRows = []
    Object.entries(properties).forEach(([key, value], index) => {
        console.log(value)
        console.log(index)
        let newObj = {}
        Object.entries(value).forEach(([key, value]) => {
            console.log("here", key,value)
            newObj[key]={type: typeof value, value: value}
        })
        newRows.push(newObj)
       // newRows[index]=
    })
    const rowObjss =[
        {
            "name": {
                "type": "string",
                "value": "locale" 
            },
            "type": {
                "type": "string",
                "value": "TEXT"
            },
            "mapTo": {
                "type": "boolean",
                "value": true
            },
            "indexed": {
                "type": "null"
            },
            "optional": {
                "type": "boolean",
                "value": false
            },
            "primaryKey": {
                "type": "null"
            }
        }
    ]
    console.log("rowObjss",rowObjss)
    const columns =  ["name","type", "mapTo","indexed", "optional"] //primarykey
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