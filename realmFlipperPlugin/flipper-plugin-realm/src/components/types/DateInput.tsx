import { Button, DatePicker, Input, InputNumber } from "antd";
import moment from "moment";
import React from "react";
import { TypeInputProps } from "./TypeInput";

export const DateInput = ({
  property,
  setter,
  value,
  inputReset,
  style,
  refresh,
}: TypeInputProps) => {
  const onChange = (value: moment.Moment | null, dateString: string) => {
    setter(value ? value?.toDate() : null);
  };
  console.log('key:', inputReset)
  return (
    <Input.Group>
      <DatePicker
        style={style}
        key={inputReset}
        defaultValue={value}
        format="DD-MM-YYYY HH:mm:ss.SSS"
        showTime={{ defaultValue: property.optional ? undefined : moment() }}
        onChange={onChange}
        allowClear={property.optional}
      />
      {property.optional ? (
        <Button size="small" onClick={() => {
            setter(null);
            refresh();
        }}>
          clear
        </Button>
      ) : null}
    </Input.Group>
  );
};
