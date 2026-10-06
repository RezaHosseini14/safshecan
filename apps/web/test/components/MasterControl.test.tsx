import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MasterControl } from '../../src/components/MasterControl';

describe('MasterControl Component Tests', () => {
  it('should render Arm button when IDLE', () => {
    const onArm = vi.fn().mockResolvedValue(undefined);
    const onDisarm = vi.fn().mockResolvedValue(undefined);
    const onTestShot = vi.fn().mockResolvedValue(undefined);
    const onToggle = vi.fn();

    render(
      <MasterControl
        engineState="IDLE"
        onArm={onArm}
        onDisarm={onDisarm}
        onTestShot={onTestShot}
        antiDoubleSpend={true}
        onToggleAntiDoubleSpend={onToggle}
      />
    );

    const armBtn = screen.getByText('مسلح‌سازی موتور سرخطی (ARM)');
    expect(armBtn).toBeInTheDocument();
    fireEvent.click(armBtn);
    expect(onArm).toHaveBeenCalledTimes(1);
  });

  it('should show Armed state and enable Disarm button when ARMED', () => {
    const onArm = vi.fn().mockResolvedValue(undefined);
    const onDisarm = vi.fn().mockResolvedValue(undefined);
    const onTestShot = vi.fn().mockResolvedValue(undefined);
    const onToggle = vi.fn();

    render(
      <MasterControl
        engineState="ARMED"
        onArm={onArm}
        onDisarm={onDisarm}
        onTestShot={onTestShot}
        antiDoubleSpend={true}
        onToggleAntiDoubleSpend={onToggle}
      />
    );

    expect(screen.getByText('ربات مسلح است (آماده شلیک در زمان هدف)')).toBeInTheDocument();
    const disarmBtn = screen.getByText('لغو آماده‌باش (DISARM)');
    fireEvent.click(disarmBtn);
    expect(onDisarm).toHaveBeenCalledTimes(1);
  });

  it('should toggle anti-double-spend checkbox', () => {
    const onToggle = vi.fn();

    render(
      <MasterControl
        engineState="IDLE"
        onArm={vi.fn()}
        onDisarm={vi.fn()}
        onTestShot={vi.fn()}
        antiDoubleSpend={true}
        onToggleAntiDoubleSpend={onToggle}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
    fireEvent.click(checkbox);
    expect(onToggle).toHaveBeenCalledWith(false);
  });
});
