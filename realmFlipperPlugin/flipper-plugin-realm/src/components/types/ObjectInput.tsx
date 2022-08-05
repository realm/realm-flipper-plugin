import { usePlugin } from 'flipper-plugin';
import React, { useState } from 'react';
import { plugin } from '../..';
import { StringInput } from './StringInput';
import { TypeInputProps } from './TypeInput';


export const ObjectInput = ({ property, set, style, value }: TypeInputProps) => {
    const [chosen, setChosen] = useState(false);
    const instance = usePlugin(plugin);
    // print chosen object
    const renderChosen = () => {

        return <></>
    }

    const renderSelector = () => {

        return <></>
    }

    return chosen ? renderChosen() : renderSelector()
}