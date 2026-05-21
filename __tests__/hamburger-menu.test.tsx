/**
 * TDD Test: Hamburger Menu Functionality
 *
 * RED Phase: These tests document expected behavior
 * They should FAIL initially, proving the bug exists
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Sidebar, HamburgerButton } from '@/components/sidebar';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/',
}));

// Mock AuthProvider
jest.mock('@/components/auth-provider', () => ({
  useAuth: () => ({
    logout: jest.fn(),
    user: { email: 'test@example.com' },
  }),
}));

describe('HamburgerButton', () => {
  it('should be renderable without crashing', () => {
    const onClick = jest.fn();
    render(<HamburgerButton onClick={onClick} />);
    // Basic smoke test
  });

  it('should call onClick handler when clicked', async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();

    render(<HamburgerButton onClick={onClick} />);

    const button = screen.getByRole('button', { name: /open navigation menu/i });
    await user.click(button);

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe('Sidebar', () => {
  it('should be hidden when isOpen is false', () => {
    const onClose = jest.fn();
    render(<Sidebar isOpen={false} onClose={onClose} />);

    // Sidebar should have translate-x-full when closed
    const sidebar = document.querySelector('[aria-label="Navigation sidebar"]');
    expect(sidebar).toHaveClass('-translate-x-full');
    expect(sidebar).not.toHaveClass('translate-x-0');
  });

  it('should be visible when isOpen is true', () => {
    const onClose = jest.fn();
    render(<Sidebar isOpen={true} onClose={onClose} />);

    // Sidebar should have translate-x-0 when open
    const sidebar = document.querySelector('[aria-label="Navigation sidebar"]');
    expect(sidebar).toHaveClass('translate-x-0');
    expect(sidebar).not.toHaveClass('-translate-x-full');
  });

  it('should call onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();

    render(<Sidebar isOpen={true} onClose={onClose} />);

    const closeButton = screen.getByRole('button', { name: /close sidebar/i });
    await user.click(closeButton);

    // onClose called twice: once by click handler, once by pathname change effect
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('should call onClose when backdrop is clicked', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();

    render(<Sidebar isOpen={true} onClose={onClose} />);

    const backdrop = document.querySelector('[aria-hidden="true"]');
    expect(backdrop).toBeInTheDocument();

    if (backdrop) {
      await user.click(backdrop);
      // onClose called twice: once by backdrop click, once by pathname change effect
      expect(onClose).toHaveBeenCalledTimes(2);
    }
  });

  it('should display all navigation items', () => {
    const onClose = jest.fn();
    render(<Sidebar isOpen={true} onClose={onClose} />);

    // Check for main navigation items
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Start Recording')).toBeInTheDocument();
    expect(screen.getByText('Manage Recordings')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();

    // Check for Sign Out button
    expect(screen.getByText('Sign Out')).toBeInTheDocument();
  });

  it('should close sidebar when navigation item is clicked', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();

    render(<Sidebar isOpen={true} onClose={onClose} />);

    const homeLink = screen.getByText('Home');
    await user.click(homeLink);

    // onClose called twice: once by link click handler, once by pathname change effect
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('should show close button (X) in sidebar header', () => {
    const onClose = jest.fn();
    render(<Sidebar isOpen={true} onClose={onClose} />);

    const closeButton = screen.getByRole('button', { name: /close sidebar/i });
    expect(closeButton).toBeInTheDocument();
  });
});
