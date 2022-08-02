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
  const [reset, setReset] = useState(0);

  const onChange = (value: moment.Moment | null, dateString: string) => {
    set(value ? value?.toDate() : null);
  };

  return (
    <Input.Group>
      <DatePicker
        style={style}
        defaultValue={value}
        format="DD-MM-YYYY HH:mm:ss.SSS"
        showTime={{ defaultValue: property.optional ? undefined : moment() }}
        onChange={onChange}
        allowClear={property.optional}
        key={reset}
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