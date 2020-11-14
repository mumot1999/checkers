import {useEffect, useState} from "react";

export const useControlledComponent = (externalValue, onChangeState, onChangeExternalValue) => {
    const [state, setState] = useState(externalValue);

    useEffect( () => {
        if(state !== externalValue){
            setState(externalValue)
            onChangeExternalValue?.(externalValue)
        }
    }, [externalValue])

    useEffect( () => {
        if(state !== externalValue){
            onChangeState(state)
        }
    }, [state])

    return [state, setState];
}