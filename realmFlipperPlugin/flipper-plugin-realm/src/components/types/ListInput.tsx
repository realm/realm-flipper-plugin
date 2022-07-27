import { DeleteOutlined } from "@ant-design/icons";
import { Button, Input } from "antd";
import React, { useState } from "react";
import { getDefault, TypeInput, TypeInputProps } from "./TypeInput";

export const ListInput = ({
  property,
  set,
  value,
}: TypeInputProps) => {
  const [_, setReset] = useState(0);

  const array: any[] = value;
  const setArray = set;
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
//   console.log(array)
  return (
    <Input.Group>
      {array.map((value: any, index: number) => {
        let keyo = 2 * index;
        return (
          <Input.Group key={index}>
            <TypeInput
              style={{ width: "calc(100% - 26px)" }}
              key={keyo}
              property={innerProp}
              set={(val) => {
                setReset(v => v + 1);
                let arr = array;
                arr[index] = val;
                setArray(arr);
              }}
              value={value}
            ></TypeInput>
            <Button
              key={2 * index + 1}
              type="primary"
              icon={<DeleteOutlined />}
              size={"small"}
              // remove ith element
              onClick={() => { console.log('before', array); setArray(array.filter((_, i) => i !== index )); }}
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
