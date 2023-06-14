import React, { useState } from 'react';
import { Box, Heading, Header, Textarea, Button, Spinner, IconButton } from '@primer/react';
import Head from 'next/head'
import cookies from 'next-cookies'
import loadSession from 'src/pages/api/session'
import Router, { useRouter } from 'next/router'
import Link from 'next/link'
import axios from 'axios';
import { HomeButton, HeaderItem } from '../index'
import { LogoutButton } from '../../signin';
import { TrashIcon } from '@primer/octicons-react'

export default function Page({ sessionID, chapters, storyNames, messageIDs }) {    
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

            if (response.status === 401) {
                Router.push(`/signin?from=/chapters/${messageid}`);  
                return;           
            }

            // Redirect the user to the page of the new story by using the new messageID given from the server
            const chapterInfo = await response.json();

            const messageID = chapterInfo.messageid;

            Router.push(`/chapters/${messageID}`);

        } catch(err) {
            console.log('messageid Error: ', err);
        }

        setIsSubmitting(false);
    };
    
    const handleEdit = async (ev) => {
        ev.preventDefault();
        setIsEditing(true);

        try {
            const response = await fetch(`/api/${messageid}/chapters`,
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
                Router.push(`/signin?from=/chapters/${messageid}`);
                return;
            }

            // Redirects the user to a page where they can compare the two stories and choose to accept or deny the new one
            const chapterInfo = await response.json();

            if (chapterInfo.error) {
                alert(chapterInfo.error);
                return;
            }
            
            // Redirects the user to the page to comapre the two stories
            Router.push(`/chapters/${messageid}/edit`);

        } catch(err) {
            console.log('messageid Error: ', err);
        }

        setIsEditing(false);
    };

    const ActionButton = ({ buttonText, onClick, isGenerating }) => (
    <Button variant='primary' onClick={onClick} disabled={isGenerating} sx={{ mt: 2, marginRight: 4 }}>
        <Box sx={{display: "grid", gridTemplateColumns: "1fr 1fr"}}>
        <Box>{buttonText}</Box>
        <Box>
            <Spinner size="small" sx={{marginLeft: "12px", display: isGenerating ? "block" : "none"}} />
        </Box>
        </Box>
    </Button>
    );  

    return (
        <div>
            <Head>
                <title>PlotNotes - Chapters {storyNames[0]}</title>
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
                alignItems="center">
                    <Heading
                        fontSize={24}
                        fontWeight="bold"
                        color="black"
                        sx={{ paddingTop: 4 }}>
                        {storyNames[0]}
                    </Heading>
                    
                    {/* Creates a map for all provided chapters. There should be a copy button on the right side of each textarea */}
                    { chapters.map((chapter, index) => (                        
                        <ChapterMap key={messageIDs[index]} chapter={chapter} messageIDs={messageIDs} index={index} sessionID={sessionID} />
                    ))}
                    {/* Textarea at the bottom to allow the user to add onto the existing story */}
                   <Box
                        display="flex"
                        flexDirection="column"
                        alignItems="center">
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
                                flexDirection="row"
                                alignItems="center"
                                sx={{ paddingBottom: 6 }}>
                                <ActionButton buttonText="Submit" onClick={handleSubmit} isGenerating={isSubmitting} />
                                <ActionButton buttonText="Edit" onClick={handleEdit} isGenerating={isEditing} />
                            </Box>
                    </Box>
            </Box>
        </div>
    );
}

function ChapterMap({ chapter, messageIDs, index, sessionID }) {

    const [editText, setEditText] = useState("Edit");
    const [buttonText, setButtonText] = useState('Copy');
    const [manualEdit, setManualEdit] = useState(false);

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
            alignItems="center"
            sx={{ paddingLeft:5 }}>
                <Link href={`/shortStories/${messageIDs[index]}`}
                onClick={
                    (ev) => {
                        if (manualEdit) {
                            ev.preventDefault();
                        }
                    }}>
                    <Box
                        display="flex"
                        flexDirection="row"
                        alignItems="center"
                        sx={{ paddingBottom: 3 }}>
                        <Textarea
                            disabled={!manualEdit}
                            id={`story-${index}`}
                            name={`story-${index}`}
                            defaultValue={chapter.replace('"', '')}
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
                            copyStory(chapter);
                        }}>
                            {buttonText}
                    </Button>
                    <Button
                    sx={{ marginTop:4 }}
                    onClick={ () => {
                        setManualEdit(!manualEdit);

                        if (!manualEdit) {
                            setEditText("Save");
                        } else {
                            setEditText("Edit");
                            saveEdit(document.getElementById(`story-${index}`).value, sessionID, messageIDs[index]);
                        }
                    }}>
                            {editText}
                    </Button>
                    <IconButton
                        icon={TrashIcon}
                        sx={{ marginTop:4 }}
                        onClick={async () => {
                            deleteChapter(sessionID, messageIDs[index]);
                        }} />
                </Box>
        </Box>
    );
}

async function deleteChapter(sessionID, messageid) {
    try {

        const response = await fetch(`/api/${messageid}/chapters`,
            {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Cookie': `token=${sessionID}`,
                },
            }
        );

        if (response.status === 401) {
            Router.push(`/signin?from=/chapters/${messageid}`);
            return;
        }

        const data = await response.json();

        if (data.response === 'no chapters') {
            Router.push(`/chapters`);
            return;
        }

        const newMessageID = data.messageid;

        Router.push(`/chapters/${newMessageID}`);
    } catch(err) {
        console.log('messageid Error: ', err);
    }
}

async function saveEdit(story, sessionID, messageid) {    
    try {
        const response = await fetch(`/api/chapterCmds`,
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Cookie': `token=${sessionID}`,
                },
                body: JSON.stringify({ messageid: messageid, story: story }),
            }
            );

        if (response.status === 401) {
            Router.push(`/signin?from=/chapters/${messageid}`);
            return;
        }
    } catch(err) {
        console.log('messageid Error: ', err);
    }
}

function getAxios() {
    const baseURL = process.env.NODE_ENV === 'production' 
    ? 'https://plotnotes.ai' 
    : 'http://localhost:3000';

    const axiosInstance = axios.create({
    baseURL: baseURL
    });

    return axiosInstance;
}

export async function getServerSideProps(ctx) {
    const messageID = await ctx.query.messageid;
    const c = cookies(ctx);
    const sess = await loadSession(c.token);

    if (!sess) {
      return {
        redirect: {
          permanent: false,
          destination: `/signin?from=/chapters/${messageID}`,
        },
        props:{ },
      };
    }
    let sessionID = sess.rows[0].id;   

    const axiosInstance = getAxios();

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
