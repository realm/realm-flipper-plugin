import { InputNumber, Input, Button } from "antd";
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
    })

    return obj;
}

export const DictionaryInput = ({
  property,
  value,
  set,
  style,
}: TypeInputProps) => {
  const [contents, setContents] = useState(new Map<number, [string, any]>());
  const [_, setReset] = useState(0);
//   const dict = value as {
//     [keys: string]: any;
//   };
console.log('rerender, size:', contents.size)
  const keyProperty: SchemaPropertyValue = {
    name: "",
    type: "string",
    indexed: false,
    optional: false,
    mapTo: "",
  };
  //   console.log('dict:', dict)
  //   property.optional = false;
  //   value = getDefault(property)

  return (
    <Input.Group>
      {Array.from(contents.values()).map(
    (value: [string, any], index: number) => {
        console.log('in here')
        // let vari = null;
        return (
          <Input.Group key={index}>
            <StringInput
              value={value[0]}
              set={(val: any) => {
                // console.log("obj currently", dict);
                contents.set(index, [val, value[1]]);
                setContents(contents);
                set(mapToObj(contents));
              }}
              property={keyProperty}
            ></StringInput>
            <MixedInput
              property={keyProperty}
              set={(val: any) => {
                console.log("setter in dictionary", val);
                contents.set(index, [value[0], val])
                setContents(contents);
                set(mapToObj(contents));
                setReset((v) => v + 1);
              }}
            ></MixedInput>
          </Input.Group>
        );
      })}
      <Button
        onClick={(ev) => {
          contents.set(contents.size, ["key" + contents.size , null])
          console.log(contents)
          setContents(contents);
          set(mapToObj(contents))
          setReset((v) => v + 1);
        }}
      >
        Add new
      </Button>
    </Input.Group>
  );
};
