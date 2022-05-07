import Head from 'next/head';
import Image from 'next/image';
import React from 'react';
import styles from '../styles/Home.module.css';
import Script from 'next/script';
import Canvas from '../components/Canvas';
import Nav from '../components/Nav';
import BackgroundCanvas from '../components/BackgroundCanvas';
export default function Home() {
  const [startGame, setStartGame] = React.useState(false);
  const [lostGame, setLostGame] = React.useState(false);
  const [wonGame, setWonGame] = React.useState(false)
  const [retry, setRetry] = React.useState(false);
  const [user, setUser] = React.useState("Anonymous");
  const [gameType, setGameType] = React.useState("Race");
  const [gameScore, setGameScore] = React.useState(0);
  React.useEffect(() => {
    if (retry)
    {
      setStartGame(true);
    }
  }, [startGame, retry, lostGame, wonGame, gameType])
  return (
    <div className="m-o">
      <Head>
        <title>Voxel Jump</title>
        <meta name="description" content="Game by ALP" />
      </Head>
      <main className="flexicution flex-col">
        <Nav></Nav>
        <div className = "w-[600px] h-[800px] relative">
        {startGame ? <div></div> : <div className = "absolute w-full h-full flex flex-col items-center">
            <div className = "relative leader-lg text-6xl mt-[100px] text-white font-extrabold">Voxel Jump</div>
            <div className = "flex relative leader2-lg text-xl mt-[120px] w-1/2 h-[60px] items-center text-white rounded-3xl ">
              <button className="h-full w-[250px] bg-main-button border-2 border-white rounded-xl" onClick={() => {setGameType("Race")}}>Race</button>
              <button className="h-full w-[250px] ml-10 bg-main-button border-2 border-white rounded-xl" onClick={() => {setGameType("Infinite")}} >Infinite</button>
            </div>
            <div className = "flex justify-center relative leader2-lg text-3xl mt-[30px] w-1/2 h-[80px] items-center text-white border-2 border-white rounded-3xl bg-main-button "><button className="h-full w-full" onClick={() => {setStartGame(true)}}>Singleplayer</button></div>
            <div className = "flex justify-center relative leader2-lg text-3xl mt-[30px] w-1/2 h-[80px] items-center text-white border-2 border-white rounded-3xl bg-main-button ">Multiplayer</div>
            <div className = "flex justify-start relative leader2-lg text-2xl mt-[30px] w-2/3 h-[80px] items-end pb-1 text-white border-b-4 border-black ">Signed in as: {user}</div>
          </div>}
        {lostGame && startGame ?
        <div className = "absolute w-full h-full flex flex-col items-center">
          <div className = "relative leader-lg text-6xl mt-[100px] text-white font-extrabold">You Lost!</div>
          <div className = "flex justify-center relative leader2-lg text-3xl mt-[150px] w-1/2 h-[80px] items-center text-white border-2 border-white rounded-3xl bg-main-button "><button className="h-full w-full" onClick={() => {setRetry(true); setLostGame(false); setStartGame(false)}}>Try Again?</button></div>
          <div className = "flex justify-center relative leader2-lg text-3xl mt-[150px] w-1/2 h-[80px] items-center text-white border-2 border-white rounded-3xl bg-main-button "><button className="h-full w-full" onClick={() => {setStartGame(false); setRetry(false); setLostGame(false)}}>Back to Menu</button></div>
        </div>  : 
        <div></div>}
        {startGame && wonGame ?
        <div className = "absolute w-full h-full flex flex-col items-center m-1 stars-bg">
          <div className = "relative leader-lg text-6xl mt-[100px] text-white font-extrabold bg-main-leader-win">You Won!</div>
          <div className = "flex justify-center relative leader2-lg text-3xl mt-[150px] w-1/2 h-[80px] items-center text-white border-2 border-white rounded-3xl bg-main-button-win "><button className="h-full w-full" onClick={() => {setRetry(true); setWonGame(false); setStartGame(false)}}>Try Again?</button></div>
          <div className = "flex justify-center relative leader2-lg text-3xl mt-[150px] w-1/2 h-[80px] items-center text-white border-2 border-white rounded-3xl bg-main-button-win "><button className="h-full w-full" onClick={() => {setStartGame(false); setRetry(false); setWonGame(false)}}>Back to Menu</button></div>
        </div>  : <div></div>}
        {startGame ? <div className = "absolute flex p-4 text-center justify-center items-center width-[50px] text-3xl h-[50px] text-white">{gameScore}</div> : 'no'}
        {startGame ? <Canvas gameOn = {startGame} gameOnHandler = {setStartGame} lostGame ={lostGame} setLostGame = {setLostGame} gameType = {gameType} wonGame = {wonGame} setWonGame = {setWonGame} gameScore = {gameScore} setGameScore = {setGameScore}></Canvas> 
        : <BackgroundCanvas startGame = {startGame} restartGame={retry} ></BackgroundCanvas>}
        <Image id="rocket" className ="absolute" width="0px" height="0px" src="/static/rocket.png" priority></Image>
        <Image id="spring" className ="absolute" width="0px" height="0px" src="/static/spring.png" priority></Image>
        </div>
      </main>
    </div>
  )
}
