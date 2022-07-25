import { Button, Input } from "antd";
import React, { useState } from "react";
import { TypeInputProps } from "./CommonInput";
import uuid from 'react-native-uuid';

export const UUIDInput = ({
  property,
  values,
  inputReset,
}: TypeInputProps) => {
  const [content, setContent] = useState('');
  const onChange = (value: string) => {
    console.log('onchange', value);
    setContent(value)
    // content = value;
    values[property.name] = value;
  };
  // TODO handling invalid uuids?
  return (
    <Input.Group>
    <Input
      key={inputReset}
      value={content}
      onChange={v => onChange(v.target.value)}
      placeholder={property.optional ? "null" : undefined}
      allowClear={property.optional}
      status={uuid.validate(content) ? "" : "error"}
    />
    <Button onClick={() => { 
        setContent(uuid.v4().toString())
        // content = '12345'
        values[property.name] = content;
        console.log(content)
        } }>
        refresh
    </Button>
    </Input.Group>

  );
};
