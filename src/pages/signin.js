import React, { useState } from 'react';
import { Box, PageLayout, Heading, Header, Button, TextInput, Tooltip } from '@primer/react';
import { GoogleLogin } from '@react-oauth/google'
import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'

export default function signIn() {

    const [password, setPassword] = useState('');
    const [username, setUserName] = useState('');

    const passwordChange = (ev) => {
        setPassword(ev.target.value);
    };

    const usernameChange = (ev) => {
        setUserName(ev.target.value);
    };

    const addUser = async () => {
        // Stores the user's username and password into the database and redirects them to the prompt page
        if (username === '' || password === '') {
            alert('Please enter a username and password');
            return;
        }
        const response = await fetch('/api/sessionCmds', {
            method: 'POST',
            body: JSON.stringify({ username, password, "usedGoogle": false }),
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const cookies = await fetch('/api/session', {
            method: 'POST',
            body: JSON.stringify({ token: `${username} ${password}` }),
            headers: {
                'Content-Type': 'application/json'
            }})
    };

    const addGoogleUser = async (username) => {
        // Stores the user's username and password into the database and redirects them to the prompt page
        const response = await fetch('/api/sessionCmds', {
            method: 'POST',
            body: JSON.stringify({ username, "usedGoogle": true }),
            headers: {
                'Content-Type': 'application/json'
            }
        });
    };

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
        </Header>
            <PageLayout>
                <Box>
                    <Heading fontSize={4} color="blue.4" fontFamily="mono">Sign In</Heading>
                    <TextInput
                        name="username"
                        placeholder="Username"
                        value={username}
                        onChange={usernameChange}
                    />
                    <TextInput
                        name="password"
                        placeholder="Password"
                        value={password}
                        onChange={passwordChange}
                    />
                    <Button type="submit" onClick={addUser}>Sign In</Button>
                </Box>
            </PageLayout>
            <div>
            <GoogleLogin
                onSuccess={async credentialResponse => {
                addGoogleUser(credentialResponse.clientId);
                }}
                onError={() => {
                alert('Error logging in with Google, try again or use the sign up form.');
                }}/>
            </div>
        </div>
    );        
}