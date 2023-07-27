import { Button } from '@mantine/core';
import { invoke } from '@tauri-apps/api/tauri';
import { Navigate } from 'react-router-dom';
import useAuth from '../AuthContext';

async function login() {
	invoke('plugin:oauth|do_oauth');
}

export default function Login() {
	const token = useAuth();
	if (token !== '') {
		return <Navigate to={'/home'} />;
	}
	return (
		<>
			<h1>Please log-in</h1>
			<Button onClick={login}>Login</Button>
		</>
	);
}
