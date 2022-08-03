import { DeleteOutlined } from "@ant-design/icons";
import { Button, Input } from "antd";
import React, { useState } from "react";
import { getDefault, TypeInput, TypeInputProps } from "./TypeInput";

export const SetInput = ({ property, set, value }: TypeInputProps) => {
  const [reset, setReset] = useState(0);
  const [arr, setArr] = useState([] as any[]);
  const [occurences] = useState(new Map<any, number>());

  const container = value as Set<any>;
  
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
  const setRow = (val: any, index: number) => {
    const prevValue = arr[index];
    if (val === null && prevValue === null) {
      return;
    } else if (val === null) {
      occurences.set(prevValue, (occurences.get(prevValue) || 0) - 1);
      if (occurences.get(prevValue) === 0) {
        occurences.delete(prevValue);
        container.delete(prevValue);
      }
      arr[index] = null;
    } else {
      if (prevValue != null) {
        occurences.set(prevValue, (occurences.get(prevValue) || 0) - 1);
        if (occurences.get(prevValue) === 0) {
          occurences.delete(prevValue);
          container.delete(prevValue);
        }
      }

      container.add(val);
      set(container);
      arr[index] = val;
      occurences.set(val, (occurences.get(val) || 0) + 1);
    }
  };

  const deleteRow = (index: number) => {
    console.log('deleteRow', occurences);
    const prevValue = arr[index];
    if (prevValue !== null) {
      occurences.set(prevValue, (occurences.get(prevValue) || 0) - 1);
      if (occurences.get(prevValue) == 0) {
        container.delete(prevValue);
        occurences.delete(prevValue);
      }
    }
    setArr(arr.filter((_, i) => i !== index));
    console.log('deleteRow', occurences);
  };

  // Array.from(container.values())
  return (
    <Input.Group>
      {arr.map((value: any, index: number) => {
        console.log('value: ' + value, 'index: ' + index);
        let keyo = reset + index + 1;
        // const count = occurences.get(value);
        return (
          <Input.Group key={index} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center'}}>
            <TypeInput
            //   extraProps={{ style: { width: "calc(100% - 50px)" }, status: (count != undefined && count > 1 ? 'error' : '')}}
              key={keyo}
              property={innerProp}
              set={(val) => {
                setRow(val, index);
                // setReset((v) => v + container.size + 1);
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
                console.log('before', arr)
                deleteRow(index);
                console.log('after', arr)
                setReset((v) => v + arr.length + 2);
              }}
            />
          </Input.Group>
        );
      })}
      <Button
        onClick={() => {
          // const val = getDefault(innerProp);
          setArr([...arr, null]);
        }}
      >
        Add {property.objectType}
      </Button>
    </Input.Group>
  );
};
