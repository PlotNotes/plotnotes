import React, { useState } from 'react';
import { Box, PageLayout, Heading, Header, Textarea, Button, ThemeProvider, theme, Tooltip } from '@primer/react';
import deepmerge from 'deepmerge';
import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import cookies from 'next-cookies'
import loadSession from 'src/pages/api/session'

export default function Prompt({ previousPrompts }) {
  const [prompt, setPrompt] = useState('');
  const [story, setStory] = useState('');

  const handleChange = (ev) => {
    setPrompt(ev.target.value);
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
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
        let newStory = await response.json();
        newStory = newStory.response.split('response: ')[0];
        setStory(newStory);
    } catch(err) {
        console.log('Error: ', err);
    }
  };

  // Displays a large, centered header prompting the user to type something into a text area below it
  // The text area has placeholder text that reads "Once upon a time...."
  // On the right side of the text area is an area where the results of the users prompt will be displayed
  return (  
    <div>
        <Head>
            <title>PlotNotes</title>
            <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
        </Head>
        <Header>
            <Header.Item>
                <Link href="/">
                    <Tooltip aria-label="Home" direction="e" noDelay >
                        <Image src="/images/PlotNotesIcon.png" alt="PlotNotes" height={70} width={90} />
                    </Tooltip>
                </Link>
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

                <Box bg="gray.2" p={4} borderRadius={2} mr={{ md: 6 }}>
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
                <Button type="submit" onClick={handleSubmit}>
                    Submit
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
                    <Button onClick={() => navigator.clipboard.writeText(story)} >
                        Copy
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

    const previousPrompts = [] // await getUserPrompts(sess.user_id);
    return { props: { previousPrompts } };
}