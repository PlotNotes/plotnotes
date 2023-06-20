import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { GoogleOAuthProvider } from '@react-oauth/google'
import React, { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import WebSocketContext from '../contexts/WebSocketContext'

export default function App({ Component, pageProps }: AppProps) {

  let sessionid = Cookies.get('sessionID');
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    console.log(`sessionid: ${sessionid}`);

    const ws = new WebSocket('ws://localhost:8080');

    ws.addEventListener('open', () => {
      console.log('Connected to server');
      // Sends the session ID to the server
      ws.send(`session: ${sessionid}`)
    });

    ws.addEventListener('message', (event) => {
      console.log(`Received: ${event.data}`);
      const message = event.data as string;

      if (message.startsWith("story:")) {
        // Gets the story alert and removes the "story:" part and the messageid at the end
        const storyAlert = message.split(":")[1];
        const messageid = message.split(":")[3];
        console.log(`messageid: ${messageid}`)
        alert(storyAlert);
      }
    });

    setWs(ws);

    // Return a cleanup function that will be called when the component is unmounted
    return () => {
      ws.close();
    };
  }, []);


  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
      <WebSocketContext.Provider value={ws}>
        <Component {...pageProps} />
      </WebSocketContext.Provider>
    </GoogleOAuthProvider>
  );
}
