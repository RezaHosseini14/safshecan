import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CommandPanel } from '../src/features/console/command-panel';

describe('armed disarm control', () => {
  it('keeps an emergency stop reachable while the engine is armed', () => {
    const onDisarm = vi.fn();
    render(
      <CommandPanel
        engineState="ARMED"
        antiDoubleSpend
        loading={false}
        onToggleAntiDoubleSpend={() => undefined}
        onArm={() => undefined}
        onDisarm={onDisarm}
        onTestShot={() => undefined}
      />
    );
    screen.getByRole('button', { name: 'توقف اضطراری (DISARM)' }).click();
    expect(onDisarm).toHaveBeenCalledOnce();
  });
});
