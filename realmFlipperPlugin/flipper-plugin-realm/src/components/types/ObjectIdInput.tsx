import React from 'react';
import { StringInput } from './StringInput';
import { TypeInputProps } from './TypeInput';

// TODO: use Realm.BSON ObjectId

export const ObjectIdInput = (props: TypeInputProps) => {
    return (
        <StringInput {...props}></StringInput>
    )
}