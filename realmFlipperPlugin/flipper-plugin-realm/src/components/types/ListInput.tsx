import { DeleteOutlined } from "@ant-design/icons";
import { Button, Input } from "antd";
import React, { useState } from "react";
import { getDefault, TypeInput, TypeInputProps } from "./TypeInput";

export const ListInput = ({
  property,
  setter,
  value,
  inputReset,
  refresh
}: TypeInputProps) => {
  const array: any[] = value;
  const setArray = setter;
  // TODO: handle non primitive
  //   const [array, setArray] = useState(value);
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
  const [key, setKey] = useState(0);

  return (
    <Input.Group key={key}>
      {array.map((value: any, index: number) => {
        return (
          <Input.Group key={index}>
            <TypeInput
              style={{ width: "calc(100% - 26px)" }}
              key={2 * index}
              property={innerProp}
              setter={(val) => {
                array[index] = val;
                setArray(array);
              }}
              value={value}
              inputReset={inputReset}
              refresh={refresh}
            ></TypeInput>
            <Button
              key={2 * index + 1}
              type="primary"
              icon={<DeleteOutlined />}
              size={"small"}
              // remove ith element
              onClick={() => { console.log('before', array); setArray(array.filter((_, i) => i !== index )); setKey(key => key + 1) }}
            />
          </Input.Group>
        );
      })}
      <Button onClick={() => setArray([...array, getDefault(innerProp)])}>
        Add {property.objectType}
      </Button>
    </Input.Group>
  );
};
