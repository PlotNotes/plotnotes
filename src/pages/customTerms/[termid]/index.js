import React, { useState } from 'react';
import { Box, Heading, Header, Textarea, Button, Tooltip } from '@primer/react';
import Head from 'next/head'
import cookies from 'next-cookies'
import loadSession from 'src/pages/api/session'
import Router, { useRouter } from 'next/router'
import Link from 'next/link'
import { LogoutButton } from '../../signin';
import { HomeButton, HeaderItem } from '../../chapters';
import axios from 'axios';

export default function TermContext() {

    return (
        <div>
            <Head>
                <title>PlotNotes - Term Context</title>
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

    )
}

export async function getServerSideProps(ctx) {
    const termid = ctx.query.termid;
    const c = cookies(ctx);
    const sess = await loadSession(c.token);

    if (!sess) {
      return {
        redirect: {
          permanent: false,
          destination: `/signin?from=/customTerms/${termid}`,
        },
        props:{ },
      };
    }
    // let sessionID = sess.rows[0].id; 

    return {
        props: {  },
    };
}