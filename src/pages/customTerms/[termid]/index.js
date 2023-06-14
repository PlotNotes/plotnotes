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

export default function TermContext({ sessionid, context, term }) {
    const termid = useRouter().query.termid;
    
    const saveContext = async (context) => {
        await fetch(`/api/customTerms/${termid}`, 
        {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': `token=${sessionid}`,
                },
                body: JSON.stringify({ context: context }),
            }
        );
    }

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
            <Box
                display="flex"
                flexDirection="column"
                alignItems="center">
                    <Heading>{term}</Heading>
                    <Textarea
                        id="context"
                        defaultValue={context}                        
                        rows={20}
                        cols={90}/>
                    <Button
                        onClick={() => {
                            saveContext(document.getElementById('context').value);
                        }}>
                        Save
                    </Button>
            </Box>
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

    let sessionid = sess.rows[0].id; 
    
    const baseURL = process.env.NODE_ENV === 'production' 
    ? 'https://plotnotes.ai' 
    : 'http://localhost:3000';

    const axiosInstance = axios.create({
        baseURL: baseURL
    });

    const response = await axiosInstance.get(`/api/customTerms/${termid}`,
        {
            headers: {
                'Content-Type': 'application/json',
                'Cookie': `token=${c.token}`,
            },
        }
    );
    
    const data = await response.data;
    const context = data.context;
    const term = data.term;

    return {
        props: { sessionid, context, term },
    };
}