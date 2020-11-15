import {Button, LineEdit, Text, View} from "@nodegui/react-nodegui";
import React, {useState} from "react";
import {useApp} from "../tcp";

export const ChangeServer = () => {
    const {appState, connectToServer} = useApp();

    const [host, setHost] = useState(appState.host);
    const [port, setPort] = useState(`${appState.port}`);

    return (
        <View>
            <Text style={`font-weight: bold`}>
                IP:
            </Text>
            <LineEdit on={{textChanged: setHost}} text={host}/>
            <Text style={`font-weight: bold`}>
                PORT:
            </Text>
            <LineEdit on={{textChanged: setPort}} text={port}/>
            <Button text={"Połącz"} style={`margin-top: 10px;`} on={{clicked: () => connectToServer(host, port)}}/>
        </View>
    )
}