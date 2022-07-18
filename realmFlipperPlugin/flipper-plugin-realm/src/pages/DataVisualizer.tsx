import React from "react";
import { useState } from "react";
import { Layout, DataTableColumn, DataTable, useMemoize } from "flipper-plugin";
import { Radio } from "antd";
import Prettyjson from "../components/Prettyjson";
import { renderValue, Value } from "../utils/TypeBasedValueRenderer";
import { SchemaResponseObject } from "../index";
import { createColumnConfig } from "../pages/SchemaVisualizer";

export default function DataVisualizer(props: {
  objects: Array<Object>;
  schemas: Array<SchemaResponseObject>;
  getObjects: Function;
}) {
  //var objectview = false;
  var objects = props.objects;

  const [objectview, setView] = useState(true);

  return (
    <Layout.ScrollContainer>
      <Layout.Container>
        <Radio.Group>
          <Radio.Button onClick={() => setView(true)}>Object View</Radio.Button>
          <Radio.Button onClick={() => setView(false)}>Table View</Radio.Button>
        </Radio.Group>
        <Radio.Group>
          <Radio.Button onClick={() => props.getObjects()}>
            Refresh
          </Radio.Button>
        </Radio.Group>
      </Layout.Container>
      <Layout.Container>
        {objectview ? <ObjectView /> : <TableView />}
      </Layout.Container>
    </Layout.ScrollContainer>
  );

  function ObjectView() {
    return objects.map((obj) => {
      return (
        <Prettyjson key={obj._id} json={obj}>
          {" "}
        </Prettyjson>
      );
    });
  }

  function TableView() {
    const columns = Object.keys(props.schemas[0].properties).map((x) => {
      return x;
    });

    const columnObjs = useMemoize(
      (columns: string[]) => createColumnConfig(columns),
      [columns]
    );

    const rows: Array<Object> = [];

    objects.forEach(function (obj) {
      var rowObj: Object = {};
      columns.forEach(function (key) {
        rowObj[key] = { type: typeof obj[key], value: obj[key] };
      });
      rows.push(rowObj);
    });

    return (
      <Layout.Container height={400}>
        <DataTable<{ [key: string]: Value }>
          data-testid={name}
          records={rows}
          columns={columnObjs}
          enableSearchbar={false}
        />
      </Layout.Container>
    );
  }
}
