import { Button, DatePicker, Input, InputNumber } from "antd";
import moment from "moment";
import React from "react";
import { TypeInputProps } from "./TypeInput";


export const DateInput =  ({ property, setter, value, inputReset, style }: TypeInputProps) =>{
    const onChange = (value: moment.Moment | null, dateString: string) => {
        setter(value?.toDate());
    }
    return (
        <Input.Group>
        <DatePicker
            style={style}
            key={inputReset}
            defaultValue={value}
            format="DD-MM-YYYY HH:mm:ss.SSS"
            showTime={{ defaultValue: moment('00:00:00', 'HH:mm:ss.SSS') }}
            onChange={onChange}
            allowClear={property.optional}
        />
        {property.optional ? (
                <Button size="small" onChange={() => setter(null)}>
                clear
                </Button>
            ) : null}
        </Input.Group>

    )
};
