import React, { useState } from 'react';
import { Box, PageLayout, Heading, Header, Textarea, Button, ThemeProvider, Spinner, Tooltip } from '@primer/react';
import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import cookies from 'next-cookies'
import loadSession from 'src/pages/api/session'
import Router, { useRouter } from 'next/router'
import axios from 'axios';

export default function Page({ sessionID, chapters, storyNames, messageIDs }) {
    
    const router = useRouter();
    const { messageid } = router.query;

    const [isGenerating, setIsGenerating] = useState(false);

    const [prompt, setPrompt] = useState('');

    const handleChange = (ev) => {
        setPrompt(ev.target.value);
    };

    const handleSubmit = async (ev) => {
        ev.preventDefault();
        setIsGenerating(true);

        try {

            const response = await fetch(`/api/${messageid}/chapters`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Cookie': `token=${sessionID}`,
                    },
                    body: JSON.stringify({ messageid: messageid, prompt: prompt }),
                }
            );

            // Redirect the user to the page of the new story by using the new messageID given from the server
            const chapterInfo = await response.json();

            const messageID = chapterInfo.messageID;

            Router.push(`/${messageID}`);

        } catch(err) {
            console.log('messageid Error: ', err);
        }
    };


    return (
        <div>
            <Head>
                <title>PlotNotes</title>
            </Head>
            <Header>
                <Header.Item>
                    <Link href="/">
                        <Tooltip aria-label="Home" direction="s" noDelay >
                            <Image src="/images/PlotNotesIcon.png" alt="PlotNotes" height={70} width={90} />
                        </Tooltip>
                    </Link>
                </Header.Item>
                <Header.Item>
                    <Button variant='primary'>
                        <Link href="/shortStories">
                            Short Stories
                        </Link>
                    </Button>
                </Header.Item>
                <Header.Item>
                    <Button variant='primary'>
                        <Link href="/prompt">
                            Prompt
                        </Link>
                    </Button>
                </Header.Item>
                <Header.Item>
                    <Button variant='primary'>
                        <Link href="/chapters">
                            Chapters
                        </Link>
                    </Button>
                </Header.Item>
            </Header>
            <Box
                display="flex"
                flexDirection="column"
                justifyContent="center"
                alignItems="center"
                bg="gray.50">
                    {/* Creates a map for all provided chapters. There should be a copy button on the right side of each textarea */}
                    { chapters.map((chapter, index) => (
                        <div key={messageIDs[index]}>
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
                                                fontWeight="bold"
                                                color="black"
                                                cols={90}
                                                rows={20}
                                                value={chapter}/>
                                            <Button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(chapter);
                                                }}>
                                                Copy
                                            </Button>
                                        </Box>
                                </Box>
                            </Link>
                        </div>
                    ))}
                    {/* Textarea at the bottom to allow the user to add onto the existing story */}
                   <Box
                        display="flex"
                        flexDirection="column"
                        justifyContent="center"
                        alignItems="center"
                        bg="gray.50">
                            <Heading
                                fontSize={24}
                                fontWeight="bold"
                                color="black"
                                sx={{ paddingTop: 4 }}>
                                Add to the story
                            </Heading>
                            <Textarea
                                fontWeight="bold"
                                color="black"
                                cols={90}
                                rows={10}
                                onChange={handleChange}/>
                            <Button variant='primary' onClick={handleSubmit} disabled={isGenerating} sx={{ mt: 2, marginLeft: 'auto', marginRight: 'auto' }}>
                                <Box sx={{display: "grid", gridTemplateColumns: "1fr 1fr", gridGap: "3px"}}>
                                    <Box>Submit</Box>
                                        <Box>
                                            <Spinner size="small" sx={{marginLeft: "12px", display: isGenerating ? "block" : "none"}} />
                                        </Box>
                                </Box>
                            </Button>
                    </Box>
            </Box>
        </div>
    );
}

export async function getServerSideProps(ctx) {
    const messageID = await ctx.query.messageid;
    const c = cookies(ctx);
    const sess = await loadSession(c.token);

    if (!sess) {
      return {
        redirect: {
          permanent: false,
          destination: `/signin?from=/${messageID}`,
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

    const response = await axiosInstance.get(`/api/${messageID}/chapters`,
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

    const chapters = chapterInfo.chapters;
    const storyNames = chapterInfo.storyNames;
    const messageIDs = chapterInfo.messageIDs;

    return { props: { sessionID, storyNames, messageIDs, chapters } };
}
