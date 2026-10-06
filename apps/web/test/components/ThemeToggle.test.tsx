import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ThemeToggle } from '../../src/components/ui/theme-toggle';

const mockSetTheme = vi.fn();

vi.mock('next-themes', () => ({
  useTheme: () => ({
    theme: 'dark',
    resolvedTheme: 'dark',
    setTheme: mockSetTheme,
  }),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('ThemeToggle Component Tests', () => {
  it('should render toggle button and switch theme when clicked', () => {
    render(<ThemeToggle />);

    const toggleBtn = screen.getByRole('button', { name: /تغییر/ });
    expect(toggleBtn).toBeInTheDocument();

    fireEvent.click(toggleBtn);
    expect(mockSetTheme).toHaveBeenCalledWith('light');
  });
});
