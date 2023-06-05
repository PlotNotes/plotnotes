import React, { useState } from 'react';
import { Box, PageLayout, Heading, Header, Textarea, Button, ThemeProvider, Spinner, Tooltip } from '@primer/react';
import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import cookies from 'next-cookies'
import loadSession from 'src/pages/api/session'
import axios from 'axios';


export default function ChapterDisplay({ sessionID, storyNames, messageIDs, chapters }) {
    const [buttonText, setButtonText] = useState('Copy');

    const ChapterMap = ({ chapter, index }) => (
        <Box 
            key={messageIDs[index]}
            display="flex"
            alignItems="center">
                <Link href={`/chapters/${messageIDs[index]}`}>
                    <Box
                        justifyContent="center"
                        alignItems="center">
                            <Heading
                                fontSize={24}
                                fontWeight="bold"
                                color="black">
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
                    <Button
                    onClick={() => {
                        copyStory(chapter.replace('"', ''));
                    }}>
                        {buttonText}
                </Button>
        </Box>
    )
    
    const copyStory = async (story) => {
    
        navigator.clipboard.writeText(story);
    
        setButtonText('Copied!');
    
        setTimeout(() => {
            setButtonText('Copy');
        }, 2000);
    }

    return (
        <div>
            <Head>
                <title>PlotNotes</title>
            </Head>
            <Header>
                <HomeButton />
                <HeaderItem href="/shortStories" text="Short Stories" />
                <HeaderItem href="/prompt" text="Prompt" />
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
                    <ChapterMap chapter={chapter} index={index} />
                ))}

            </Box>
        </div>
    );
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
        <Link href="/">
            <Tooltip aria-label="Home" direction="s" noDelay >
                <Image src="/images/PlotNotesIcon.png" alt="PlotNotes" height={70} width={90} />
            </Tooltip>
        </Link>
    </Header.Item>
)

export async function getServerSideProps(ctx) {

    const c = cookies(ctx);
    const sess = await loadSession(c.token);

    if (!sess) {
      return {
        redirect: {
          permanent: false,
          destination: "/signin?from=/chapters",
        },
        props:{ },
      };
    }
    let sessionID = sess.rows[0].id;

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
                    'Cookie': `token=${sessionID}`
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
            props: { sessionID, storyNames: [], messageIDs: [], chapters: [] },
        };
    }
    
    const storyNames = chapterInfo.storyNames;
    const messageIDs = chapterInfo.messageIDs;
    const chapters = chapterInfo.chapters;

    return { props: { sessionID, storyNames, messageIDs, chapters } };
}