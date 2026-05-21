import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { getUserById } from '@/lib/users';
import { loadUsers, saveUsers, createUser as createUserUtil, hashPassword } from '@/lib/users';

// GET /api/users - List all users (admin only)
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);

    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUserById(payload.userId);

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    const { users } = await loadUsers();

    // Return users without password hashes
    const safeUsers = users.map(({ passwordHash, ...u }) => u);

    return NextResponse.json({ users: safeUsers });
  } catch (error) {
    console.error('Error listing users:', error);
    return NextResponse.json({ error: 'Failed to list users' }, { status: 500 });
  }
}

// POST /api/users - Create new user (admin only)
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);

    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUserById(payload.userId);

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    const body = await request.json();
    const { username, email, password, role = 'user', allowedFolders = [] } = body;

    if (!username || !email || !password) {
      return NextResponse.json(
        { error: 'Username, email, and password are required' },
        { status: 400 }
      );
    }

    if (!['admin', 'user'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const newUser = await createUserUtil({
      username,
      email,
      password,
      role,
      allowedFolders
    });

    // Return user without password hash
    const { passwordHash, ...safeUser } = newUser;

    return NextResponse.json({ user: safeUser }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);

    if (error instanceof Error && error.message === 'Username or email already exists') {
      return NextResponse.json({ error: 'Username or email already exists' }, { status: 409 });
    }

    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
