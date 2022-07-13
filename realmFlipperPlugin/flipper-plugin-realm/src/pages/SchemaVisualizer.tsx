import React from "react";
import {SchemaResponseObject} from '../index'

export default React.memo((props: {schemas: Array<SchemaResponseObject>}) => {
    const {schemas} = props;
    schemas.forEach(schema => console.log(schema)
    );
    




    return (
        <div>
        {schemas.map(schema => <div>{schema.name}</div>
        )}
    </div>
    )
})