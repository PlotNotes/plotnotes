import React, { useState } from 'react';
import { Box, Heading, Header, Textarea, Button, Tooltip } from '@primer/react';
import Head from 'next/head'
import loadSession from 'src/pages/api/session'
import axios from 'axios';
import Router, { useRouter } from 'next/router'
import Link from 'next/link'
import Image from 'next/image'
import { LogoutButton } from '../../signin';

export default function Edit({ oldMessage, newMessage }) {

  const messageID = useRouter().query.messageid;

  const onAccept = async (ev) => {
    ev.preventDefault();
    try {
      const response = await fetch(`/api/${messageID}/edit`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            },
            body: JSON.stringify({ accept: true, table: 'shortstory' }),
          });
        
      if (response.status === 401) {
        Router.push(`/signin?from=/shortStories/${messageID}/edit`);  
        return;
      }

      Router.push(`/shortStories/${messageID}`);
      
  } catch(err) {
    console.log('messageid Error: ', err);
  }
}

const onReject = async (ev) => {
  ev.preventDefault();
  try {
    const response = await fetch(`/api/${messageID}/edit`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          },
          body: JSON.stringify({ accept: false, table: 'shortstory' }),
        });

      if (response.status === 401) {
        Router.push(`/signin?from=/edit/${messageID}`);  
        return;
      }

      Router.push(`/shortStory/${messageID}`);

  } catch(err) {
    console.log('messageid Error: ', err);
  }
}

  return (
    <div>
      <Head>
        <title>PlotNotes - Short Story Edit</title>
      </Head>
      <Header>
        <HomeButton />
        <HeaderItem href="/chapters" text="Chapters" />
        <HeaderItem href="/prompt" text="Prompt" />
        <Header.Item full />
        <LogoutButton />
      </Header>
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        sx={{ paddingBottom: 6 }}>
          <Box
            display="flex"
            flexDirection="row"
            alignItems="center">
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              sx={{ paddingRight:4 }}>
                <Heading fontSize={5} color="black" mb={3}>Old Message</Heading>
                <Textarea
                  cols={70}
                  rows={20}
                  value={oldMessage}
                  readOnly={true}/>
              </Box>
              <Box
                display="flex"
                flexDirection="column"
                alignItems="center">
                <Heading fontSize={5} color="black" mb={3}>New Message</Heading>
                <Textarea
                  cols={70}
                  rows={20}
                  value={newMessage}
                  readOnly={true}/>
              </Box>
            </Box>
            <Box
              display="flex"
              flexDirection="row"
              alignItems="center">
              <Button variant='primary' onClick={onAccept} sx={{ mt: 2, marginLeft: 'auto', marginRight: 'auto', scale: 2 }}>
                Accept
              </Button>
              <Button variant='primary' onClick={onReject} sx={{ mt: 2, marginLeft: 'auto', marginRight: 'auto' }}>
                Reject
              </Button>
            </Box>
      </Box>
    </div>
  );
}

export const HeaderItem = ({ href, text }) => (
  <Header.Item>
      <Button variant='primary'>
      <Link href={href}>{text}</Link>
    </Button>
  </Header.Item>
)

export const HomeButton = () => (
  <Header.Item>
      <Link href="/?loggedIn=true">
          <Tooltip aria-label="Home" direction="s" noDelay >
              <Image src="/images/PlotNotesIcon.png" alt="PlotNotes" height={70} width={90} />
          </Tooltip>
      </Link>
  </Header.Item>
)


export async function getServerSideProps(ctx) {
    const sessionID = ctx.req.cookies.sessionID;
    const isLoggedIn = await loadSession(sessionID);
    const messageID = ctx.query.messageid;
    
    if (!isLoggedIn) {
      return {
        redirect: {
          permanent: false,
          destination: `/signin?from=/edit/${messageID}`,
        },
        props:{ },
      };
    }
    
    const baseURL = process.env.NODE_ENV === 'production' 
    ? 'https://plotnotes.ai' 
    : 'http://localhost:3000';

    const axiosInstance = axios.create({
    baseURL: baseURL
    });

    const messages = await axiosInstance.get(`/api/${messageID}/edit`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Cookie': `sessionID=${sessionID}`
            },
          }
      );
      
    const messageData = messages.data;

    const oldMessage = messageData.oldMessage;
    const newMessage = messageData.newMessage;

    return {
        props: {
            oldMessage,
            newMessage
        }
      }
}