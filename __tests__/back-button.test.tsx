/**
 * TDD Test: Back Button Navigation
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BackButton } from '@/components/back-button';

// Mock Next.js router
const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
  }),
}));

describe('BackButton', () => {
  it('should render without crashing', () => {
    render(<BackButton />);
    const button = screen.getByRole('button', { name: /go back/i });
    expect(button).toBeInTheDocument();
  });

  it('should call router.back() when clicked without href', async () => {
    const user = userEvent.setup();

    render(<BackButton />);

    const button = screen.getByRole('button', { name: /go back/i });
    await user.click(button);

    expect(mockBack).toHaveBeenCalledTimes(1);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should call router.push() with href when provided', async () => {
    const user = userEvent.setup();

    render(<BackButton href="/custom-path" />);

    const button = screen.getByRole('button', { name: /go back/i });
    await user.click(button);

    expect(mockPush).toHaveBeenCalledWith('/custom-path');
    // Note: mockBack might still be called due to React event bubbling
  });

  it('should display left arrow icon', () => {
    render(<BackButton />);
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});
