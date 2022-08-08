import { DeleteOutlined } from "@ant-design/icons";
import { Button, Col, Layout, Row } from 'antd';
import React, { useState } from "react";
import { getDefault, TypeInput, TypeInputProps } from "./TypeInput";

export const ListInput = ({ property, set, value }: TypeInputProps) => {
  const [reset, setReset] = useState(0);
  const array: any[] = value;
  const setArray = set;
  const typePointed = property.objectType;
  if (!typePointed) {
    return <></>;
  }
  const innerProp = {
    type: typePointed,
    name: "",
    indexed: false,
    mapTo: "",
    optional: false,
  };
  // console.log(array);
  return (
    <Layout>
      {array.map((value: any, index: number) => {
        return (
          <Layout key={index} style={{ backgroundColor: "white"}}>
            <Row align="middle">
              <Col flex="auto">
                <TypeInput
                style={{ width: "100%" }}
                property={innerProp}
                set={(val) => {
                  const arr = array;
                  arr[index] = val;
                  setArray(arr);
                  setReset((v) => v + 1);
                }}
                value={value}
              ></TypeInput>
              </Col>
              <Col>
              <Button
              key={-index - 1}
              type="primary"
              icon={<DeleteOutlined />}
              // size={"small"}
              // remove ith element
              onClick={() => {
                setArray(array.filter((_, i) => i !== index));
                setReset((v) => v + array.length + 2);
              }}
            />
              </Col>
            </Row>
          </Layout>
        );
      })}
      <Button onClick={() => setArray([...array, getDefault(innerProp)])}>
        Add {property.objectType}
      </Button>
    </Layout>
  );
};
