import React, { useState } from 'react';
import { StringInput } from './StringInput';
import { TypeInputProps } from './TypeInput';


export const ObjectInput = ({ property, set, style, value }: TypeInputProps) => {
    const [chosen, setChosen] = useState(false);

    // print chosen object
    const renderChosen = () => {

        return <></>
    }

    const renderSelector = () => {

        return <></>
    }

    return chosen ? renderChosen() : renderSelector()
}