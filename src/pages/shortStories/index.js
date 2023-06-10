import React, { useState } from 'react'
import { Box, Heading, Header, Button, Textarea, Tooltip } from '@primer/react';
import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import cookies from 'next-cookies'
import loadSession from 'src/pages/api/session'
import axios from 'axios';

export default function History({sessionID, stories, prompts, storyNames, messageIDs}) {    
    // Upon loading the page, the user is presented with a list of their previous stories
    // Each story is displayed as a button that, when clicked, will display the story in a text area below the list

    return (
        <div>
            <Head>
                <title>PlotNotes - Short Stories</title>
            </Head>
            <Header>
                <HomeButton />
                <HeaderItem href="/prompt" text="Prompt" />
                <HeaderItem href="/chapters" text="Chapters" />
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
                    <StoryMap key={messageIDs[index]} story={story} index={index} messageIDs={messageIDs} storyNames={storyNames} />
                ))}

            </Box>
        </div>
    );
}

export const StoryMap = ({ story, index, messageIDs, storyNames }) => {

    const [buttonText, setButtonText] = useState('Copy');

    const copyStory = async (story) => {

        navigator.clipboard.writeText(story);

        setButtonText('Copied!');

        setTimeout(() => {
            setButtonText('Copy');
        }, 1000);
    }

    if (typeof storyNames === 'string') {
        return (
            <Box
                display="flex"
                alignItems="center">
                    <Link href={`/shortStories/${messageIDs[index]}`}>
                        <Box
                            display="flex"
                            flexDirection="row"
                            justifyContent="center"
                            alignItems="center"
                            sx={{ paddingBottom: 3 }}>
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
                        <Button
                        onClick={() => {
                            copyStory(story);
                        }}>
                            {buttonText}
                    </Button>
            </Box>
        );
    }

    return (
    <Box
        display="flex"
        alignItems="center">
            <Link href={`/shortStories/${messageIDs[index]}`}>
                <Box
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
                <Button
                onClick={() => {
                    copyStory(story);
                }}>
                    {buttonText}
            </Button>
    </Box>
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
          destination: "/signin?from=/shortStories",
        },
        props:{ },
      };
    }
    let sessionID = sess.rows[0].id;

    const baseURL = process.env.NODE_ENV === 'production' 
    ? 'https://plotnotes.ai' 
    : 'http://localhost:3000';

    const axiosInstance = axios.create({
    baseURL: baseURL
    });

    // Then use axiosInstance instead of axios
    let historyQuery = await axiosInstance.get('/api/shortStoryCmds', {
    headers: {
        'Content-Type': 'application/json',
        'Cookie': `token=${sessionID}`,
    },
    });

    const historyResponse = await historyQuery.data;
    
    let stories = historyResponse.stories;
    let prompts = historyResponse.prompts;
    let storyNames = historyResponse.titles;
    let messageIDs = historyResponse.messageIDs;

    // Checks the messageid array to see if there are any duplicates, if there are, then remove the duplicates from all arrays
    for (let i = 0; i < messageIDs.length; i++) {
        if (messageIDs.indexOf(messageIDs[i]) !== messageIDs.lastIndexOf(messageIDs[i])) {
            stories.splice(i, 1);
            prompts.splice(i, 1);
            storyNames.splice(i, 1);
            messageIDs.splice(i, 1);
        }
    }

    return { props: { sessionID, stories, prompts, storyNames, messageIDs } };
}