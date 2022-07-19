import { useState } from "react";
import { SchemaPropertyValue, SchemaResponseObject } from "..";
import { Modal, Radio, InputNumber, Input, Layout } from "antd";
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
    console.log('inside')
    const [visible, setVisible] = useState(false);

    const showModal = () => {
        setVisible(true);
    };

    const hideModal = () => {
        values = {};
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
    const renderProperty = (property: SchemaPropertyValue) => {
        // setObject(obj => {
        //     obj[property.name] = getDefault(property.type)
        // })
        values[property.name] = getDefault(property.type)

        const renderInput = () => {
            return <Input onChange={(v) => { values[property.name] = v.target.value } }/>
        }

        const renderIntInput = () => {
            return <InputNumber defaultValue={0} style={{width: '100%'}} onChange={(v) => { values[property.name] = v }}/>
        }

        return (
            <Layout>
                <Layout.Header >{property.name} <div style={{ float: 'right'}}>.</div></Layout.Header>
            <Layout.Content>

            {property.type === 'int' ? renderIntInput() : renderInput()}
            </Layout.Content>
            </Layout>
        )
    }

    console.log(schema)
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
            {forEachProp(schema.properties, property => <div key={property.name}>{renderProperty(property)}</div>)}
        </Modal>
        </Layout.Content>
    );
}