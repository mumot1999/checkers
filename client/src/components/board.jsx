import {Image, Text, useEventHandler, View} from "@nodegui/react-nodegui";
import React, {useCallback, useContext, useEffect, useMemo, useState} from "react";
import Draughts from 'draughts';
import {QListViewSignals, QMouseEvent, WidgetEventTypes, QPushButton} from "@nodegui/nodegui";
import crown from "../../assets/crown.png"
const CheckersContext = React.createContext({});

const Board = () => {
    const [draughts, setDraughts] = useState(Draughts());

    const [selected, setSelected] = useState(0);
    const [position, setPosition] = useState(draughts.position());

    const getMovesForTile = (tile) => {
        return draughts.moves().filter(x => x.from == tile).map(x => x.to).filter(x => x != tile)
    }

    useEffect( () => {
        draughts.load("W:W31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,9:B1")        // draughts.move({from: 33, to: 28})
        // draughts.move({from: 20, to: 24})
        setPosition(draughts.position())
        // setDraughts(draughts)
    }, [])

    const possibleMoves = getMovesForTile(selected)

    console.log("POSITION", position)
    console.log("Possible moves", draughts.moves())
    const handleTileClick = (number) => {
        console.log(`CLICKED ${number}, selected ${selected}`)
        console.log(`ACTUAL POSITION`, position)
        if(possibleMoves?.find?.(x => x == number)){
            // const res = draughts.move(draughts.getLegalMoves(35)[0])
            draughts.move({from: selected, to: number})
            setPosition(draughts.position())
            console.log(`MOVED ${selected} to ${number}`)

            // console.log(`SKOULD MOVE ${selected} to ${number}`)
            // draughts.move(`${selected}-${number+1}`)
        }
    }

    console.log(possibleMoves)

    const [checkers, setCheckers] = useState({
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
    )
    let tile_number_ = 0;
    const getChecker = (pos) =>
        // @ts-ignore
        checkers.get(pos)

    const moveChecker = (oldPos, newPos) => {
        // @ts-ignore
        setCheckers(p => ({...p, [oldPos]: undefined, b4: 'w'}))
    }

    const functions = {getChecker, moveChecker, setSelected, selected, draughts, possibleMoves, position}
    return <View mouseTracking>
            {Array.from(new Array(10)).map((n_, rowNumber) =>
                <View style={`
              flex: 1;
              align-items: normal;
              flex-direction: row;
              `}
                >
                    <Text>{9 - rowNumber}</Text>

                    {['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'].map((n, i) => {
                        const color = (rowNumber % 2 ? i : i + 1) % 2 ? 'white' : 'black';
                        if(color == 'black')
                            tile_number_++;
                        return <Tile
                            functions={functions}
                            onClick={handleTileClick}
                            name={`${n}${rowNumber}`}
                            number={color == 'black' ? tile_number_ : 0}
                            color={color}
                        />
                    })}
                </View>)}
        </View>
}

// @ts-ignore
const BoardRow = ({rowNumber, startColor = 'white'}) =>
    <View style={`
              flex: 1;
              align-items: normal;
              flex-direction: row;
              `}
    >
        <Text>{8 - rowNumber}</Text>
        {['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map((n, i) => {
            return <Tile name={`${n}${rowNumber}`} number={rowNumber*10 + i} color={(startColor == 'white' ? i : i + 1) % 2 ? 'black' : 'white'}/>
        })}
    </View>

// @ts-ignore
const Tile = ({name, color, size=60, number, onClick, functions}) => {
    const {getChecker, moveChecker, selected, draughts, setSelected, possibleMoves, position} = functions;
    // const checker = useMemo( () => draughts.get(number), [position]);
    const checker = draughts.get(number)
    const has_checker = ['b', 'w'].includes(checker.toLowerCase())
    const tileHandler = useEventHandler(
        {
            [WidgetEventTypes.MouseButtonPress]: () => {
                console.log("CLICKED", {number, selected, possibleMoves})
                onClick?.(number);
                if(number && checker != 0){
                    console.log("SELECTING", number)
                    setSelected(number)
                }
                console.log("mousePressed at: ", name, number, checker);
            }
        },
        [selected, possibleMoves, position]
    );


    // @ts-ignore

    return <View on={tileHandler}
        style=
            {` background: ${color == 'white' ? 'antiquewhite' : 'brown'}; 
            height: ${size}px; 
            width: ${size}px;
            ${selected == number && number && checker != 0 ? 'border: 3px solid yellow;':''}
            ${possibleMoves?.find?.(x => number == x) ? 'border: 3px solid red;' : ''}
            `}>
        {
            has_checker &&
            <View style={`
            position: absolute; 
            background: ${checker.toLowerCase() == 'b' ? 'black' : checker.toLowerCase() == 'w' ? 'white' : ''};
            height: ${size * 0.7}px; 
            width: ${size * 0.7}px; 
            left: ${size * 0.15}px; 
            top: ${size * 0.15}px;
            border-radius: ${(size * 0.35) - 1};
            ${checker.toUpperCase() == checker ? `border: 4px solid ${checker.toLowerCase() == 'b' ? 'white' : 'black'};` : ''}
           `}
            />
        }

    </View>;
}


export default Board