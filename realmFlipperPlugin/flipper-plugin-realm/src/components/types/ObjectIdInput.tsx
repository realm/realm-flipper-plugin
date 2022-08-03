import React from 'react';
import { StringInput } from './StringInput';
import { TypeInputProps } from './TypeInput';

// TODO: use Realm.BSON ObjectId

export const ObjectIdInput = ({ property, set, style, value }: TypeInputProps) => {
    return (
        <StringInput property={property} set={set} style={style} value={value}></StringInput>
    )
}