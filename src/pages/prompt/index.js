import React, { useState } from 'react';
import { Box, PageLayout, Heading, Header, Textarea, Button, ThemeProvider, Spinner, Tooltip } from '@primer/react';
import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import cookies from 'next-cookies'
import loadSession from 'src/pages/api/session'


export default function Prompt({ sessionID }) {
  const [prompt, setPrompt] = useState('');
  const [story, setStory] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [buttonText, setButtonText] = useState('Copy');

  const handleChange = (ev) => {
    setPrompt(ev.target.value);
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setIsGenerating(true);
    try {
        const response = await fetch('/api/prompt',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt:prompt }),
            }
        );
        const storyInfo = await response.json();        
        let newStory = storyInfo.story.split('response: ')[0];
        let storyName = storyInfo.storyName.split('response: ')[0];
        setStory(newStory);
        
        await fetch('/api/storyCmds',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ sessionId: sessionID, 
                                       story: newStory, 
                                       storyName: storyName, 
                                       prompt: prompt, 
                                       iterationId: 0 }),
            }
        );
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
            <title>PlotNotes</title>
        </Head>
        <Header>
            <Header.Item>
                <Link href="/">
                    <Tooltip aria-label="Home" direction="e" noDelay >
                        <Image src="/images/PlotNotesIcon.png" alt="PlotNotes" height={70} width={90} />
                    </Tooltip>
                </Link>
            </Header.Item>
            <Header.Item>
                <Tooltip aria-label="History" direction="e" noDelay >
                    <Link href="/history">
                        <Image src="/images/history.png" alt="History" height={70} width={90} />
                    </Link>
                </Tooltip>
            </Header.Item>
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

                <Box bg="gray.2" p={4} borderRadius={2} mr={{ md: 6 }} >
                    <Heading fontSize={6} textAlign="center">
                        Write a story about....
                    </Heading>                
                    <Textarea
                        block
                        value={prompt}
                        onChange={handleChange}
                        onKeyDown={(ev) => {
                            if (ev.key === 'Enter') {
                                handleSubmit(ev);
                            }
                        }}
                    />
                    <Button variant='primary' onClick={handleSubmit} disabled={isGenerating} sx={{ mt: 2, marginLeft: 'auto', marginRight: 'auto' }}>
                        <Box sx={{display: "grid", gridTemplateColumns: "1fr 1fr", gridGap: "3px"}}>
                            <Box>Submit</Box>
                                <Box>
                                    <Spinner size="small" sx={{marginLeft: "12px", display: isGenerating ? "block" : "none"}} />
                                </Box>
                        </Box>
                    </Button>
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
                <Textarea disabled value={story} cols={60} rows={10} />
                </Box>
            </Box>
        </Box>
    </div>
  );
}

export async function getServerSideProps(ctx) {
    const c = cookies(ctx);
    const sess = await loadSession(c.token);

    if (!sess) {
      return {
        redirect: {
          permanent: false,
          destination: "/signin?from=/prompt",
        },
        props:{ },
      };
    }
    let sessionID = sess.rows[0].id;

    return { props: { sessionID } };
}