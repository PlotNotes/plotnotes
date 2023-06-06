import React, { useState } from 'react';
import { Box, PageLayout, Heading, Header, Textarea, Button, ThemeProvider, Spinner, Tooltip } from '@primer/react';
import Head from 'next/head'
import cookies from 'next-cookies'
import Link from 'next/link'
import loadSession from 'src/pages/api/session'
import Router, { useRouter } from 'next/router'
import axios from 'axios';
import { HomeButton, HeaderItem } from '../index'

export default function Page({ sessionID, chapters, storyNames, messageIDs }) {
    
    const router = useRouter();
    const { messageid } = router.query;

    const [isGenerating, setIsGenerating] = useState(false);
    const [buttonText, setButtonText] = useState('Copy');
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

            Router.push(`/chapters/${messageID}`);

        } catch(err) {
            console.log('messageid Error: ', err);
        }
    };
    
    const handleEdit = async (ev) => {
        ev.preventDefault();

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

            // Redirects the user to a page where they can compare the two stories and choose to accept or deny the new one
            const chapterInfo = await response.json();

            const message = chapterInfo.message;

            Router.push(`/`)

        } catch(err) {
            console.log('messageid Error: ', err);
        }
    };
      
      const ActionButton = ({ buttonText, onClick, isGenerating }) => (
        <Button variant='primary' onClick={onClick} disabled={isGenerating} sx={{ mt: 2, marginLeft: 'auto', marginRight: 'auto' }}>
          <Box sx={{display: "grid", gridTemplateColumns: "1fr 1fr", gridGap: "3px"}}>
            <Box>{buttonText}</Box>
            <Box>
              <Spinner size="small" sx={{marginLeft: "12px", display: isGenerating ? "block" : "none"}} />
            </Box>
          </Box>
        </Button>
      );      

      const ChapterBox = ({ chapter, messageID, buttonText }) => (
        <Box
             display="flex"
             alignContent="center">
          <Link href={`/chapters/${messageID}`}>
            <Box alignItems="center" sx={{ paddingBottom: 3 }}>
              <Box display="flex" flexDirection="row" alignItems="center">
                <Textarea disabled fontWeight="bold" color="black" cols={90} rows={20} value={chapter}/>
              </Box>
            </Box>
          </Link>
          <Button onClick={() => { copyStory(chapter); }}>
            {buttonText}
          </Button>
        </Box>
      );
      

    return (
        <div>
            <Head>
                <title>PlotNotes</title>
            </Head>
            <Header>
                <HomeButton />
                <HeaderItem href="/shortStories" text="Short Stories" />
                <HeaderItem href="/prompt" text="Prompt" />
                <HeaderItem href="/chapters" text="Chapters" />
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
                        <ChapterBox key={messageIDs[index]} chapter={chapter} messageID={messageIDs[index]} buttonText={buttonText} />
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
                                <ActionButton buttonText="Submit" onClick={handleSubmit} isGenerating={isGenerating} />
                                <ActionButton buttonText="Edit" onClick={handleEdit} isGenerating={isGenerating} />
                            </Box>
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
