import {useEventHandler, View} from "@nodegui/react-nodegui";
import React, {useEffect, useState} from "react";
import Draughts from 'draughts';
import {WidgetEventTypes} from "@nodegui/nodegui";
import net from 'net';

let client = net.createConnection(9000);

const Board = () => {
    const [draughts, setDraughts] = useState(Draughts());

    const [selected, setSelected] = useState(0);
    const [position, setPosition] = useState(draughts.position());

    const getMovesForTile = (tile) => {
        return draughts.moves().filter(x => x.from == tile).map(x => x.to).filter(x => x != tile)
    }

    client.on('error', function(error) {
        console.log(error)
    });

    client.on('data', function(data) {
        console.log('message was received', data)
        draughts.load(data)
    });

    useEffect( () => {
        draughts.load("W:W31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,9:B1")
        setPosition(draughts.position())
    }, [])

    const possibleMoves = getMovesForTile(selected)

    const handleTileClick = (number) => {
        if(possibleMoves?.find?.(x => x == number)){
            draughts.move({from: selected, to: number})
            setPosition(draughts.position())
        }
    }

    let tile_number_ = 0;
    const getChecker = (pos) =>
        checkers.get(pos)


    const functions = {getChecker, setSelected, selected, draughts, possibleMoves, position}
    return <View mouseTracking>
            {Array.from(new Array(10)).map((n_, rowNumber) =>
                <View style={`
              flex: 1;
              align-items: normal;
              flex-direction: row;
              `}
                >
                    {Array.from(new Array(10)).map((n, i) => {
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

const Tile = ({name, color, size=60, number, onClick, functions}) => {
    const {selected, draughts, setSelected, possibleMoves, position} = functions;

    const checker = draughts.get(number)
    const has_checker = ['b', 'w'].includes(checker.toLowerCase())
    const checker_color = checker.toLowerCase() == 'b' ? 'black' : checker.toLowerCase() == 'w' ? 'white' : '';
    const checker_opposite_color = checker.toLowerCase() == 'b' ? 'white' : 'black';
    const isKing = checker.toUpperCase() == checker;

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

    return <View on={tileHandler} style={` 
            background: ${color == 'white' ? 'antiquewhite' : 'brown'}; 
            height: ${size}px; 
            width: ${size}px;
            ${selected == number && number && checker != 0 ? 'border: 3px solid yellow;':''}
            ${possibleMoves?.find?.(x => number == x) ? 'border: 3px solid #27FF40;' : ''}
            `}>
        {
            has_checker &&
            <View style={`
            position: absolute; 
            background: ${checker_color};
            height: ${size * 0.7}px; 
            width: ${size * 0.7}px; 
            left: ${size * 0.15}px; 
            top: ${size * 0.15}px;
            border-radius: ${(size * 0.35) - 1};
            ${isKing ? `border: 4px solid ${checker_opposite_color};` : ''}
           `}
            />
        }

    </View>;
}


export default Board