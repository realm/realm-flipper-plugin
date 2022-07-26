import { Input } from 'antd';
import React from 'react';
import { TypeInputProps } from './CommonInput';

export const StringInput = ({
    property,
    setter,
    value,
    inputReset,
    style
}: TypeInputProps) => {
    return (
        <Input
        key={inputReset}
        placeholder={property.optional ? "null" : undefined}
        defaultValue={value}
        style={style}
        onChange={(v) => {
            // user change vs clear button
            if (v.type == 'change')
                setter(v.target.value)
            else
                setter(null)
            }}
        allowClear={property.optional}
        />
    )
}