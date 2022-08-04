import { ArrowRightOutlined } from "@ant-design/icons";
import { InputNumber, Input, Button, Layout, Col, Row } from "antd";
import React, { useState } from "react";
import { SchemaPropertyValue } from "../..";
import ObjectAdder from "../ObjectAdder";
import { MixedInput } from "./MixedInput";
import { StringInput } from "./StringInput";
import { getDefault, TypeInputProps } from "./TypeInput";

const mapToObj = (map: Map<number, [string, any]>) => {
  const obj = new Object();
  map.forEach((val: [string, any]) => {
    obj[val[0] as keyof typeof obj] = val[1];
  });

  return obj;
};

export const DictionaryInput = ({
  property,
  value,
  set,
  style,
}: TypeInputProps) => {
  const [contents, setContents] = useState(new Map<number, [string, any]>());
  const [_, setReset] = useState(0);

  console.log("rerender, size:", contents.size);
  const keyProperty: SchemaPropertyValue = {
    name: "",
    type: "string",
    indexed: false,
    optional: false,
    mapTo: "",
  };

  return (
    <Layout>
      {Array.from(contents.values()).map(
        (value: [string, any], index: number) => {
          return (
            <Row key={index} style={{ backgroundColor: 'white' }} align="middle">
              <Col span={10}>
              <StringInput
                value={value[0]}
                set={(val: any) => {
                  contents.set(index, [val, value[1]]);
                  setContents(contents);
                  set(mapToObj(contents));
                }}
                property={keyProperty}
              ></StringInput>
              </Col>
              <Col span={2}>
                <ArrowRightOutlined />
              </Col>
              <Col span={12}>
              <MixedInput
                value={value} //shouldnt be used
                property={keyProperty}
                set={(val: any) => {
                  contents.set(index, [value[0], val]);
                  setContents(contents);
                  set(mapToObj(contents));
                  setReset((v) => v + 1);
                }}
              ></MixedInput>
              </Col>
            </Row>
          );
        }
      )}
      <Button
        onClick={() => {
          contents.set(contents.size, ["key" + contents.size, null]);
          console.log(contents);
          setContents(contents);
          set(mapToObj(contents));
          setReset((v) => v + 1);
        }}
      >
        Add new
      </Button>
    </Layout>
  );
};
