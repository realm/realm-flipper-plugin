import React, { useState } from 'react';
import { StringInput } from './StringInput';
import { TypeInputProps } from './TypeInput';
import { ObjectId } from 'bson';
import { Button, Col, Input, Row } from 'antd';
import { ClearOutlined } from '@ant-design/icons';

// TODO: use Realm.BSON ObjectId

export const ObjectIdInput = (props: TypeInputProps) => {
    return (
        <StringInput {...props}></StringInput>
    )
}
