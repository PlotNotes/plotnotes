import React, { useState } from 'react';
import { Box, Heading, Header, Textarea, Button, Spinner, Tooltip } from '@primer/react';
import Head from 'next/head'
import Router from 'next/router'
import { LogoutButton } from '../signin';
import { HomeButton, HeaderItem } from '../chapters';
import loadSession from '../api/session';

export default function Prompt({sessionID}) {

    const [prompt, setPrompt] = useState('');
    const [story, setStory] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [buttonText, setButtonText] = useState('Copy');

    const handleChange = (ev) => {
        setPrompt(ev.target.value);
    };

    const handleShortStory = async (ev) => {
        ev.preventDefault();
        setIsGenerating(true);
        try {
            const response = await fetch('/api/jobs',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Cookie': `sessionID=${sessionID}`,
                    },
                    body: JSON.stringify({ prompt:prompt, method: 'shortStory' }),
                }
            );
            
            if (response.status === 401) {
                Router.push(`/signin?from=/prompt`);
                return;
            }

            setIsGenerating(false);
        } catch(err) {
            console.log('Error: ', err);
        }
    };

    const handleChapters = async (ev) => {
        ev.preventDefault();
        setIsGenerating(true);
        try {
            const response = await fetch('/api/jobs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Cookie': `sessionID=${sessionID}`,
                },
                body: JSON.stringify({ prompt: prompt, method: 'chapter' }),
            });

            if (response.status === 401) {
                Router.push(`/signin?from=/prompt`);
                return;
            }
            setIsGenerating(false);
        } catch(err) {
            console.log('Error: ', err);
        }
    };

  const handleClick = async () => {
    setButtonText('Copied');
    // Schedule a function to run after a 3 second delay that changes the button text back to 'Copy'
    const timer = setTimeout(() => {
      setButtonText('Copy');
    }, 3000);

    navigator.clipboard.writeText(story);

    // This return function is called when the component is unmounted, ensuring that the timer is cleared to prevent potential issues
    return () => clearTimeout(timer);
  };

  // Displays a large, centered header prompting the user to type something into a text area below it
  // The text area has placeholder text that reads "Once upon a time...."
  // On the right side of the text area is an area where the results of the users prompt will be displayed
  return (  
    <div>
        <Head>
            <title>PlotNotes - Prompt</title>
        </Head>
        <Header>
            <HomeButton />
            <HeaderItem href="/shortStories" text="Short Stories" />
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
            <Box
                display="flex"
                flexDirection={{ base: 'column', md: 'row' }}
                alignItems={{ base: 'center', md: 'flex-start' }}
                justifyContent="flex-start"
                mt={{ base: 4, md: 4 }}>

                <Box 
                sx={{ marginTop:6, marginRight:6 }} >
                    <Heading fontSize={6} textAlign="center">
                        Write a story about....
                    </Heading>                
                    <Textarea
                        block
                        value={prompt}
                        cols={60}
                        rows={10}
                        onChange={handleChange}
                        onKeyDown={(ev) => {
                            if (ev.key === 'Enter') {
                                handleSubmit(ev);
                            }
                        }}
                    />
                    <Box
                        display="flex"
                        flexDirection="row"
                        justifyContent="center"
                        alignItems="center">
                        <Button 
                            variant='primary' 
                            onClick={handleShortStory} 
                            disabled={isGenerating} 
                            sx={{ mt: 2, marginLeft: 'auto', marginRight: 'auto' }}>
                                <Box>Create Short Story</Box>            
                        </Button>

                        <Button
                            variant='primary'
                            onClick={handleChapters}
                            disabled={isGenerating}
                            sx={{ mt: 2, marginLeft: 'auto', marginRight: 'auto' }}>
                                <Box>Create Chapters</Box>
                        </Button>
                    </Box>
                    <Spinner
                        sx={{
                            display: isGenerating ? 'block' : 'none',
                            marginLeft: 'auto',
                            marginRight: 'auto',
                            mt: 3,
                        }}
                    />
                    <Header 
                        sx={{ marginLeft:5 }}>
                        Use the custom terms page to help create your story!
                    </Header>
                </Box>
                <Box
                    bg="gray.2"
                    p={4}
                    borderRadius={2}
                    mt={{ base: -2, md: 0 }}
                    textAlign="center"
                    display="flex"
                    flexDirection="column"
                    justifyContent="center"
                    alignItems="center">
                 <Box display="flex" flexDirection="row" alignItems="center" mb={2}>
                    <Heading sx={{paddingRight: 5}} fontSize={6} mb={4}>
                        Story
                    </Heading>
                    <Button onClick={handleClick}>
                        {buttonText}
                    </Button>
                </Box>
                <Textarea disabled value={story} cols={70} rows={20} />
                </Box>
            </Box>
        </Box>
    </div>
  );
}

export async function getServerSideProps(ctx) {

    const sessionID = ctx.req.cookies.sessionID;
    console.log('Session ID: ', sessionID);
    const isLoggedIn = await loadSession(sessionID);

    if (!isLoggedIn) {
        return {
            redirect: {
                destination: '/signin?from=/prompt',
                permanent: false,
            },
        };
    }

    return {
        props: {sessionID},
    };
}