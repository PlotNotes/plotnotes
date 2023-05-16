import React, { useState } from 'react';
import { Box, PageLayout, Heading, Header, Button, TextInput, Tooltip } from '@primer/react';
import { GoogleLogin } from '@react-oauth/google'
import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import {useRouter} from 'next/router'

export default function signIn() {
    const router = useRouter()
    const [signUpPassword, setSignUpPassword] = useState('');
    const [signUpUsername, setSignUpUserName] = useState('');

    const [loginPassword, setLoginPassword] = useState('');
    const [loginUsername, setLoginUserName] = useState('');

    const passwordChange = (ev) => {
        if (ev.target.name.includes('signUp')) {
            setSignUpPassword(ev.target.value);
        }
        else
            setLoginPassword(ev.target.value);
    };

    const usernameChange = (ev) => {
        if (ev.target.name.includes('signUp'))
            setSignUpUserName(ev.target.value);
        else
            setLoginUserName(ev.target.value);
    };

    const addUser = async (ev) => {
        ev.preventDefault();

        // Stores the user's username and password into the database and redirects them to the prompt page
        if (signUpUsername === '' || signUpPassword === '') {
            alert('Please enter a username, and password');
            return;
        }
        const response = await fetch('/api/sessionCmds', {
            method: 'POST',
            body: JSON.stringify({ username: signUpUsername, password: signUpPassword, "usedGoogle": false }),
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.text();
        if (data.includes('error')) {
            const error = JSON.parse(data);
            alert(error.error);
            return;
        }

        if (router.query.from !== undefined) 
            router.push(router.query.from) 
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

        if (router.query.from !== undefined)
            router.push(router.query.from)
    };

    const logUserIn = async (ev) => {
        ev.preventDefault();

        if (loginUsername === '') {
            alert('Please enter a username');
            return;
        }
        if (loginPassword === '') {
            alert('Please enter a password');
            return;
        }

        const response = await fetch('/api/sessionCmds', {
            method: 'PUT',
            body: JSON.stringify({ username: loginUsername, password: loginPassword, "usedGoogle": false }),
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (data.error === 'user does not exist' || data.error === 'password does not match') {
            alert('Username or password is incorrect');
            return;
        }

        if (router.query.from !== undefined)
            router.push(router.query.from)

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
                    <Heading fontSize={4} color="blue.4" fontFamily="mono">Sign Up</Heading>
        
                    <TextInput
                        name="signUpUsername"
                        placeholder="Username"
                        value={signUpUsername}
                        onChange={usernameChange}
                    />
                    <TextInput
                        type="password"
                        name="signUpPassword"
                        placeholder="Password"
                        value={signUpPassword}
                        onChange={passwordChange}
                    />
                    <Button type="submit" onClick={addUser}>Sign Up</Button>
                </Box>
            </PageLayout>
            {/* Adds a section for existing users to log in */}
            <PageLayout>
                <Box>
                    <Heading fontSize={4} color="blue.4" fontFamily="mono">Login</Heading>
                    <TextInput
                        name="loginUsername"
                        placeholder="Username"
                        value={loginUsername}
                        onChange={usernameChange}
                    />
                    <TextInput
                        type="password"
                        name="loginPassword"
                        placeholder="Password"
                        value={loginPassword}
                        onChange={passwordChange}
                    />
                    <Button type="submit" onClick={logUserIn}>Login</Button>
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