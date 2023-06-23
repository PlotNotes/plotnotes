import React, { useState } from 'react';
import { Box, PageLayout, Heading, Header, Button, TextInput, Tooltip } from '@primer/react';
import { GoogleLogin } from '@react-oauth/google'
import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import {useRouter} from 'next/router'
import * as jwt from 'jsonwebtoken'
import Cookies from 'js-cookie'
import axios from 'axios';

export default function SignIn() {
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

        const data = await response.json();
        console.log('data: ', data);
        if (data.includes('error')) {
            const error = JSON.parse(data);
            alert(error.error);
            return;
        }

        const sessionID = data.sessionId;
        Cookies.set('sessionID', sessionID);

        if (router.query.from !== undefined) 
            router.push(router.query.from) 
        else
            router.push('/?loggedIn=true')
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
        const data = await response.json();

        const sessionID = data.sessionId;
        Cookies.set('sessionID', sessionID);

        if (router.query.from !== undefined)
            router.push(router.query.from)
        else 
            router.push('/?loggedIn=true')
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
        else
            router.push('/?loggedIn=true')
    };

    return (
        <div>
            <Head>
            <title>PlotNotes - Signin</title>
        </Head>
        <Header>
            <Header.Item>
                <Link href="/">
                    <Tooltip aria-label="Home" direction="s" noDelay >
                        <Image src="/images/PlotNotesIcon.png" alt="PlotNotes" height={70} width={90} />
                    </Tooltip>
                </Link>
            </Header.Item> 
            <Header.Item full />           
            <LogoutButton />
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
            <PageLayout>
                <Box>
                    <GoogleLogin
                        onSuccess={async credentialResponse => {
                            const token = jwt.decode(credentialResponse.credential);
                            addGoogleUser(token.email);
                        }}
                        onError={() => {
                        alert('Error logging in with Google, try again or use the sign up form.');
                    }}/>
                </Box>
            </PageLayout>
            {/* A short area to tell the user what loggin in with google entails */}
            <PageLayout>
                <Box>
                    <Heading fontSize={4} color="blue.4" fontFamily="mono">Google Login</Heading>
                    <p>
                        Logging in with Google will allow PlotNotes to access your email address. This is used to identify you and allow you to log in with Google in the future.
                        The only thing PlotNotes will do with your email address is use it to identify you. PlotNotes will not send you any emails, or share your email address 
                        with anyone.
                    </p>
                </Box>
            </PageLayout>
        </div>
    );        
}

export function LogoutButton() {
    const router = useRouter();
    return (
            <Header.Item>
                <Button variant='primary'
                    onClick={async () => {
                        await fetch('/api/sessionCmds', {
                            method: 'DELETE',
                            headers: {
                                'Content-Type': 'application/json',
                                'Cookie': `sessionID=${Cookies.get('sessionID')}`
                            }
                        });
                        Cookies.remove('sessionID');
                        router.push('/?loggedIn=false');
                    }}>
                    Logout
                </Button>
            </Header.Item>
    );
}

export async function getServerSideProps(ctx) {
    // Loads the jobs api route so it connects the client and server until the session expires

    const baseURL = process.env.NODE_ENV === 'production' 
    ? 'https://plotnotes.ai' 
    : 'http://localhost:3000';

    const axiosInstance = axios.create({
    baseURL: baseURL
    });

    await axiosInstance.get('/api/jobs', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    });

    return {props: {}};
}