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

    const handleSubmit = async (ev) => {
        ev.preventDefault();
        // Stores the user's username and password into the database and redirects them to the prompt page
        console.log('Value submitted:', username, password);
        addUser();
    };

    const addUser = async () => {
        // Stores the user's username and password into the database and redirects them to the prompt page
        console.log('Value submitted:', username, password);
        const response = await fetch('/api/queries', {
            method: 'POST',
            body: JSON.stringify({ username, password, "usedGoogle": false }),
            headers: {
                'Content-Type': 'application/json'
            }
        });
        console.log(JSON.stringify({ username, password, "usedGoogle": false }));
    };

    const addGoogleUser = async (username) => {
        // Stores the user's username and password into the database and redirects them to the prompt page
        console.log('Value submitted:', username, password);
        const response = await fetch('/api/queries', {
            method: 'POST',
            body: JSON.stringify({ username, password, "usedGoogle": true }),
            headers: {
                'Content-Type': 'application/json'
            }
        });
        console.log(JSON.stringify({ username, password, "usedGoogle": true }));
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
                    <form onSubmit={handleSubmit}>
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
                        <Button type="submit">Sign In</Button>
                    </form>
                </Box>
            </PageLayout>
            <div>
            <GoogleLogin
                onSuccess={async credentialResponse => {
                console.log(credentialResponse.clientId);
                addGoogleUser(credentialResponse.clientId);
                }}
                onError={() => {
                console.log('Login Failed');
                }}/>
            </div>
        </div>
    );        
}