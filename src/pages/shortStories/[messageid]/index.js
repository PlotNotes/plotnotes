import React, { useState } from 'react';
import { Box, Heading, Header, Textarea, Button, Spinner, IconButton } from '@primer/react';
import Head from 'next/head'
import Cookies from 'js-cookie'
import Link from 'next/link'
import loadSession from 'src/pages/api/session'
import Router, { useRouter } from 'next/router'
import axios from 'axios';
import { HomeButton, HeaderItem } from '../index'
import { LogoutButton } from '../../signin';
import { TrashIcon } from '@primer/octicons-react';

export default function Page({ sessionID, stories, title, messageIDs }) {
    
    // Gets the messageID from the URL
    const router = useRouter();
    const { messageid } = router.query;


    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
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
                        'Cookie': `sessionID=${sessionID}`,
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
                        'Cookie': `sessionID=${sessionID}`,
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
            alignItems="center">
                <Heading>
                        {title}
                </Heading>
                    {stories.map((story, index) => (
                        <StoryMap key={messageIDs[index]} story={story} index={index} messageID={messageIDs[index]} sessionID={sessionID} />
                    ))
                    }
                    {/* An area where the user can add onto the existing story underneath all the stories */}
                    <Box
                        display="flex"
                        flexDirection="column"
                        alignItems="center">
                            <Heading
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

function StoryMap({story, index, messageID, sessionID}) {
    const [manualEdit, setManualEdit] = useState(false);
    const [editText, setEditText] = useState('Manual Edit');
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
            sx={{ paddingLeft:5 }}>
                <Link href={`/shortStories/${messageID}`}
                    onClick={(ev) => {
                        if (manualEdit) {
                            ev.preventDefault();
                        }
                    }}>
                    <Box
                        display="flex"
                        flexDirection="row"
                        justifyContent="center"
                        alignItems="center"
                        sx={{ paddingBottom: 3 }}>
                        <Textarea
                            disabled={!manualEdit}
                            id={`story-${index}`}
                            name={`story-${index}`}
                            defaultValue={story}
                            aria-label="Story"
                            cols={90}
                            rows={20}
                        />
                    </Box>
                </Link>
                <Box
                    display="flex"
                    flexDirection="column"
                    justifyContent="center">
                        <Button
                            onClick={() => {
                                copyStory(story);
                            }}>
                                {buttonText}
                        </Button>
                        <Button
                            sx={{ marginTop: 4 }}
                            onClick={() => {
                                setManualEdit(!manualEdit);
                                if (!manualEdit) {
                                    setEditText('Save');
                                } else {
                                    setEditText('Manual Edit');
                                    saveEdit(document.getElementById(`story-${index}`).value, sessionID, messageID);
                                }
                            }}>
                                {editText}
                        </Button>
                        <IconButton 
                            icon={TrashIcon}
                            sx={{ marginTop: 4, marginLeft: 2 }}
                            onClick={async () => {
                                deleteStory(messageID, sessionID);
                            }} />
                </Box>
        </Box>
    );
}

async function deleteStory(messageID, sessionID) {
    try {
    
        const response = await fetch(`/api/${messageID}/shortStory`,
            {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Cookie': `sessionID=${sessionID}`,
                },
            }
        );

        if (response.status === 401) {
            Router.push(`/signin?from=/shortStories/${messageID}`);
            return;
        }

        const data = await response.json();

        if (data.response === 'no stories') {
            Router.push(`/shortStories`);
            return;
        }

        Router.push(`/shortStories/${data.messageid}`);
    } catch(err) {
        console.log('messageid Error: ', err);
    }
}

async function saveEdit(story, sessionID, messageID) {
    try {
        const response = await fetch(`/api/shortStoryCmds`,
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',   
                    'Cookie': `sessionID=${sessionID}`,                 
                },
                body: JSON.stringify({ story: story, messageid: messageID }),
            }
        );

        if (response.status === 401) {
            Router.push(`/signin?from=/shortStories/${messageID}`);
            return;
        }

    } catch(err) {
        console.log('messageid Error: ', err);
    }
}

export async function getServerSideProps(ctx) {
    const messageID = await ctx.query.messageid;
    const c = Cookies.get("sessionID");
    const sess = await loadSession(c);

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
                    'Cookie': `sessionID=${sessionID}`
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