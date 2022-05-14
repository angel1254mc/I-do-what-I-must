import React from 'react';
import Image from 'next/image';
const fakeData = {
    "firstplace" : {
        place: 1,
        outcome: "won",
    },
    "secondplace" : {
        place: 2,
        outcome: "won",
    },
    "fifthplace" : {
        place: 5,
        outcome: "won",
        
    },
    "3rdplace" : {
        place: 3,
        outcome: "won",
    },
    "4rthplace" : {
        place: 4,
        outcome: "won",
    },
    "ThisGuyDidNotFinish" : {
        outcome: "lost",
    }

}
const PlayerResults = ({playerid, playerdata, place}) => {
    return (
        <li className = "w-full h-[30px] flex justify-around">
            <div className ="text-lg text-white">{place}</div>
            <div className ="text-lg text-white">{playerid}</div>
            <div className ="text-lg text-white">Image Here</div>
        </li>
    )
}
const Results = ({finalResults}) => {
    let winners;
    let losers = [];
    let sortCorrectOrder = (initial) => {
        winners = new Array(Object.keys(initial).length);
        //The first is an object with keys, so to loop over it ill use its keys
        //The second is a Map, where the place is the key and the id is what it maps to
        for (let id in initial)
        {
            let placeOfCurrentID = initial[id].outcome == "won" ? initial[id].place : "DNF"
            if (placeOfCurrentID == "DNF")
                losers.push(initial[id].name);
            else
                winners[placeOfCurrentID-1] = initial[id].name;
        }
        console.log(winners);
    }



  return (
    <div className = "absolute fadeResults m-1 h-full w-full overflow-x-hidden overflow-y-auto bg-slate-700">
        <div className = "results-container-inner  mt-[160px] mx-[15px] ">
            <h1 className = "text-4xl text-white text-center w-full"> Winners: </h1>
            <table className = " table-auto w-full text-center text-white mt-5">
                <thead>
                    <tr>
                        <th className = "text-2xl">Place</th>
                        <th className = "text-2xl">Name</th>
                        <th className = "text-2xl">Icon</th>
                    </tr>
                </thead>
                <tbody>
                    {
                        sortCorrectOrder(finalResults)
                    }
                    {winners && winners.length > 0 ? 
                        winners.map((winner, index) => {
                            return (
                                <tr key= {index}>
                                    <td className = "pt-10" scope = "row">{index+1}</td>
                                    <td className= "pt-10 text-amber-500">{winner}</td>
                                    <td className = "pt-10">"Image Here"</td>
                                </tr>
                            )
                        }) 
                        : <div className="text-4xl">Results Render Failed</div>
                    }
                </tbody>
            </table>
            <h1 className = "text-3xl text-white text-center w-full mt-10"> Did Not Finish: </h1>
            <table className = " table-auto w-full text-center text-white mt-5">
                <tbody>
                    {losers && losers.length > 0 ? 
                        losers.map((loser, index) => {
                            return (
                                <tr key= {index}>
                                    <td className = "pt-10" scope = "row">{index+1}</td>
                                    <td className= "pt-10 text-amber-500">{loser}</td>
                                    <td className = "pt-10">"Image Here"</td>
                                </tr>
                            )
                        }) 
                        : <div className="text-4xl">Results Render Failed</div>
                    }
                </tbody>
            </table>
        </div>
    </div>
  )
}

export default Results
