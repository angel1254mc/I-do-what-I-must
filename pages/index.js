import Head from 'next/head';
import Image from 'next/image';
import React from 'react';
import styles from '../styles/Home.module.css';
import Script from 'next/script';
import Canvas from '../components/Canvas';
import Nav from '../components/Nav';
import Login from '../components/Login';
import {collection, doc, setDoc} from 'firebase/firestore';
import BackgroundCanvas from '../components/BackgroundCanvas';
import MultiplayerCanvas from '../components/MultiplayerCanvas';
import {firebaseApp, db} from "../firebaseConfig";
import {useAuthState , useSignInWithGithub} from 'react-firebase-hooks/auth';
import {useCollection} from "react-firebase-hooks/firestore";
import {getAuth} from 'firebase/auth';
import MainUI from '../components/MainUI';
const auth = getAuth(firebaseApp);

export default function Home() {
  const [signInWithGithub, user, loading, error] = useSignInWithGithub(auth);

  const addImageDocument = async (img_url, userName) => {
    await setDoc(doc(collection(db, "images"), userName), {
      imgurl: img_url,
    })
  }
  return (
    <div className="m-o">
      <Head>
        <title>Voxel Jump</title>
        <meta name="description" content="Game by ALP" />
      </Head>
      <MainUI signInWithGithub={signInWithGithub} user={user} loading={loading} error={error} dbSaveImage={addImageDocument}></MainUI>
    </div>
  )
}
