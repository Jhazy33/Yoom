import fs from 'fs/promises';
import path from 'path';
import bcrypt from 'bcryptjs';

export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  role: 'admin' | 'user';
  createdAt: string;
  allowedFolders?: string[];
}

const USERS_FILE = path.join(process.cwd(), 'users.json');

async function ensureUsersFile() {
  try {
    await fs.access(USERS_FILE);
  } catch {
    const initialUsers = {
      users: [{
        id: '1',
        username: 'jhazy33',
        email: 'admin@yoom.com',
        passwordHash: await bcrypt.hash('Yoom2026!', 12),
        role: 'admin' as const,
        allowedFolders: ['*'],
        createdAt: new Date().toISOString()
      }]
    };
    await fs.writeFile(USERS_FILE, JSON.stringify(initialUsers, null, 2));
  }
}

export async function loadUsers(): Promise<{ users: User[] }> {
  await ensureUsersFile();
  const data = await fs.readFile(USERS_FILE, 'utf-8');
  return JSON.parse(data);
}

export async function saveUsers(users: User[]): Promise<void> {
  await fs.writeFile(USERS_FILE, JSON.stringify({ users }, null, 2));
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function getUserByUsername(username: string): Promise<User | null> {
  const { users } = await loadUsers();
  return users.find(u => u.username === username) || null;
}

export async function getUserById(id: string): Promise<User | null> {
  const { users } = await loadUsers();
  return users.find(u => u.id === id) || null;
}

export async function createUser(userData: Omit<User, 'id' | 'createdAt' | 'passwordHash'> & { password: string }): Promise<User> {
  const { users } = await loadUsers();

  if (users.some(u => u.username === userData.username || u.email === userData.email)) {
    throw new Error('Username or email already exists');
  }

  const newUser: User = {
    id: Date.now().toString(),
    passwordHash: await hashPassword(userData.password),
    createdAt: new Date().toISOString(),
    ...userData
  };

  users.push(newUser);
  await saveUsers(users);

  return newUser;
}

export async function updateUser(id: string, updates: Partial<Omit<User, 'id' | 'createdAt' | 'passwordHash'>> & { password?: string }): Promise<User | null> {
  const { users } = await loadUsers();
  const index = users.findIndex(u => u.id === id);

  if (index === -1) return null;

  const updatedUser = { ...users[index] };

  if (updates.password) {
    updatedUser.passwordHash = await hashPassword(updates.password);
    delete (updates as any).password;
  }

  Object.assign(updatedUser, updates);

  users[index] = updatedUser;
  await saveUsers(users);

  return users[index];
}

export async function deleteUser(id: string): Promise<boolean> {
  const { users } = await loadUsers();
  const filtered = users.filter(u => u.id !== id);

  if (filtered.length === users.length) return false;

  await saveUsers(filtered);
  return true;
}
