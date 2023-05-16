import React, { useState } from 'react'
import { Box, PageLayout, Heading, Header, Button, Textarea, Tooltip } from '@primer/react';
import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import cookies from 'next-cookies'
import loadSession from 'src/pages/api/session'
import { type } from 'os';

export default function History({sessionID, stories, prompts, titles}) {    
    // Upon loading the page, the user is presented with a list of their previous stories
    // Each story is displayed as a button that, when clicked, will display the story in a text area below the list
    
    return (
        <div>
            <Head>
                <title>PlotNotes</title>
            </Head>
            <Header>
                <Header.Item>
                    <Link href="/">
                        <Tooltip aria-label="Home" direction="e" noDelay >
                            <Image src="/images/PlotNotesIcon.png" alt="PlotNotes" height={70} width={90} />
                        </Tooltip>
                    </Link>
                </Header.Item>
                <Header.Item>
                    <Link href="/prompt">
                        <Tooltip aria-label="Prompt" direction="e" noDelay >
                            {/* <Image src="/images/PromptIcon.png" alt="Prompt" height={70} width={90} /> */}
                        </Tooltip>
                    </Link>
                </Header.Item>
            </Header>
            <Box
            display="flex"
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
            bg="gray.50">
                {/* Creates a list for each item in the history array by calling the history method above */}
                {/* There should be a copy button on the right side of each textarea, and when the textarea */}
                {/* is clicked on, it will take the user to a page specifically about that story */}
                {stories.map((story, index) => (
                    <Box
                        key={index} 
                        flexDirection="row"
                        justifyContent="center"
                        alignItems="center"
                        bg="gray.50">
                            <Heading
                                fontSize={24}
                                fontWeight="bold"
                                color="black"
                                textAlign="center"
                                width="100%"
                                height="100%"
                                bg="gray.50"
                                sx={{
                                    '&:hover': {
                                        bg: 'gray.200',
                                    },
                                }}>
                                {titles[index].title}
                            </Heading>
                            
                            <Box
                                display="flex"
                                flexDirection="row"
                                justifyContent="center"
                                alignItems="center"
                                bg="gray.50"
                                width="100%"
                                height="100%"
                                sx={{
                                    '&:hover': {
                                        bg: 'gray.200',
                                    },
                                }}>
                                <Textarea
                                    disabled
                                    id={`story-${index}`}
                                    name={`story-${index}`}
                                    value={story.message}
                                    aria-label="Story"
                                    width="100%"
                                    height="100%"
                                    cols={60} 
                                    rows={10}
                                />
                                <Button
                                    onClick={() => {
                                        navigator.clipboard.writeText(story.message);
                                    }}
                                    aria-label="Copy"
                                    width="100%"
                                    height="100%"
                                    bg="gray.50"
                                    color="black"
                                    border="none"
                                    sx={{
                                        '&:hover': {
                                            bg: 'gray.200',
                                        },
                                    }}>
                                    Copy
                                </Button>
                            </Box>
                    </Box>
                ))}

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
          destination: "/signin?from=/history",
        },
        props:{ },
      };
    }
    let sessionID = sess.rows[0].id;

    let historyQuery = await fetch('http://localhost:3000/api/storyCmds',
        {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': `token=${sessionID}`,
            },
        }
    );
    const historyResponse = await historyQuery.json();

    let stories = historyResponse.stories;
    let prompts = historyResponse.prompts;
    let titles = historyResponse.titles;

    return { props: { sessionID, stories, prompts, titles } };
}