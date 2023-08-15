import { Button, Flex, Text, Title, createStyles } from '@mantine/core';
import { invoke } from '@tauri-apps/api/tauri';
import { Navigate } from 'react-router-dom';
import useAuth from '../AuthContext';

async function login() {
	invoke('plugin:oauth|do_oauth');
}

export default function Login() {
	const { classes } = useStyles();

	const token = useAuth();
	if (localStorage.getItem('oauth_token') || token !== '') {
		return <Navigate to={'/home'} />;
	}

	return (
		<Flex className={classes.root}>
			<Flex className={classes.leftContent}>
				<Flex gap="xs" className={classes.logoContainer}>
					<img src="/logo.svg" height={44} width={44} />
					<Title order={1} size="h2" color="white">
						LootHound
					</Title>
				</Flex>
				<Flex className={classes.loginCTA}>
					<Text size="xl" mb={12}>
						Log-in with your Path of Exile account in order to get started!
					</Text>
					<Button className={classes.loginButton} onClick={login}>
						Login
					</Button>
				</Flex>
				<div>
					<Text size="xs" mb={12}>
						This product isn&apos;t affiliated with or endorsed by Grinding Gear Games in any way.
					</Text>
				</div>
			</Flex>
			<Flex className={classes.rightImageContainer}>
				<div className={classes.overlay} />
				{/* <img className={classes.rightImage} src="/poe-322.jpeg" /> */}
				<video loop autoPlay muted className={classes.video}>
					<source src={'/poevideo.mp4'} type="video/mp4" />
				</video>
			</Flex>
		</Flex>
	);
}

const useStyles = createStyles((theme) => ({
	root: {
		position: 'relative',
		background: 'black',
	},
	rightImageContainer: {
		display: 'flex',
		flex: 2,
		position: 'relative',
		height: '100vh',
	},
	video: {
		position: 'absolute',
		top: 0,
		left: 0,
		width: '100%',
		height: '100%',
		objectFit: 'cover',
		boxShadow: '-60px',
	},
	overlay: {
		background: theme.fn.linearGradient(
			90,
			'black',
			'transparent',
			'transparent',
			'transparent',
			'transparent'
		),
		position: 'absolute',
		top: 0,
		left: '-20px',
		width: '100%',
		height: '100%',
		zIndex: 100,
	},
	leftContent: {
		flex: 1,
		flexDirection: 'column',
		justifyContent: 'space-between',
		alignItems: 'center',
		width: '40%',
		padding: '0 64px',
		textAlign: 'center',
	},
	logoContainer: {
		padding: '12px 0',
	},
	loginCTA: {
		flexDirection: 'column',
	},
	loginButton: {
		padding: '0 64px',
		alignSelf: 'center',
	},
}));
