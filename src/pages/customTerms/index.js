import React, { useState } from 'react';
import { Box, Heading, Header, Textarea, Button, IconButton, Spinner } from '@primer/react';
import Head from 'next/head'
import loadSession from 'src/pages/api/session'
import Router from 'next/router'
import Link from 'next/link'
import { LogoutButton } from '../signin';
import { HomeButton, HeaderItem } from '../chapters';
import axios from 'axios';
import { TrashIcon } from '@primer/octicons-react'

export default function CustomTerms({ sessionID, terms, termIds, contexts }) {    

    const [generating, setGenerating] = useState(false);

    const DisplayTerm = ({term, index}) => {
        
        return (
            <Box
                display="flex"
                flexDirection="rows"
                alignItems="center"
                sx={{ paddingBottom:4, paddingRight:4 }}>
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
                                sessionID: sessionID,
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
                'Cookie': `sessionID=${sessionID}`,
                },
                body: JSON.stringify({ term: term, context: context }),
            }
        );
    }

    const ActionButton = ({ buttonText, onClick, trigger }) => (
        <Button variant='primary' onClick={onClick} disabled={trigger} sx={{ mt: 2, marginLeft: 'auto', marginRight: 'auto' }}>
            <Box sx={{display: "grid", gridTemplateColumns: "1fr 1fr", gridGap: "3px"}}>
                <Box>{buttonText}</Box>
                    <Box>
                        <Spinner size="small" sx={{marginLeft: "12px", display: trigger ? "block" : "none"}} />
                    </Box>
            </Box>
        </Button>
    );

    const generateTerm = async () => {

        setGenerating(true);

        const termName = document.getElementById('term').value;

        const response = await fetch(`/api/customTerms/generate`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': `sessionID=${sessionID}`,
                'term': termName,
            },
        });

        if (response.status === 401) {
            Router.push(`/signin?from=/customTerms`);
            return;
        }

        const data = await response.json();

        const termid = data.termid;

        setGenerating(false);

        Router.push(`/customTerms/${termid}`);
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
            { 
                // chunk the terms array into sub-arrays of 2 elements each
                Array.from({length: Math.ceil(terms.length / 2)}, (v, i) => i).map(chunkIndex => (
                    <Box
                        key={chunkIndex}
                        display="flex"
                        flexDirection="row"
                        alignItems="center">
                        { terms.slice(chunkIndex * 2, (chunkIndex + 1) * 2).map((term, index) => (
                            <DisplayTerm key={termIds[chunkIndex * 2 + index]} term={term} index={chunkIndex * 2 + index} />
                        ))}
                    </Box>
                ))
            }
    </Box>
    <Box
        display="flex"
        flexDirection="column"
        alignItems="center">
            <Heading sx={{ paddingTop:4 }}>Create New Term</Heading>
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
            <Box
                display="flex"
                flexDirection="row"
                alignItems="center"
                sx={{ marginBottom:4 }}>
                <Button
                    onClick={() => {
                        createTerm(document.getElementById('term').value, document.getElementById('context').value);
                        Router.reload();
                    }}
                    sx={{ marginTop:2, marginRight:4 }}>
                    Create
                </Button>
                <ActionButton buttonText="Generate" onClick={generateTerm} trigger={generating} />
            </Box>
    </Box>
</div>

    );
}

export async function getServerSideProps(ctx) {
    const sessionID = ctx.req.cookies.sessionID;
    const isLoggedIn = await loadSession(sessionID);

    if (!isLoggedIn) {
      return {
        redirect: {
          permanent: false,
          destination: `/signin?from=/customTerms`,
        },
        props:{ },
      };
    }

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
                'Cookie': `sessionID=${sessionID}`,
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
