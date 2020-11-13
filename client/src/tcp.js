import React, {createContext, useContext, useState} from "react";
import net from "net";

export const client = net.createConnection(9000);

client.on('error', console.log)

const initialState = {
    loggedIn: false,
    login: "",
    host: 'localhost',
    port: 9000,
    checkerColor: '',
}

export const AppContext = createContext({appState: initialState, setAppState: undefined});

export const AppProvider = ({children}) => {

    const [appState, setAppState] = useState(initialState);

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
            console.log({login})
            setAppState(prev => ({...prev, login, loggedIn: true}))
        },
        appState
    }
}