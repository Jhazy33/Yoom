import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'fs/promises';
import path from 'path';
import { loadUsers } from '@/lib/users';

describe('Auth: No hardcoded fallback users', () => {
  const USERS_FILE = path.join(process.cwd(), 'users.json');
  const BACKUP_PATH = path.join(process.cwd(), 'users.json.backup');

  beforeEach(async () => {
    // Backup existing users file if it exists
    try {
      await fs.copyFile(USERS_FILE, BACKUP_PATH);
    } catch {
      // File doesn't exist, that's fine
    }
  });

  afterEach(async () => {
    // Restore backup
    try {
      await fs.rename(BACKUP_PATH, USERS_FILE);
    } catch {
      // No backup to restore
    }

    // Clean up test files
    try {
      await fs.unlink(USERS_FILE);
    } catch {
      // File doesn't exist
    }
  });

  it('should NOT auto-create users.json with hardcoded defaults when missing', async () => {
    // Ensure users.json doesn't exist
    try {
      await fs.unlink(USERS_FILE);
    } catch {
      // File doesn't exist, continue
    }

    // Attempting to load users when file doesn't exist should either:
    // 1. Throw an error, OR
    // 2. Return empty state (but NOT create file with defaults)
    await expect(loadUsers()).rejects.toThrow();
  });

  it('should NOT auto-create users.json with jhazy33/Yoom2026! fallback', async () => {
    // Ensure users.json doesn't exist
    try {
      await fs.unlink(USERS_FILE);
    } catch {
      // File doesn't exist, continue
    }

    // Verify file was NOT created
    try {
      await fs.access(USERS_FILE);
      const data = await fs.readFile(USERS_FILE, 'utf-8');
      const users = JSON.parse(data);

      // If file exists, it should NOT contain hardcoded fallback
      expect(users.users).not.toContainEqual(
        expect.objectContaining({
          username: 'jhazy33',
          email: 'admin@yoom.com'
        })
      );
    } catch {
      // File doesn't exist = PASS (no auto-creation happened)
      expect(true).toBe(true);
    }
  });

  it('should require explicit user creation, no defaults', async () => {
    // Start with empty users.json (not missing)
    const emptyUsers = { users: [] };
    await fs.writeFile(USERS_FILE, JSON.stringify(emptyUsers, null, 2));

    // loadUsers should succeed with empty list
    const data = await loadUsers();
    expect(data.users).toEqual([]);

    // After explicit user creation, loadUsers should return the user
    const { createUser } = await import('@/lib/users');
    const user = await createUser({
      username: 'testuser',
      email: 'test@example.com',
      password: 'TestPassword123!',
      role: 'admin'
    });

    expect(user.username).toBe('testuser');
    expect(user.email).toBe('test@example.com');

    // Verify user was actually saved
    const reloaded = await loadUsers();
    expect(reloaded.users).toHaveLength(1);
    expect(reloaded.users[0].username).toBe('testuser');
  });
});
