import React, { useState } from 'react';
import { Box, PageLayout, Heading, Textarea, Button, ThemeProvider, theme } from '@primer/react';
import deepmerge from 'deepmerge';
import { stringify } from 'querystring';

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
        const response = await fetch('/api/hello',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt:prompt }),
            }
        );     
        let newStory = await response.json();
        console.log('Story type: ', typeof newStory);
        console.log('Response: ', newStory);        
    } catch(err) {
        console.log('Error: ', err);
    }
  };

  // Displays a large, centered header prompting the user to type something into a text area below it
  // The text area has placeholder text that reads "Once upon a time...."
  // On the right side of the text area is an area where the results of the users prompt will be displayed
  return (
    <ThemeProvider theme={myTheme}>
      <PageLayout>
        <Box bg="gray.2" p={6} borderRadius={2}>
          <Heading fontSize={6} textAlign="center">
            Write a prompt for a story
          </Heading>
            <form onSubmit={handleSubmit}>
                <Textarea
                    block
                    value={prompt}
                    placeholder="Once upon a time..."
                    onChange={handleChange}
                    onKeyDown={(ev) => {
                        if (ev.key === 'Enter') {
                            handleSubmit(ev);
                        }
                    }}
                />
                <Button type='submit'>
                    Submit
                </Button>
            </form>      
            <Box bg="gray.1" p={6} borderRadius={2}>
                <Heading fontSize={6} textAlign="center">
                    Story
                </Heading>
                <Box bg="white" p={6} borderRadius={2}>
                    <Heading fontSize={6} textAlign="center">
                        {/* {story ? story : 'No story yet'} */}
                    </Heading>
                </Box>
            </Box>
        </Box>        
      </PageLayout>
    </ThemeProvider>
  );
}
