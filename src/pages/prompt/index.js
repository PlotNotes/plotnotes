import React, { useState } from 'react';
import { Box, PageLayout, Heading, Textarea, Button, ThemeProvider, theme } from '@primer/react';
import deepmerge from 'deepmerge';
import Head from 'next/head'
import Link from 'next/link'

// Create a custom theme that includes the primer theme
const myTheme = deepmerge(theme, {
  fonts: {
    normal: 'Roboto, sans-serif',
  },
  colors: {
    text: '#333333',
  },
});

export default function Prompt() {
  const [prompt, setPrompt] = useState('');
  const [story, setStory] = useState('');

  const handleChange = (ev) => {
    console.log('Inside handleChange');
    setPrompt(ev.target.value);
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    console.log('Value submitted:', prompt);

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
                justifyContent="center"
                mt={{ base: 0, md: 4 }}
            >
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
                <Heading fontSize={6} mb={4}>
                    Story
                </Heading>
                <Textarea disabled value={story} cols={60} rows={10} />
                </Box>
            </Box>
            <Box display="flex" justifyContent="center" mt={4}>
                <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                <Link href="/">Home</Link>
                </button>
            </Box>
        </Box>
    </div>
  );
}
