import React from "react";
import { SchemaPropertyValue } from "../..";
import { BoolInput } from "./BoolInput";
import { DateInput } from "./DateInput";
import {IntInput} from "./IntInput";
import { StringInput } from "./StringInput";
import { UUIDInput } from "./UUIDInput";
export type TypeInputProps = {
    property: SchemaPropertyValue,
    values: {
        [prop: string]: any;
    },
    inputReset: number
}

export const TypeInput = (props: {
    property: SchemaPropertyValue, values: TypeInputProps, inputReset: number}
    ) => {
    switch (props.property.type) {
    case 'int':
    case 'float':
    case 'double':
        return <IntInput property={props.property} values={props.values} inputReset={props.inputReset} />
    case 'string':
        return <StringInput property={props.property} values={props.values} inputReset={props.inputReset} />
    case 'bool':
        return <BoolInput property={props.property} values={props.values} inputReset={props.inputReset} />
    case 'date':
        return <DateInput property={props.property} values={props.values} inputReset={props.inputReset} />
    case 'uuid':
        return <UUIDInput property={props.property} values={props.values} inputReset={props.inputReset} />
    default:
        return <></>
    }
}