import React, { useState } from 'react';
import { Box, Heading, Header, Textarea, Button, Tooltip } from '@primer/react';
import Head from 'next/head'
import cookies from 'next-cookies'
import loadSession from 'src/pages/api/session'
import axios from 'axios';
import Router, { useRouter } from 'next/router'
import Link from 'next/link'
import Image from 'next/image'
import { LogoutButton } from '../signin';
import { HomeButton, HeaderItem } from '../chapters';

export default function CustomTerms({ sessionID }) {

    return (
        <div>
            <Head>
                <title>PlotNotes - Custom Terms</title>
            </Head>
            <Header>
                <HomeButton />
                <HeaderItem href="/prompt" text="Prompt" />
                <HeaderItem href="/shortStories" text="Short Stories" />
                <HeaderItem href="/chapters" text="Chapters" />
                <Header.Item full />
                <LogoutButton />
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
          destination: `/signin?from=/chapters/${messageID}`,
        },
        props:{ },
      };
    }
    let sessionID = sess.rows[0].id; 

    return {
        props: { sessionID },
    };
}
