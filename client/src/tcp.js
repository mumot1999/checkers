import React, {createContext, useContext, useEffect, useState} from "react";
import net from "net";

export const client = net.createConnection(9000);

client.on('error', console.log)

const initialState = {
    loggedIn: false,
    login: "",
    host: 'localhost',
    port: 9000,
    checkerColor: '',
    rooms: []
}

export const AppContext = createContext({appState: initialState, setAppState: undefined});

export const AppProvider = ({children}) => {

    const [appState, setAppState] = useState(initialState);

    useEffect( () => {
        client.on('data', function(raw_data) {
            const [action, data] = raw_data.toString().split("\n", 2);

            if(action === 'rooms'){
                setAppState(prevState => ({...prevState, rooms: data?.split(',') ?? []}))
            }
            console.log('message was received', {action, data})
        });
    }, [])

    return <AppContext.Provider value={{appState, setAppState}}>
        {children}
    </AppContext.Provider>
}

export const useApp = () => {
    const {appState, setAppState} = useContext(AppContext);

    return {
        setLogin: (login) => setAppState(prev => ({...prev, login})),
        setColor: (checkerColor) => setAppState(prev => ({...prev, checkerColor})),
        login: (login) => {
            client.write("getRooms");
            console.log({login})
            setAppState(prev => ({...prev, login, loggedIn: true}))
        },
        appState
    }
}