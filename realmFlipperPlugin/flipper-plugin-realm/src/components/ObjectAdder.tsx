import { useState } from "react";
import { SchemaResponseObject } from "..";
import { Modal, Radio } from "antd";
import React from "react";


export default (props: {schema: SchemaResponseObject | undefined}) => {
    const schema = props.schema;
    if (!schema) {
        return <></>;
    }

    const [visible, setVisible] = useState(false);

    const showModal = () => {
        setVisible(true);
    };

    const hideModal = () => {
        setVisible(false);
    };


    const [obj, setObject] = useState({ });

    const addObject = () => {

        hideModal();
    }

    const renderProperty = () => {

    }
    console.log(schema)
    
    return (
        <>
        <Radio.Button type="primary" onClick={showModal} style={{ float: 'right' }}>
            Create {schema.name}
        </Radio.Button>
        <Modal
            title={'Create'+schema.name}
            visible={visible}
            onOk={addObject}
            onCancel={hideModal}
            okText="Create"
            cancelText="Cancel"
        >
            {Object.keys(schema.properties).map(property => { return <p key={property}>{property}</p>; })}
        </Modal>
        </>
    );
}