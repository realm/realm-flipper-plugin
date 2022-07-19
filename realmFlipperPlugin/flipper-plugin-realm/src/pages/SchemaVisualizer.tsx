import {
  Typography, Button
} from 'antd';
import { DataTable, DataTableColumn, Layout, useMemoize, usePlugin, useValue } from 'flipper-plugin';
import React from "react";
import { useCallback } from 'react';
import { SchemaPropertyValue, SchemaResponseObject, plugin } from '../index';
import { renderValue, Value } from '../utils/TypeBasedValueRenderer';
import Prettyjson from '../components/Prettyjson';
import SchemaSelect from '../components/SchemaSelect';
import ViewSelecter from '../components/ViewSelecter';
export function createColumnConfig(columns: string[]) {
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

  export function createRows(properties: { [key: string]: SchemaPropertyValue; }, primaryKey: String): {[key: string]: Value}[] {
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
    const instance = usePlugin(plugin);
    const state = useValue(instance.state)
    let objectView = false;
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


    function renderObjectView() {
      return schemas.map((obj) => {
        return (
          <Prettyjson key={obj.name} json={schemas} />
        );
      });
    }
    return (
       <Layout.Container height={800}>
        <Typography >{name}</Typography>
        {state.selectedDataView==='object' ?
         {renderObjectView}
        :
        <DataTable<{[key: string]: Value}>
          data-testid = {name}
          records={rows}
          columns={columnObjs}
          enableSearchbar={false}
        />
        }
    </Layout.Container>
    )
})