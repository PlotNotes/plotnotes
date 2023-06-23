import Image from 'next/image'
import Head from 'next/head'
import Router, { useRouter } from 'next/router'
import { IconButton } from '@primer/react'
import { MarkGithubIcon } from '@primer/octicons-react'
import axios from 'axios'

export default function Home() {

  const router = useRouter()
  const loggedIn = router.query.loggedIn

  const loginButton = () => {
    // If loggedIn is null or false, then display the login button
    if (loggedIn == null || loggedIn == "false") {
      return(
        <button 
        className="absolute top-0 right-0 mt-4 mr-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        onClick={() => Router.push('/signin')}>
        Login
      </button>
      );
    } else {
      // If loggedIn is true, then display the logout button
      return(
        <button 
        className="absolute top-0 right-0 mt-4 mr-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        onClick={async () => {
          await fetch('/api/sessionCmds', {
              method: 'DELETE',
              headers: {
                  'Content-Type': 'application/json'
              }
          });
          Router.push('/');
      }}>
        Logout
      </button>
      );
    }
  }
  QueueList();
  // Returns the home page of PlotNotes with a welcome message and displaying the logo above it
  // Adds a login button that redirects to the login page, located on the top right of the page
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <Head>
        <title>PlotNotes - Home</title>
      </Head>
      {loginButton()}
      <Image
        src="/images/PlotNotesLogo.png"
        alt="PlotNotes Logo"
        width={600}
        height={600}
      />
      <main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
        <h1 className="font-inter text-6xl font-bold">
          Welcome to PlotNotes!
        </h1>
        <p className="font-inter text-2xl mt-3">
          A place to write your stories and share them with the world
        </p>
        <button 
          className="mt-8 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => Router.push('/prompt')}
        >
          Start Writing
        </button>
        {/* Link to github repo */}
        <IconButton
        aria-labelledby=''
        icon={MarkGithubIcon}
        onClick={() => window.open('https://github.com/PlotNotes/plotnotes')}
        sx={{ border: 'none', width: 60, height: 60 }}
        />
      </main>
    </div>
  )
}


export const QueueList = async () => {

  const baseURL = process.env.NODE_ENV === 'production' 
    ? 'https://plotnotes.ai' 
    : 'http://localhost:3000';

  const axiosInstance = axios.create({
    baseURL: baseURL,
    withCredentials: true
  });

  const response = await axiosInstance.get('api/jobs', {
    headers: {
      'Content-Type': 'application/json'
    }
  })

  const data = await response.data;
  console.log(data);
}