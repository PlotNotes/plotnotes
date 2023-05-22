import React, { useState } from 'react';
import { Box, PageLayout, Heading, Header, Textarea, Button, ThemeProvider, Spinner, Tooltip } from '@primer/react';
import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import cookies from 'next-cookies'
import loadSession from 'src/pages/api/session'
import Router, { useRouter } from 'next/router'

export default function Page({ sessionID, stories, title }) {
    // Displays the story corresponding to the messageID in a text area
    // There should be a copy button on the right side of the textarea
    return (
        <div>
            <Head>
                <title>PlotNotes</title>
            </Head>
            <Header>
                <Box display="flex" justifyContent="flex-start" width="42%">
                    <Header.Item>
                        <Link href="/">
                            <Tooltip aria-label="Home" direction="e" noDelay >
                                <Image src="/images/PlotNotesIcon.png" alt="PlotNotes" height={70} width={90} />
                            </Tooltip>
                        </Link>
                    </Header.Item>
                </Box>
                <Box display="flex" justifyContent="center">
                    <Header.Item>
                        <Heading
                            fontSize={24}
                            fontWeight="bold"
                            color="black">
                            {title}
                        </Heading>
                    </Header.Item>
                </Box>
            </Header>
            <Box
            display="flex"
            flexDirection="column"
            justifyContent="center"
            alignItems="center">
                    {stories.map((story, index) => (
                        <Box
                            key={index}
                            display="flex"
                            justifyContent="center"
                            alignItems="center"
                            bg="gray.50">
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
                        </Box>
                    ))
                    }
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
    const response = await fetch(`http://localhost:3000/api/${messageID}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Cookie': `token=${sessionID}`
                },
            }
        );
        
        const storyInfo = await response.json();

        // If the json has an error saying the messageID does not belong to the user, redirect to the home page
        if (storyInfo.error) {
            Router.push('/');
        }
        // Stores storyInfo.response as an array of strings
        const parentStory = storyInfo.parentStory
        const childStories = storyInfo.childStories
        const title = storyInfo.parentTitle.title

        const stories = [parentStory, ...childStories];

        return { props: { sessionID, stories, title } };
}