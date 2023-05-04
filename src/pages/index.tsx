import Image from 'next/image'
import Head from 'next/head'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export default function Home() {
  // Returns the home page of PlotNotes with a welcome message and displaying the logo above it
  // Adds a button that sends the user to the PromptPage to start writing
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <Head>
        <title>PlotNotes</title>
        <link rel="icon" href="/images/PlotNotes.png" />
        <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
      </Head>
      <Image
        src="/images/PlotNotes.png"
        alt="PlotNotes Logo"
        width={200}
        height={200}
      />
      <main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
        <h1 className="font-inter text-6xl font-bold">
          Welcome to PlotNotes!
        </h1>
        <p className="font-inter text-2xl mt-3">
          A place to write your stories and share them with the world
        </p>
        <button className="mt-8 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          <a href="/prompt">Start Writing</a>
        </button>
      </main>
    </div>
  )
}
