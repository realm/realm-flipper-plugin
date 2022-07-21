import { useState } from "react";
import { SchemaPropertyValue, SchemaResponseObject } from "..";
import { Modal, Radio, InputNumber, Input, Layout, Tag, Button } from "antd";
import { CopyOutlined } from '@ant-design/icons';

import React from "react";

const forEachProp = (props: {
    [key: string]: SchemaPropertyValue;
}, f: (prop: SchemaPropertyValue) => any) => {
    return Object.keys(props).map(property => { return f(props[property]) })
}

let values: {
    [prop: string]: any;
} = {};


export default (props: {schema: SchemaResponseObject | undefined, addObject: Function}) => {
    const schema = props.schema;
    if (!schema) {
        return <></>;
    }
    const [visible, setVisible] = useState(false);
    const [inputReset, setInputReset] = useState(0);

    const showModal = () => {
        values = {};
        setVisible(true);
    };

    const hideModal = () => {
        values = {};
        setInputReset(inputReset + 1);
        setVisible(false);
    };

    // const [obj, setObject] = useState(emptySt);


    const addObject = () => {
        console.log('addObject', values)
        console.log(props.addObject)
        props.addObject(values)

        hideModal();
    }
    const getDefault = (type: String) => {
        if (type === 'string') {
            return ''
        }
        else if (type === 'int') {
            return 0
        }
        else {
            return null
        }
    }
    const renderProperty = (property: SchemaPropertyValue, isPrimary: boolean) => {

        // setObject(obj => {
        //     obj[property.name] = getDefault(property.type)
        // })
        if (!property.optional)
            values[property.name] = getDefault(property.type)
        else
            values[property.name] = null

        const renderInput = () => {
            console.log('property', property.name, 'value: ', values[property.name])
            return (
                <Input
                key={inputReset}
                placeholder={property.optional ? "null" : undefined}
                defaultValue={values[property.name]}
                onChange={(v) => { values[property.name] = v.target.value } }
                allowClear={property.optional}
                />
            )
        }

        const renderIntInput = () => {
            return (
                <InputNumber
                key={inputReset} defaultValue={values[property.name]}
                style={{width: '100%'}}
                onChange={(v) => { values[property.name] = v }}
                placeholder={property.optional ? "null" : undefined}
                />
            )
        }

        return (
            <Layout>
                <Layout.Header style={{ paddingLeft: 0, paddingRight: 0}}>
                    {property.name}
                    <span style={{ float: 'right'}}>
                    <Tag color='default'>{property.type}</Tag>
                    {!property.optional ? <Tag color='blue'>required</Tag> : null}
                    {isPrimary ? <Tag color='blue'>primary key</Tag> : null}
                    </span>
                </Layout.Header>
                <Layout.Content>
                {property.type === 'int' ? renderIntInput() : renderInput()}
                </Layout.Content>
            </Layout>
        )
    }

    return (
        <Layout.Content>
        <Radio.Button type="primary" onClick={showModal} style={{ float: 'right' }}>
            Create {schema.name}
        </Radio.Button>
        <Modal
            title={'Create '+schema.name}
            visible={visible}
            onOk={addObject}
            onCancel={hideModal}
            okText="Create"
            cancelText="Cancel"
        >
            {forEachProp(schema.properties, property => <div key={property.name}>{renderProperty(property, property.name === schema.primaryKey)}</div>)}
        </Modal>
        </Layout.Content>
    );
}