import React from "react";
import { Layout, createState } from "flipper-plugin";
import { Radio } from "antd";
import Prettyjson from "../components/Prettyjson";

export default function DataVisualizer(props) {
  var objectview = true;
  var objects = props.objects;
  return (
    <Layout.Container>
      <Layout.Container>
        <Radio.Group>
          <Radio.Button onClick={() => (objectview = true)}>
            Object View
          </Radio.Button>
          <Radio.Button onClick={() => (objectview = false)}>
            Table View
          </Radio.Button>
        </Radio.Group>
      </Layout.Container>
      <Layout.Container>{/**renderTableView()*/}</Layout.Container>
      <Layout.Container>{renderObjectView()}</Layout.Container>
    </Layout.Container>
  );

  function renderObjectView() {
    return objects.map((obj) => {
      return (
        <Prettyjson key={obj._id} json={obj}>
          {" "}
        </Prettyjson>
      );
    });
  }

  function renderTableView() {
    return objects.map((obj) => {
      console.log(obj._id);
      return <div>TABLE</div>;
    });
  }
}
