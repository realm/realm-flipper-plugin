import {TestUtils} from 'flipper-plugin';
import React, { Component } from 'react';
import * as Plugin from '../index'
import {createRows, createColumnConfig} from '../pages/SchemaVisualizer'
// Read more: https://fbflipper.com/docs/tutorial/js-custom#testing-plugin-logic
// API: https://fbflipper.com/docs/tutorial/js-custom#testing-plugin-logic


test('Schemas are saved', () => {
    const {instance, sendEvent} = TestUtils.startPlugin(Plugin);
    expect(instance.state.get().schemas).toEqual([]);
  
    sendEvent('getSchemas', {schemas: mockSchemasResponse});
  
    expect(instance.state.get().schemas).toBe(mockSchemasResponse);
  })
  
  
  test('rows are created from the properties', async () => {
      const resultRows = createRows(mockSchemasResponse[0].properties, "_id")
      expect(resultRows).toStrictEqual(rows);
  });

    
  test('cols are created', async () => {
    const resultCols = createColumnConfig(mockRows)
    expect(resultCols).toMatchObject(cols);
});


const mockRows = ["name","type", "mapTo","indexed", "optional", "primaryKey"]

const cols = [
    {
        "key": "name",
        "title": "name"
    },
    {
        "key": "type",
        "title": "type"
    },
    {
        "key": "mapTo",
        "title": "mapTo"
    },
    {
        "key": "indexed",
        "title": "indexed"
    },
    {
        "key": "optional",
        "title": "optional"
    },
    {
        "key": "primaryKey",
        "title": "primaryKey"
    }
]

const mockSchemasResponse = [
    {
        "name": "Task",
        embedded: false,
        asymmetric: false,
        "properties": {
            "_id": {
                "name": "_id",
                "indexed": true,
                "optional": false,
                "type": "int",
                "mapTo": "_id"
            },
            "name": {
                "name": "name",
                "indexed": false,
                "optional": false,
                "type": "string",
                "mapTo": "name"
            },
            "status": {
                "name": "status",
                "indexed": false,
                "optional": true,
                "type": "string",
                "mapTo": "status"
            }
        },
        "primaryKey": "_id"
    }
]

const rows = [
    {
        "name": {
            "type": "string",
            "value": "_id"
        },
        "indexed": {
            "type": "boolean",
            "value": true
        },
        "optional": {
            "type": "boolean",
            "value": false
        },
        "type": {
            "type": "string",
            "value": "int"
        },
        "mapTo": {
            "type": "string",
            "value": "_id"
        },
        "primaryKey": {
            "type": "boolean",
            "value": true
        }
    },
    {
        "name": {
            "type": "string",
            "value": "name"
        },
        "indexed": {
            "type": "boolean",
            "value": false
        },
        "optional": {
            "type": "boolean",
            "value": false
        },
        "type": {
            "type": "string",
            "value": "string"
        },
        "mapTo": {
            "type": "string",
            "value": "name"
        },
        "primaryKey": {
            "type": "boolean",
            "value": false
        }
    },
    {
        "name": {
            "type": "string",
            "value": "status"
        },
        "indexed": {
            "type": "boolean",
            "value": false
        },
        "optional": {
            "type": "boolean",
            "value": true
        },
        "type": {
            "type": "string",
            "value": "string"
        },
        "mapTo": {
            "type": "string",
            "value": "status"
        },
        "primaryKey": {
            "type": "boolean",
            "value": false
        }
    }
]