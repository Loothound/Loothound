import { Button, ButtonGroup } from '@chakra-ui/react';
import { invoke } from '@tauri-apps/api/tauri';
import { Navigate } from 'react-router-dom';
import useAuth from '../AuthContext';

async function login() {
  invoke('do_oauth');
}

export default function Login() {
  const token = useAuth();
  if (token !== '') {
    return <Navigate to={'/home'} />;
  }
  return (
    <>
      <h1>Please log-in</h1>
      <ButtonGroup>
        <Button onClick={login}>Login</Button>
      </ButtonGroup>
    </>
  );
}
