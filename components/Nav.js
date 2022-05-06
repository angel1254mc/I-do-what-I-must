import React from 'react'
import Link from 'next/link';
import {useRouter} from 'next/router';
const Nav = ({Component, pageProps}) => {
  return (
    <nav className="w-full z-50 sticky flex items-center justify-between flex-wrap bg-transparent p-2">
        <div className="flex items-center flex-shrink-0 text-white mr-6">
            <span className="font-semibold text-2xl tracking-tight"><Link href ="/"><a>Voxel Jump</a></Link></span>
        </div>
        <div className="  flex-grow flex justify-center sm:justify-end items-center text-right w-auto">
            <Link href="/">
                <a className = "block mt-4 lg:inline-block sm:mt-0 text-white  mr-4">Home</a>
            </Link>
            <Link href="/about">
                <a className="block mt-4 lg:inline-block sm:mt-0 text-white  mr-4">
                  About
                </a>
            </Link>
            <Link href="/leaderboards">
                <a href="mailto:angellopezpol1254@gmail.com" className="block mt-4 lg:inline-block sm:mt-0 text-white  mr-4">
                    Leaderboards
                </a>
            </Link>
            <Link href="/Contribute">
                <a className="block mt-4 lg:inline-block sm:mt-0 text-white mr-4">
                  Contribute
                </a>
            </Link>
        </div>  
    </nav>
  )
}
export default Nav;