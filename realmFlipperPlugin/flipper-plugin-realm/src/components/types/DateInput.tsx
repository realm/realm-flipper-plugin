import { Button, DatePicker, Input, InputNumber } from "antd";
import moment from "moment";
import React, { useState } from "react";
import { TypeInputProps } from "./TypeInput";

export const DateInput = ({
  property,
  value,
  set,
  style,
}: TypeInputProps) => {
  const [_, setReset] = useState(0);

  const onChange = (value: moment.Moment | null, dateString: string) => {
    set(value ? value?.toDate() : null);
  };
//   console.log('key:', inputReset)
  return (
    <Input.Group>
      <DatePicker
        style={style}
        // key={inputReset}
        defaultValue={value}
        format="DD-MM-YYYY HH:mm:ss.SSS"
        showTime={{ defaultValue: property.optional ? undefined : moment() }}
        onChange={onChange}
        allowClear={property.optional}
      />
      {property.optional ? (
        <Button size="small" onClick={() => {
            set(null);
            setReset(v => v + 1)
        }}>
          clear
        </Button>
      ) : null}
    </Input.Group>
  );
};
