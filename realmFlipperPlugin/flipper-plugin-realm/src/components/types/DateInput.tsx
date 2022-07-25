import { DatePicker, InputNumber } from "antd";
import moment from "moment";
import React from "react";
import { TypeInputProps } from "./CommonInput";


export const DateInput =  ({ property, values, inputReset }: TypeInputProps) =>{
    const onChange = (value: moment.Moment | null, dateString: string) => {
        values[property.name] = value?.toDate();
    }
    return (
        <DatePicker
        key={inputReset}
        format="DD-MM-YYYY HH:mm:ss.SSS"
        showTime={{ defaultValue: moment('00:00:00', 'HH:mm:ss.SSS') }}
        onChange={onChange}
      />
    )
};
