import { DeleteOutlined } from "@ant-design/icons";
import { Button, Input } from "antd";
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
    console.log(array)
  return (
    <Input.Group>
      {array.map((value: any, index: number) => {
        let keyo = reset + index + 1;
        return (
          <Input.Group key={index}>
            <TypeInput
              style={{ width: "calc(100% - 26px)" }}
              key={keyo}
              property={innerProp}
              set={(val) => {
                let arr = array;
                arr[index] = val;
                setArray(arr);
                setReset((v) => v + array.length + 1);
              }}
              value={value}
            ></TypeInput>
            <Button
              key={-index - 1}
              type="primary"
              icon={<DeleteOutlined />}
              size={"small"}
              // remove ith element
              onClick={() => {
                setArray(array.filter((_, i) => i !== index));
                setReset(v => v + array.length + 2)
              }}
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
