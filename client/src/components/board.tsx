import {Text, View} from "@nodegui/react-nodegui";
import React, {useContext} from "react";

const CheckersContext = React.createContext({});

const Board = () => {
    const checkers = {
        a1: 'w',
        a3: 'w',
        c1: 'w',
        c3: 'w',
        e1: 'w',
        e3: 'w',
        g1: 'w',
        g3: 'w',
        b2: 'w',
        d2: 'w',
        f2: 'w',
        h2: 'w',
        a7: 'b',
        c7: 'b',
        e7: 'b',
        g7: 'b',
        b8: 'b',
        d8: 'b',
        f8: 'b',
        h8: 'b',
        b6: 'b',
        d6: 'b',
        f6: 'b',
        h6: 'b',
    }

    const getChecker = (pos: string) =>
        // @ts-ignore
        checkers[pos]

    return <CheckersContext.Provider value={getChecker}>
        <View>
            {Array.from(new Array(8)).map((n, i) => {
                return <BoardRow startColor={ (i) % 2 ? 'black' : 'white'} rowNumber={8-i}/>
            })}
        </View>
    </CheckersContext.Provider>
}

// @ts-ignore
const BoardRow = ({rowNumber, startColor = 'white'}) =>
    <View style={`
              flex: 1;
              align-items: normal;
              flex-direction: row;
              `}
    >
        <Text>{rowNumber}</Text>
        {['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map((n, i) => {
            return <Tile name={`${n}${rowNumber}`} color={(startColor == 'white' ? i : i + 1) % 2 ? 'black' : 'white'}/>
        })}
    </View>

// @ts-ignore
const Tile = ({name, color, size=60}) => {
    const getChecker = useContext(CheckersContext);

    // @ts-ignore
    const checker = getChecker(name);

    return <View
        style={` background: ${color == 'white' ? 'antiquewhite' : 'brown'}; height: ${size}px; width: ${size}px`}>
        {checker ? (
            <Text style={`
            position: absolute; 
            background: ${checker == 'b' ? 'black' : 'white'};
            height: ${size * 0.7}px; 
            width: ${size * 0.7}px; 
            left: ${size * 0.15}px; 
            top: ${size * 0.15}px;
            border-radius: ${(size * 0.35) - 1};
           `}
            />
        ): ''}
    </View>;
}


export default Board