import React, { useState, useEffect, use } from 'react';
import { Box, Heading, Header, Textarea, Button, Tooltip, IconButton } from '@primer/react';
import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import Cookies from 'js-cookie'
import axios from 'axios';
import { LogoutButton } from '../signin';
import { TrashIcon } from '@primer/octicons-react'

export default function ChapterDisplay() {

    const [sessionID, setSessionID] = useState("");
    const [storyNames, setStoryNames] = useState([]);
    const [messageIDs, setMessageIDs] = useState([]);
    const [chapters, setChapters] = useState([]);

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
        Router.push(`/signin?from=/prompt`);
        return;
        }

        const data = await response.json();
        setSessionID(data.sessionId);
    };

    const getChapters = async () => {

        // Makes a fetch request to get the user's chapter history
        const baseURL = process.env.NODE_ENV === 'production' 
        ? 'https://plotnotes.ai' 
        : 'http://localhost:3000';

        const axiosInstance = axios.create({
        baseURL: baseURL
        });

        const response = await axiosInstance.get(`/api/chapterCmds`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );
        
        const chapterInfo = await response.data;

        // If the json has an error saying the messageID does not belong to the user, redirect to the home page
        if (chapterInfo.error) {
            console.log("chapterInfo error:", chapterInfo.error);
            return {
                redirect: {
                    permanent: false,
                    destination: `/`,
                },
                props:{ },
            };
        } else if (chapterInfo.response === 'no chapters') {
            return {
                props: { storyNames: [], messageIDs: [], chapters: [] },
            };
        }

        setChapters(chapterInfo.chapters);
        setStoryNames(chapterInfo.storyNames);
        setMessageIDs(chapterInfo.messageIDs);
    }

    getSession();
    getChapters();
    }, []);


    return (
        <div>
            <Head>
                <title>PlotNotes - Chapters</title>
            </Head>
            <Header>
                <HomeButton />
                <HeaderItem href="/prompt" text="Prompt" />
                <HeaderItem href="/shortStories" text="Short Stories" />
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
                {chapters.map((chapter, index) => (   
                    <ChapterMap key={messageIDs[index]} chapter={chapter} index={index} messageIDs={messageIDs} storyNames={storyNames} sessionID={sessionID} />
                ))}

            </Box>
        </div>
    );
}

export const ChapterMap = ({ chapter, index, messageIDs, storyNames, sessionID }) => {

    const [buttonText, setButtonText] = useState('Copy');

    const copyStory = async (story) => {

        navigator.clipboard.writeText(story);
    
        setButtonText('Copied!');
    
        setTimeout(() => {
            setButtonText('Copy');
        }, 2000);
    }
        
    return (
    <Box 
        display="flex"
        alignItems="center">
            <Link href={`/chapters/${messageIDs[index]}`}>
                <Box
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    sx={{ paddingBottom:4 }}>
                        <Heading>
                            {storyNames[index]}
                        </Heading>
                        
                        <Box
                            display="flex"
                            flexDirection="row"
                            justifyContent="center"
                            alignItems="center">
                            <Textarea
                                disabled
                                id={`story-${index}`}
                                name={`story-${index}`}
                                value={chapter.replace('"', '')}
                                aria-label="Story"
                                cols={90} 
                                rows={20}
                            />                                    
                        </Box>
                </Box>
            </Link>
            <Box
                display="flex"
                flexDirection="column"
                alignItems="center">
                <Button
                    onClick={() => {
                        copyStory(chapter.replace('"', ''));
                    }}>
                        {buttonText}
                </Button>
                <IconButton
                    icon={TrashIcon}
                    aria-label="Delete"
                    onClick={() => {
                        deleteChapter(messageIDs[index], sessionID);
                    }}
                    sx={{ marginTop: 4 }}/>
            </Box>
    </Box>
    );
}

export const deleteChapter = async (messageID, sessionID) => {
    
    const response = await fetch(`/api/chapterCmds`,
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
        Router.push(`/signin?from=/chapters`);
        return;
    }

    // Reload the page
    window.location.reload();
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
//           destination: "/signin?from=/chapters",
//         },
//         props:{ },
//       };
//     }
//     let sessionID = sess.rows[0].id;

//     // Makes a fetch request to get the user's chapter history
//     const baseURL = process.env.NODE_ENV === 'production' 
//     ? 'https://plotnotes.ai' 
//     : 'http://localhost:3000';

//     const axiosInstance = axios.create({
//     baseURL: baseURL
//     });

//     const response = await axiosInstance.get(`/api/chapterCmds`,
//             {
//                 method: 'GET',
//                 headers: {
//                     'Content-Type': 'application/json',
//                     'Cookie': `sessionID=${sessionID}`
//                 },
//             }
//         );
    
//     const chapterInfo = await response.data;

//     // If the json has an error saying the messageID does not belong to the user, redirect to the home page
//     if (chapterInfo.error) {
//         console.log("chapterInfo error:", chapterInfo.error);
//         return {
//             redirect: {
//                 permanent: false,
//                 destination: `/`,
//             },
//             props:{ },
//         };
//     } else if (chapterInfo.response === 'no chapters') {
//         return {
//             props: { storyNames: [], messageIDs: [], chapters: [] },
//         };
//     }
    
//     const storyNames = chapterInfo.storyNames;
//     const messageIDs = chapterInfo.messageIDs;
//     const chapters = chapterInfo.chapters;

//     return { props: { sessionID, storyNames, messageIDs, chapters } };
// }