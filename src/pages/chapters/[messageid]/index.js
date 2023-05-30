import React, { useState } from 'react';
import { Box, PageLayout, Heading, Header, Textarea, Button, ThemeProvider, Spinner, Tooltip } from '@primer/react';
import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import cookies from 'next-cookies'
import loadSession from 'src/pages/api/session'
import Router, { useRouter } from 'next/router'
import axios from 'axios';

export default function Page({ sessionID, stories, title, messageIDs }) {

    return (
        <div>
            <Head>
                <title>PlotNotes</title>
            </Head>
            <Header>
                <Header.Item>
                    <Link href="/">
                        <Tooltip aria-label="Home" direction="s" noDelay >
                            <Image src="/images/PlotNotesIcon.png" alt="PlotNotes" height={70} width={90} />
                        </Tooltip>
                    </Link>
                </Header.Item>
                <Header.Item>
                    <Button variant='primary'>
                        <Link href="/shortStories">
                            Short Stories
                        </Link>
                    </Button>
                </Header.Item>
                <Header.Item>
                    <Button variant='primary'>
                        <Link href="/chapters">
                            Chapters
                        </Link>
                    </Button>
                </Header.Item>
            </Header>
        </div>
    );
}

export async function getServerSideProps(ctx) {
    const messageID = await ctx.query.messageid;
    const c = cookies(ctx);
    const sess = await loadSession(c.token);

    if (!sess) {
      return {
        redirect: {
          permanent: false,
          destination: `/signin?from=/${messageID}`,
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



    return { props: { sessionID }}
}
