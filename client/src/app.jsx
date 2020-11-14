import {Text, Window, hot, View, LineEdit, Button} from "@nodegui/react-nodegui";
import React, {useCallback, useRef, useState} from "react";
import { QIcon } from "@nodegui/nodegui";
import { StepOne } from "./components/stepone";
import { StepTwo } from "./components/steptwo";
import nodeguiIcon from "../assets/nodegui.jpg";
import css, {resolve} from 'styled-jsx/css'

// @ts-ignore
import Board from "./components/board";
import {AppProvider, useApp} from "./tcp";
const minSize = { width: 700, height: 700 };
const winIcon = new QIcon(nodeguiIcon);

export const App = () => {

    const {appState, ...app} = useApp();

    const [login, setLogin] = useState("");

    return (
        <Window
            windowIcon={winIcon}
            windowTitle="Hello 👋🏽"
            minSize={minSize}
            styleSheet={styleSheet}
        >
            <View style={containerStyle}>
                {appState.loggedIn ? (
                    <View style={`
                      flex: 1;
              align-items: normal;
              flex-direction: row;
              `}>
                        <View>
                            <Board
                                boardPosition={appState.activeRoomBoardPosition}
                                onChange={app.setActiveRoomBoardPosition}
                                onChangeTurn={app.setActiveRoomBoardTurn}
                                boardTurn={appState.activeRoomTurn}
                            />
                        </View>
                        <View>
                            <Text>
                                Pokoje:
                            </Text>
                            {appState.rooms.map(room => (
                                <Button
                                    text={room}
                                    style={appState.activeRoom === room ? `background-color: green; color: white` : ''}
                                    cursor={13}
                                    on={{clicked: () => app.selectRoom(room)}}
                                />
                            ))}
                        </View>
                    </View>
                ) : (
                    <View>
                        <Text style={`padding-bottom: 10px;`}>{`
                                <div style="font-weight: bold; font-size: 50px; ">
                                    <center style="align-content: center">Zaloguj się</center>
                                </div>
                            `}</Text>

                        <Text style={`font-weight: bold`}>
                            Nazwa użytkownika:
                        </Text>
                        <LineEdit on={{textChanged: setLogin}} text={login}/>

                        <Button text={"Zaloguj się"} style={`margin-top: 10px;`} on={{clicked: () => app.login(login)}}/>
                    </View>
                )}
            </View>
        </Window>
    );
}



const containerStyle = `
  flex: 1; 
  background: white;
`;


const styleSheet = `
  #welcome-text {
    font-size: 24px;
    padding-top: 20px;
    qproperty-alignment: 'AlignHCenter';
    font-family: 'sans-serif';
  }

  #step-1, #step-2 {
    font-size: 18px;
    padding-top: 10px;
    padding-horizontal: 20px;
  }
`;

export default hot(App);
