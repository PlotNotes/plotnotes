import React, { useState } from 'react';
import { Box, Heading, Header, Textarea, Button, IconButton } from '@primer/react';
import Head from 'next/head'
import cookies from 'next-cookies'
import loadSession from 'src/pages/api/session'
import Router, { useRouter } from 'next/router'
import Link from 'next/link'
import { LogoutButton } from '../signin';
import { HomeButton, HeaderItem } from '../chapters';
import axios from 'axios';
import { TrashIcon } from '@primer/octicons-react'

export default function CustomTerms({ sessionID, terms, termIds, contexts }) {    

    const DisplayTerm = ({term, index}) => {
        
        return (
            <Box
                display="flex"
                flexDirection="rows"
                alignItems="center">
                <Link href={`/customTerms/${termIds[index]}`}>
                    <Box
                        display="flex"
                        flexDirection="column"
                        alignItems="center">
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
                <IconButton
                    onClick={() => {
                        axios.delete(`/api/customTerms/${termIds[index]}`,
                        {
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            params: {
                                token: sessionID,
                            },
                        }
                        );
                        Router.reload();
                    }}
                    icon={TrashIcon} />
            </Box>
        );
    }

    const createTerm = async (term, context) => {

        await fetch(`/api/customTerms`, 
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': `token=${sessionID}`,
                },
                body: JSON.stringify({ term: term, context: context }),
            }
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
                    <Heading sx={{ paddingBottom: 5, paddingRight: 4 }} >Custom Terms</Heading>
                    { terms.map((term, index) => (
                        <DisplayTerm key={termIds[index]} term={term} index={index} />
                    )) }
            </Box>
            <Box
                display="flex"
                flexDirection="column"
                alignItems="center">
                    <Heading sx={{ paddingTop:4 }} >Create New Term</Heading>
                    <Textarea
                        id="term"
                        placeholder="Term"
                        rows={1}
                        cols={70}/>
                    <Textarea
                        id="context"
                        placeholder="Context"
                        rows={10}
                        cols={70}/>
                    <Button
                        onClick={() => {
                            createTerm(document.getElementById('term').value, document.getElementById('context').value);
                            Router.reload();
                        }}>
                        Create
                    </Button>
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
