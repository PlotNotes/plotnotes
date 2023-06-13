import React, { useState } from 'react';
import { Box, Heading, Header, Textarea, Button, Tooltip } from '@primer/react';
import Head from 'next/head'
import cookies from 'next-cookies'
import loadSession from 'src/pages/api/session'
import Router, { useRouter } from 'next/router'
import Link from 'next/link'
import { LogoutButton } from '../signin';
import { HomeButton, HeaderItem } from '../chapters';
import axios from 'axios';

export default function CustomTerms({ sessionID, terms, termIds, contexts }) {    

    const DisplayTerm = ({term, index}) => {
        
        return (
            <Box
                display="flex"
                flexDirection="column"
                alignItems="center">
                <Link href={`/customTerms/${termIds[index]}`}>
                    <Box>
                        <Heading>
                            {term}
                        </Heading>
                        <Textarea
                            value={contexts[index]}
                            disabled
                            rows={10}
                            cols={70}/>
                    </Box>
                </Link>
            </Box>
        );
    }

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
            <Box
                display="flex"
                flexDirection="column"
                alignItems="center">
                    <Heading>Custom Terms</Heading>
                    { terms.map((term, index) => (
                        <DisplayTerm key={termIds[index]} term={term} index={index} />
                    )) }
            </Box>
        </div>
    );
}

export async function getServerSideProps(ctx) {
    const c = cookies(ctx);
    const sess = await loadSession(c.token);

    if (!sess) {
      return {
        redirect: {
          permanent: false,
          destination: `/signin?from=/customTerms`,
        },
        props:{ },
      };
    }
    let sessionID = sess.rows[0].id; 

    // Gets all terms from the database that belongs to the user using axios
    const baseURL = process.env.NODE_ENV === 'production' 
    ? 'https://plotnotes.ai' 
    : 'http://localhost:3000';

    const axiosInstance = axios.create({
    baseURL: baseURL
    });

    const response = await axiosInstance.get(`/api/customTerms`,
        {
            headers: {
                'Content-Type': 'application/json',
                'Cookie': `token=${c.token}`,
            },
        }
    );

    if (response.status === 401) {
        Router.push(`/signin?from=/chapters/${messageID}`);
        return;
    }

    const data = await response.data;

    const terms = data.terms;
    const termIds = data.termids;
    const contexts = data.contexts;

    return {
        props: { sessionID, terms, termIds, contexts },
    };
}
