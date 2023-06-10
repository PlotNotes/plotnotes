import React, { useState } from 'react';
import { Box, PageLayout, Heading, Header, Textarea, Button, ThemeProvider, Spinner, Tooltip } from '@primer/react';
import Head from 'next/head'
import cookies from 'next-cookies'
import loadSession from 'src/pages/api/session'
import axios from 'axios';
import Router, { useRouter } from 'next/router'
import Link from 'next/link'
import Image from 'next/image'

export default function Edit({ oldMessage, newMessage }) {
  console.log('oldMessage: ', oldMessage);
  console.log('newMessage: ', newMessage);
  return (
    <div>
      <Head>
        <title>PlotNotes</title>
      </Head>
      <Header>
        <HomeButton />
        <HeaderItem href="/shortStories" text="Short Stories" />
        <HeaderItem href="/prompt" text="Prompt" />
      </Header>
      <Box
        display="flex"
        flexDirection="row"
        alignItems="center"
        sx={{ paddingBottom: 6 }}>
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          sx={{ paddingLeft: 6, paddingRight:4 }}>
            <Heading fontSize={5} color="black" mb={3}>Old Message</Heading>
            <Textarea
              cols={70}
              rows={20}
              value={oldMessage}
              readOnly={true}/>
              <Button variant='primary'>
                Accept
              </Button>
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
              <Button variant='primary'>
                Accept
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
      <Link href="/">
          <Tooltip aria-label="Home" direction="s" noDelay >
              <Image src="/images/PlotNotesIcon.png" alt="PlotNotes" height={70} width={90} />
          </Tooltip>
      </Link>
  </Header.Item>
)


export async function getServerSideProps(ctx) {
    const c = cookies(ctx);
    const sess = await loadSession(c.token);
    const messageID = ctx.query.messageid;
    if (!sess) {
      return {
        redirect: {
          permanent: false,
          destination: `/signin?from=/edit/${messageID}`,
        },
        props:{ },
      };
    }
    let sessionID = sess.rows[0].id;
    
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
            'Cookie': `token=${sessionID}`
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