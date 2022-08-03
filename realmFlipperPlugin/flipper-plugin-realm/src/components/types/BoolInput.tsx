import { Radio, RadioChangeEvent, Input, Button } from "antd";
import { TypeInputProps } from "./TypeInput";
import React, { useState } from "react";

export const BoolInput = ({ property, set, value }: TypeInputProps) => {
  const [_, setReset] = useState(0);

  const options = [
    {
      label: "True",
      value: "True",
    },
    {
      label: "False",
      value: "False",
    },
  ];
  const onChange = ({ target: { value } }: RadioChangeEvent) => {
    set(value === "True");
  };
  return (
    
    <Input.Group style={{ alignItems: "stretch", justifyContent: "center", flexFlow: 'flex-end', alignContent: "center", flexGrow: 4}}>
      <Radio.Group
        defaultValue={value === null ? undefined : value ? "True" : "False"}
        style={{ width:'100%', backgroundColor: 'white', alignItems: "center", justifyContent: "center", flexFlow: 'column', flexDirection: 'column', alignContent: "center", }}
        options={options}
        onChange={onChange}
        optionType="button"
        value={value === null ? undefined : value ? "True" : "False"}
      />

      {property.optional ? (
        <Button
          size="small"
          onClick={() => {
            set(null);
            setReset((v) => v + 1);
          }}
        >
          clear
        </Button>
      ) : null}
    </Input.Group>
  );
};