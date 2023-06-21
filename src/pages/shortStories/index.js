import React, { useState, useEffect } from 'react'
import { Box, Heading, Header, Button, Textarea, Tooltip, IconButton } from '@primer/react';
import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import Cookies from 'js-cookie'
import axios from 'axios';
import { LogoutButton } from '../signin';
import { TrashIcon } from '@primer/octicons-react'
import Router from 'next/router'

export default function History() {    
    // Upon loading the page, the user is presented with a list of their previous stories
    // Each story is displayed as a button that, when clicked, will display the story in a text area below the list

    const [sessionID, setSessionID] = useState("");
    const [stories, setStories] = useState([]);
    const [storyNames, setStoryNames] = useState([]);
    const [messageIDs, setMessageIDs] = useState([]);

    useEffect(() => {
        const getSession = async () => {
            const session = Cookies.get('sessionID');
            const response = await fetch(`/api/session`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Cookie': `sessionID=${session}`,
                },
            });

            if (response.status === 401) {
                Router.push(`/signin?from=/shortStories`);
                return;
            }

            const data = await response.json();
            setSessionID(data.sessionId);
        };

        const getStories = async () => {
            const baseURL = process.env.NODE_ENV === 'production' 
            ? 'https://plotnotes.ai' 
            : 'http://localhost:3000';

            const axiosInstance = axios.create({
            baseURL: baseURL
            });
            
            let historyQuery = await axiosInstance.get('/api/shortStoryCmds', {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

            const historyResponse = await historyQuery.data;

            setStories(historyResponse.stories);
            setStoryNames(historyResponse.titles);
            setMessageIDs(historyResponse.messageIDs);
        };

        getSession();
        getStories();
    }, []);

    return (
        <div>
            <Head>
                <title>PlotNotes - Short Stories</title>
            </Head>
            <Header>
                <HomeButton />
                <HeaderItem href="/prompt" text="Prompt" />
                <HeaderItem href="/chapters" text="Chapters" />
                <HeaderItem href="/customTerms" text="Custom Terms" />
                <Header.Item full />
                <LogoutButton />
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
                    <StoryMap key={messageIDs[index]} story={story} index={index} messageIDs={messageIDs} storyNames={storyNames} sessionID={sessionID} />
                ))}

            </Box>
        </div>
    );
}

export const StoryMap = ({ story, index, messageIDs, storyNames, sessionID }) => {

    const [buttonText, setButtonText] = useState('Copy');

    const copyStory = async (story) => {

        navigator.clipboard.writeText(story);

        setButtonText('Copied!');

        setTimeout(() => {
            setButtonText('Copy');
        }, 1000);
    }

    return (
    <Box
        display="flex"
        alignItems="center"
        sx={{ paddingBottom:4 }}>
            <Link href={`/shortStories/${messageIDs[index]}`}>
                <Box
                    display="flex"
                    justifyContent="center"
                    alignItems="center">
                        <Heading
                            fontSize={24}
                            fontWeight="bold"
                            color="black">
                            {storyNames[index]}
                        </Heading>
                </Box>
                <Box
                    display="flex"
                    flexDirection="row"
                    justifyContent="center"
                    alignItems="center">
                    <Textarea
                        disabled
                        id={`story-${index}`}
                        name={`story-${index}`}
                        value={story}
                        aria-label="Story"
                        cols={90}
                        rows={20}
                    />
                </Box>
            </Link>
            <Box
                display="flex"
                flexDirection="column"
                alignItems="center">
                <Button
                    onClick={() => {
                        copyStory(story);
                    }}>
                        {buttonText}
                </Button>
                <IconButton
                    icon={TrashIcon}
                    aria-label="Delete"
                    onClick={() => {
                        deleteStory(messageIDs[index], sessionID);
                    }}
                    sx={{ marginTop: 4 }}/>
            </Box>
    </Box>
    );
}

async function deleteStory(messageID, sessionID) {

    const response = await fetch(`/api/shortStoryCmds`,
            {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Cookie': `sessionID=${sessionID}`,
                    'messageid': messageID,
                },
            }
        );

    if (response.status === 401) {
        Router.push('/signin?from=/shortStories');
        return;
    }

    // Reloads the page
    Router.reload();
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

// export async function getServerSideProps(ctx) {
//     const c = Cookies.get("sessionID");
//     const sess = await loadSession(c);

//     if (!sess) {
//       return {
//         redirect: {
//           permanent: false,
//           destination: "/signin?from=/shortStories",
//         },
//         props:{ },
//       };
//     }
//     let sessionID = sess.rows[0].id;

//     const baseURL = process.env.NODE_ENV === 'production' 
//     ? 'https://plotnotes.ai' 
//     : 'http://localhost:3000';

//     const axiosInstance = axios.create({
//     baseURL: baseURL
//     });

//     // Then use axiosInstance instead of axios
//     let historyQuery = await axiosInstance.get('/api/shortStoryCmds', {
//     headers: {
//         'Content-Type': 'application/json',
//         'Cookie': `sessionID=${sessionID}`,
//     },
//     });

//     const historyResponse = await historyQuery.data;
    
//     let stories = historyResponse.stories;
//     let prompts = historyResponse.prompts;
//     let storyNames = historyResponse.titles;
//     let messageIDs = historyResponse.messageIDs;

//     // Checks the messageid array to see if there are any duplicates, if there are, then remove the duplicates from all arrays
//     for (let i = 0; i < messageIDs.length; i++) {
//         if (messageIDs.indexOf(messageIDs[i]) !== messageIDs.lastIndexOf(messageIDs[i])) {
//             stories.splice(i, 1);
//             prompts.splice(i, 1);
//             storyNames.splice(i, 1);
//             messageIDs.splice(i, 1);
//         }
//     }

//     return { props: { sessionID, stories, prompts, storyNames, messageIDs } };
// }