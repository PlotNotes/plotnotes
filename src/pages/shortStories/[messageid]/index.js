import React, { useState } from 'react';
import { Box, PageLayout, Heading, Header, Textarea, Button, ThemeProvider, Spinner, Tooltip } from '@primer/react';
import Head from 'next/head'
import cookies from 'next-cookies'
import loadSession from 'src/pages/api/session'
import Router, { useRouter } from 'next/router'
import axios from 'axios';
import { HomeButton, HeaderItem, StoryMap } from '../index'

export default function Page({ sessionID, stories, title, messageIDs }) {

    // Gets the messageID from the URL
    const router = useRouter();
    const { messageid } = router.query;


    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [buttonText, setButtonText] = useState('Copy');
    const [prompt, setPrompt] = useState('');

    const handleChange = (ev) => {
        setPrompt(ev.target.value);
    };

    const handleSubmit = async (ev) => {
        ev.preventDefault();
        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/${messageid}/shortStory`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Cookie': `token=${sessionID}`,
                    },
                    body: JSON.stringify({ messageid: messageid, prompt: prompt }),
                }
            );

            if (response.status === 401) {
                Router.push(`/signin?from=/shortStories/${messageid}`);
                return;
            }

            // Redirect the user to the page of the new story by using the new messageID given from the server
            const storyInfo = await response.json();

            const messageID = storyInfo.messageID;

            Router.push(`/shortStories/${messageID}`);
        } catch(err) {
            console.log('messageid Error: ', err);
        }

        setIsSubmitting(false);
    };

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

    const handleEdit = async (ev) => {
        ev.preventDefault();
        setIsEditing(true);

        try {
            const response = await fetch(`/api/${messageid}/shortStory`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Cookie': `token=${sessionID}`,
                    },
                    body: JSON.stringify({ prompt: prompt }),
                }
            );

            if (response.status === 401) {
                Router.push(`/signin?from=/shortStory/${messageid}`);
                return;
            }

            // Redirects the user to a page where they can compare the two stories and choose to accept or deny the new one
            const chapterInfo = await response.json();

            if (chapterInfo.error) {
                alert(chapterInfo.error);
                return;
            }
            
            // Redirects the user to the page to comapre the two stories
            Router.push(`/shortStories/${messageid}/edit`);

        } catch(err) {
            console.log('messageid Error: ', err);
        }

        setIsEditing(false);
    };

    // Displays the story corresponding to the messageID in a text area
    // There should be a copy button on the right side of the textarea
    return (
        <div>
            <Head>
                <title>PlotNotes - Short Story {title}</title>
            </Head>
            <Header>
                <HomeButton />
                <HeaderItem href="/chapters" text="Chapters" />
                <HeaderItem href="/prompt" text="Prompt" />          
            </Header>
            <Box
            display="flex"
            flexDirection="column"
            justifyContent="center"
            alignItems="center">
                <Heading>
                        {title}
                </Heading>
                    {stories.map((story, index) => (
                        <StoryMap key={messageIDs[index]} story={story} index={index} messageIDs={messageIDs} storyNames={title} />
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
                            <Box
                                display="flex"
                                flexDirection="row">
                                <ActionButton buttonText="Submit" onClick={handleSubmit} trigger={isSubmitting} />
                                <ActionButton buttonText="Edit" onClick={handleEdit} trigger={isEditing} />
                            </Box>
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
          destination: `/signin?from=/shortStories/${messageID}`,
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

    const response = await axiosInstance.get(`/api/${messageID}/shortStory`,
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