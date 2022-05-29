import React from 'react';
import {useEffect} from 'react';
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
const PlayerResults = ({playerid, playerdata, place, accountIDToImage}) => {
    return (
        <li className = "w-full h-[30px] flex justify-around">
            <div className ="text-lg text-white">{place}</div>
            <div className ="text-lg text-white">{playerid}</div>
            <div className ="text-lg text-white"><Image layout="responsive" src={accountIDToImage[playerid]}></Image></div>
        </li>
    )
}
const Results = ({finalResults, accountIDToImage}) => {
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

    useEffect(() => {
        
        let result_rows = document.getElementsByClassName("results-row");
        let amount = result_rows.length;
        let interval;
        let index = 0;
        let addFadeIn = (amount, intervalID) => {
            if (index == amount)
                clearInterval(intervalID);
            else
            {
                result_rows[index].classList.add("fade-in-row");
                index++
            }

        }
        interval = setInterval(addFadeIn, 500, amount, interval)
    }, []);

  return (
    <div className = "absolute fadeResults m-1 h-full w-full overflow-x-hidden overflow-y-auto bg-black">
        <div className = "results-container-inner  mt-[160px] mx-[15px] ">
            <h1 className = "text-4xl text-white text-center w-full"> Winners: </h1>
            <table id = "results-table" className = "fadeTable table-auto w-full text-center text-white mt-5">
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
                                <tr className= "results-row" key= {index}>
                                    <td className = "py-10 text-2xlw" scope = "row">{index+1}</td>
                                    <td className= "py-5 text-xl text-amber-500">{winner.length > 12 ? winner.substring(0,11) + "..." : winner}</td>
                                    <td className = ""><img width = "90vh" height= "90vh" src={accountIDToImage[winner] ? accountIDToImage[winner] : "https://i.imgur.com/90ZdeHQ.jpg"}></img></td>
                                </tr>
                            )
                        }) 
                        : ""
                    }
                    {losers && losers.length > 0 ? 
                        losers.map((loser, index) => {
                            return (
                                <tr className= "results-row" key= {index}>
                                    <td className = "py-10 text-xl" scope = "row">{"DNF"}</td>
                                    <td className= "py-5 text-xl text-amber-500">{loser.length > 12 ? loser.substring(0,11) + "..." : loser}</td>
                                    <td align="center"><img width = "80vh" height= "80vh" src={accountIDToImage[loser] ? accountIDToImage[loser] : "https://i.imgur.com/90ZdeHQ.jpg"}></img></td>
                                </tr>
                            )
                        }) 
                        : ""
                    }
                </tbody>
            </table>
        </div>
    </div>
  )
}

export default Results
