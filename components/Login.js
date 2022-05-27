import React from 'react'
import { useEffect } from 'react';

//Login component goes at the bottom of the page, handles the authentication process for the user.
//Also, ironically, should handle logout;

const Login = ({user, loading, error, signInWithGithub, dbSaveImage}) => {
    const login = () => {
        signInWithGithub();
    }
    const logout = () => {
    
    }
    useEffect(() => {
        console.log("Refreshed login component because of auth change")
        if (user)
        console.log("User Object: ", user, " and User UID: ", user.uid);
    }, [user, loading, error])

      if (user) {
        dbSaveImage(user.user.photoURL, user.user.reloadUserInfo.screenName)
        console.log(user);
        return (
          
          <div className = "flex flex-col justify-content">
            <div className = "flex justify-start relative leader2-lg text-2xl mt-[30px] w-2/3 h-[80px] items-end pb-1 text-white border-b-4 border-black ">Hello {user ? user.user.reloadUserInfo.screenName : "Anonymous"}!</div>
          </div>
          //<div></div>
        );
      }
    return (
    <div className = "flex flex-col justify-content">
        <div className = "flex justify-start relative leader2-lg text-2xl mt-[30px] w-full h-[80px] items-end pb-1 text-white border-b-4 border-black ">Signed in as Anonymous!</div>
            <button className=" px-10 py-1 text-xl text-white bg-main-button border-2 border-white rounded-xl" onClick={login}>Login with Github</button>
    </div>

  );
}
export default Login;