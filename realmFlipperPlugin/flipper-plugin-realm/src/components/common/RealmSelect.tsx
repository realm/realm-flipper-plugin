import { Select } from "antd";
import { usePlugin, useValue } from "flipper-plugin";
import React, { useCallback } from "react";
import { plugin } from "../..";
import { BoldSpan } from "../SchemaSelect";

type InputType = {
  realms: string[];
};

export const RealmSelect = ({ realms }: InputType) => {
    const instance = usePlugin(plugin);
    const state = useValue(instance.state);

    const realmName = (realmPath: string, serial: string) => {
      const firstIndexOfSerial = realmPath.indexOf(serial);
      return realmPath.substring(firstIndexOfSerial+serial.length);
    }

    const onRealmSelected = useCallback(
        (selected: string) => {
          instance.getSchemas(selected);
          instance.setSelectedRealm(selected);
        },
        [instance]
      );
      const realmOptions = realms.map((realm) => (
        <Select.Option key={realm} value={realm}>
          {realmName(realm, state.deviceSerial)}
        </Select.Option>
      ));
        return (
            <div>
            <BoldSpan>Realm </BoldSpan>
            <Select
              showSearch
              value={state.selectedRealm}
              onChange={onRealmSelected}

              style={{ maxWidth: '400px' }}
              dropdownMatchSelectWidth={false}
            >
              {realmOptions}
            </Select>
            </div>
        )
};
