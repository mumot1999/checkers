import {Text, View} from "@nodegui/react-nodegui";
import React from "react";

const Board = () => {
    return <View>
        {Array.from(new Array(8)).map((n, i) => {
            return <BoardRow startColor={ (i) % 2 ? 'black' : 'white'}/>
        })}
    </View>
}

// @ts-ignore
const BoardRow = ({startColor = 'white'}) =>
    <View style={`
              flex: 1;
              align-items: normal;
              flex-direction: row;
              `}
    >
        {Array.from(new Array(8)).map((n, i) => {
            return <Tile color={(startColor == 'white' ? i : i + 1) % 2 ? 'black' : 'white'}/>
        })}
    </View>

// @ts-ignore
const Tile = ({color, size=60}) =>
    <View style={` background: ${color == 'white' ? 'antiquewhite' : 'brown'}; height: ${size}px; width: ${size}px`}>
        <Text style={`
            position: absolute; 
            background: black;
            height: ${size*0.7}px; 
            width: ${size*0.7}px; 
            left: ${size*0.15}px; 
            top: ${size*0.15}px;
            border-radius: ${(size*0.35)-1};
           `}
        />
    </View>


export default Board