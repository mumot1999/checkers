import React, {createContext, useContext, useEffect, useState} from "react";
import net from "net";
import parser from 'yargs-parser'

const args = parser(process.argv);

export const client = net.createConnection({
    port: args.port ?? 9000,
    host: args.host ?? 'localhost'
});


const initialFen = 'W:W31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50:B1-20';

const initialState = {
    loggedIn: false,
    connected: false,
    login: "",
    host: 'localhost',
    port: 9000,
    checkerColor: '',
    rooms: ["Solo"],
    activeRoom: "Solo",
    activeRoomBoardPosition: initialFen,
    activeRoomTurn: "w",
    whitePlayer: "",
    blackPlayer: "",
    selectedColor: "",
}

export const AppContext = createContext({appState: initialState, setAppState: undefined});

export const AppProvider = ({children}) => {

    const [appState, setAppState] = useState(initialState);

    useEffect( () => request('selectRoom', appState.activeRoom), [appState.activeRoom]);
    useEffect( () => request('selectColor', appState.selectedColor), [appState.selectedColor]);

    useEffect( () => {

        if(client.readable){
            setAppState(prev => ({...prev, connected: true}))
            request('getRooms');
        }
        else{
            setAppState(prev => ({...prev, connected: false, rooms: ["Solo"]}))
        }
    }, [client.readable, client.connecting, client.writable])

    useEffect( () => {
        client.on('error', (error) => {
            console.log({error})
            setAppState(prev => ({...prev, connected: false}))
        })
    }, [])
    // useEffect( () => {
    //     client.on('ready', () => setAppState(prev => ({...prev, connected: true})))
    // }, [])

    useEffect( () => {
        client.removeAllListeners('data');
        client.on('data', function(raw_data) {
            const [action, data] = raw_data.filter(x => (x <= 122 && x >= 32) || x === 10).toString().split("\n", 2);

            const handleActions = {
                rooms: () => {
                    setAppState(prevState => ({...prevState, rooms: ["Solo", ...data?.split(',')]}))
                },
                fen: () => {
                    if(appState.activeRoom !== 'Solo')
                        setAppState(prevState => ({...prevState, activeRoomBoardPosition: data, activeRoomTurn: data[0]?.toLowerCase() ?? 'w'}))
                },
                whitePlayer: () => {
                    if(appState.activeRoom !== 'Solo')
                        setAppState(prevState => ({...prevState, whitePlayer: data}))
                },
                blackPlayer: () => {
                    if(appState.activeRoom !== 'Solo')
                        setAppState(prevState => ({...prevState, blackPlayer: data}))
                }
            }

            handleActions?.[action]?.();
            console.log('message was received', {action, data})
        });
        return () => client.removeAllListeners('data');
    }, [appState])

    return <AppContext.Provider value={{appState, setAppState}}>
        {children}
    </AppContext.Provider>
}

function request(action, data='') {
    client.write(action + '\n' + data + '\0')
}

export const useApp = () => {
    const {appState, setAppState} = useContext(AppContext);

    const setActiveRoomBoardPosition = (pos, turn='w') => {
        console.log("CHANGE POSITION BACKGROUND", pos)
        setAppState(prev => ({...prev, activeRoomBoardPosition: pos, activeRoomTurn: turn ?? 'w'}))
        request('fen', pos)
    }

    const setActiveRoomBoardTurn = (turn) =>
        setAppState(prev => ({...prev, activeRoomTurn: turn}))

    return {
        setLogin: (login) => setAppState(prev => ({...prev, login})),
        setColor: (checkerColor) => setAppState(prev => ({...prev, checkerColor})),
        login: (login) => {
            request("login", login);
            client.write("getRooms");
            console.log({login})
            setAppState(prev => ({...prev, login, loggedIn: true}))
        },
        selectRoom: (room) => {
            if(room === "Solo"){
                setAppState(prev => ({...prev, activeRoom: room}))
                setActiveRoomBoardPosition(initialFen, "W")
            }else{
                setAppState(prev => ({...prev, activeRoom: room, selectedColor: ""}))
            }
        },
        selectColor: (color) => {
            if(appState.activeRoom !== "Solo"){
                setAppState(prev => ({...prev, selectedColor: color}))
            }
        },
        setActiveRoomBoardPosition,
        setActiveRoomBoardTurn,
        connectToServer: (host='localhost', port=9000) => {
            setAppState(prev => ({...prev, host, port, connected: false}))
            client.connect({host, port})
        },
        appState
    }
}