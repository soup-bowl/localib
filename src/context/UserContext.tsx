import React, { createContext, useState, ReactNode, FC } from 'react';

interface UserContextProps {
  username: string;
  setUsername: React.Dispatch<React.SetStateAction<string>>;
  password: string;
  setPassword: React.Dispatch<React.SetStateAction<string>>;
}

const UserContext = createContext<UserContextProps | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

const UserProvider: FC<UserProviderProps> = ({ children }) => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  return (
    <UserContext.Provider value={{ username, setUsername, password, setPassword }}>
      {children}
    </UserContext.Provider>
  );
};

export { UserContext, UserProvider };
