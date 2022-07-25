import { Button, Input } from "antd";
import React, { useState } from "react";
import { getDefault, TypeInput, TypeInputProps } from "./CommonInput";

export const ListInput = ({
  property,
  setter,
  value,
  inputReset,
}: TypeInputProps) => {
  // TODO: handle non primitive
  const [array, setArray] = useState(value);
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

  return (
    <Input.Group key={inputReset}>
      {array.map((value: any, index: number) => {
        return (
          <TypeInput key={index}
            property={innerProp}
            setter={(val) => {
              let arr = array;
              arr[index] = val;
              setArray(arr);
            }}
            value={value}
            inputReset={inputReset}
          ></TypeInput>
        );
      })}
      <Button onClick={() => setArray([...array, getDefault(innerProp)])}>
        Add {property.objectType}
      </Button>
    </Input.Group>
  );
};
