import React from "react";
import { useState } from "react";
import { Layout, DataTable, useMemoize } from "flipper-plugin";
import { Radio } from "antd";
import Prettyjson from "../components/Prettyjson";
import { Value } from "../utils/TypeBasedValueRenderer";
import { SchemaResponseObject } from "../index";
import { createColumnConfig } from "../pages/SchemaVisualizer";

export default function DataVisualizer(props: {
  objects: Array<Object>;
  schemas: Array<SchemaResponseObject>;
  getObjects: Function;
}) {
  // State to switch between views. true = objectView, false = tableView
  const [objectView, setView] = useState(true);

  // Return buttons + objectView or tableView
  return (
    <Layout.ScrollContainer>
      <Layout.Container>
        <Radio.Group>
          <Radio.Button onClick={() => setView(true)}>Object View</Radio.Button>
          <Radio.Button onClick={() => setView(false)}>Table View</Radio.Button>
        </Radio.Group>
      </Layout.Container>
      <Layout.Container>
        {objectView ? <ObjectView /> : <TableView />}
      </Layout.Container>
    </Layout.ScrollContainer>
  );

  // Render objectView
  function ObjectView() {
    // Map over all objects and genereate a Prettyjson component for each.
    return (
      <Layout.Container>
        {props.objects.map((obj) => {
          return (
            //@ts-ignore
            <Prettyjson key={obj._id} json={obj}>
              {" "}
            </Prettyjson>
          );
        })}
      </Layout.Container>
    );
  }

  // Render TableView
  function TableView() {
    // Take the keys of the schema in position 0 and put them into an array.
    const columns = Object.keys(props.schemas[0].properties).map((x) => {
      return x;
    });

    // Genereate a list of column objects.
    const columnObjs: Array<Object> = useMemoize(
      (columns: string[]) => createColumnConfig(columns),
      [columns]
    );

    // Instantiate an array with row objects and fill it with data.
    const rows: Array<Object> = [];
    props.objects.forEach(function (obj: Object) {
      let rowObj: { [key: string]: Value } = {};
      columns.forEach(function (key) {
        rowObj[key] = { type: typeof obj[key], value: obj[key] };
      });
      rows.push(rowObj);
    });

    // Render a data table and return it.
    return (
      <Layout.Container height={800}>
        <DataTable<{ [key: string]: Value }>
          records={rows}
          columns={columnObjs}
          enableSearchbar={false}
        />
      </Layout.Container>
    );
  }
}
