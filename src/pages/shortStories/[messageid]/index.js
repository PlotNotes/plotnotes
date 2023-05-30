import React, { useState } from 'react';
import { Box, PageLayout, Heading, Header, Textarea, Button, ThemeProvider, Spinner, Tooltip } from '@primer/react';
import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import cookies from 'next-cookies'
import loadSession from 'src/pages/api/session'
import Router, { useRouter } from 'next/router'
import axios from 'axios';

export default function Page({ sessionID, stories, title, messageIDs }) {
    // Gets the messageID from the URL
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
            const response = await fetch(`/api/${messageid}`,
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
            const storyInfo = await response.json();

            const messageID = storyInfo.messageID;

            Router.push(`/${messageID}`);
        } catch(err) {
            console.log('messageid Error: ', err);
        }

        setIsGenerating(false);
    };

    // Displays the story corresponding to the messageID in a text area
    // There should be a copy button on the right side of the textarea
    return (
        <div>
            <Head>
                <title>PlotNotes</title>
            </Head>
            <Header>
                <Box display="flex" justifyContent="flex-start" width="40%">
                    <Header.Item>
                        <Link href="/">
                            <Tooltip aria-label="Home" direction="s" noDelay >
                                <Image src="/images/PlotNotesIcon.png" alt="PlotNotes" height={70} width={90} />
                            </Tooltip>
                        </Link>
                    </Header.Item>
                </Box>
                    <Header.Item>
                        <Heading
                            fontSize={24}
                            fontWeight="bold"
                            color="black">
                            {title}
                        </Heading>
                    </Header.Item>
            </Header>
            <Box
            display="flex"
            flexDirection="column"
            justifyContent="center"
            alignItems="center">
                    {stories.map((story, index) => (
                        <Link key={index} href={`/${messageIDs[index]}`}>
                            <Box
                                display="flex"
                                justifyContent="center"
                                alignItems="center"
                                bg="gray.50"
                                sx={{ paddingBottom: 4 }}>
                                    <Heading
                                        fontSize={24}
                                        fontWeight="bold"
                                        color="black"
                                        sx={{ paddingRight: 5 }}>
                                        {index+1}
                                    </Heading>
                                <Textarea
                                    disabled
                                    fontWeight="bold"
                                    color="black"
                                    cols={90}
                                    rows={20}
                                    value={story}/>
                                <Button
                                    onClick={() => {
                                        navigator.clipboard.writeText(story);
                                    }}>
                                    Copy
                                </Button>
                            </Box>
                        </Link>
                    ))
                    }
                    {/* An area where the user can add onto the existing story underneath all the stories */}
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
    )
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

    const response = await axiosInstance.get(`/api/${messageID}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Cookie': `token=${sessionID}`
                },
            }
        );
        
        const storyInfo = await response.data;
    
        // If the json has an error saying the messageID does not belong to the user, redirect to the home page
        if (storyInfo.error) {
            console.log("storyInfo error:", storyInfo.error);
            return {
                redirect: {
                  permanent: false,
                  destination: `/`,
                },
                props:{ },
              };
        }
        // Stores storyInfo.response as an array of strings
        const title = storyInfo.parentTitle; 
        const stories = storyInfo.stories;
        const messageIDs = storyInfo.messageIDs;

        return { props: { sessionID, stories, title, messageIDs } };
}