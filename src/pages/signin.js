import React, { useState } from 'react';
import { Box, PageLayout, Heading, Header, FormControl, Button, TextInput, Tooltip } from '@primer/react';
import { GoogleLogin } from '@react-oauth/google'
import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'

// import GoogleProvider from 'next-auth/providers/google'

// const providers = [
//     GoogleProvider({
//         clientId: process.env.GOOGLE_CLIENT_ID,
//         clientSecret: process.env.GOOGLE_CLIENT_SECRET
//     })
// ]

// export default async function signIn(req, res) {
//     const auth = await nextAuth(req, res, { providers })
// }

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

    };

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
            <PageLayout>
                <Box>
                    <Heading fontSize={4} color="blue.4" fontFamily="mono">Sign In</Heading>
                    <form onSubmit={handleSubmit}>
                        <FormControl>
                            <FormControl.Label htmlFor="username">Username</FormControl.Label>
                            <TextInput id="username" name="username" type="text" onChange={usernameChange} />
                        </FormControl>
                        <FormControl>
                            <FormControl.Label htmlFor="password">Password</FormControl.Label>
                            <TextInput id="password" name="password" type="password" onChange={passwordChange} />
                        </FormControl>
                        <Button type="submit">Sign In</Button>
                    </form>
                </Box>
            </PageLayout>
            <div>
            <GoogleLogin
                onSuccess={credentialResponse => {
                console.log(credentialResponse);
                }}
                onError={() => {
                console.log('Login Failed');
                }}/>
            </div>
        </div>
    );        
}