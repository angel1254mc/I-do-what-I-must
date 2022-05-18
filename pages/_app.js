import '../styles/globals.css'
import React from 'react';
function MyApp({ Component, pageProps }) {

  React.useEffect(() => {
    console.log("BOOTY OH OHHHHSSSS");
  })
  return <Component {...pageProps} />
}

export default MyApp
