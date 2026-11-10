import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Controls } from '../components/Controls';

describe('Controls Component Accessibility & State', () => {
  it('renders the live detect switch with role="switch" and reflects aria-checked state', () => {
    const onToggleLive = vi.fn();

    const { rerender } = render(
      <Controls
        isCameraActive={true}
        onToggleCamera={() => {}}
        onFlipCamera={() => {}}
        onCaptureAndDetect={() => {}}
        onFileUpload={() => {}}
        isLiveActive={false}
        onToggleLive={onToggleLive}
        isDetecting={false}
        detectionCount={0}
        statusMessage="Ready"
        threshold={0.50}
        onThresholdChange={() => {}}
        hasMedia={true}
        isModelReady={true}
      />
    );

    const switchBtn = screen.getByRole('switch');
    expect(switchBtn).toBeInTheDocument();
    expect(switchBtn).toHaveAttribute('aria-checked', 'false');

    // Click switch
    fireEvent.click(switchBtn);
    expect(onToggleLive).toHaveBeenCalledTimes(1);

    // Re-render with isLiveActive = true
    rerender(
      <Controls
        isCameraActive={true}
        onToggleCamera={() => {}}
        onFlipCamera={() => {}}
        onCaptureAndDetect={() => {}}
        onFileUpload={() => {}}
        isLiveActive={true}
        onToggleLive={onToggleLive}
        isDetecting={false}
        detectionCount={2}
        statusMessage="Live scanning"
        threshold={0.50}
        onThresholdChange={() => {}}
        hasMedia={true}
        isModelReady={true}
      />
    );

    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
  });

  it('disables detection actions when isModelReady is false', () => {
    render(
      <Controls
        isCameraActive={false}
        onToggleCamera={() => {}}
        onFlipCamera={() => {}}
        onCaptureAndDetect={() => {}}
        onFileUpload={() => {}}
        isLiveActive={false}
        onToggleLive={() => {}}
        isDetecting={false}
        detectionCount={0}
        statusMessage="Model unavailable"
        threshold={0.50}
        onThresholdChange={() => {}}
        hasMedia={false}
        isModelReady={false}
      />
    );

    // Capture button and upload button should be disabled when model is not ready
    const captureBtn = screen.getByRole('button', { name: /Capture & detect/i });
    expect(captureBtn).toBeDisabled();

    const uploadBtn = screen.getByRole('button', { name: /Upload photo/i });
    expect(uploadBtn).toBeDisabled();
  });

  it('renders the Reset button above the live detect switch and calls onReset when clicked', () => {
    const onReset = vi.fn();
    render(
      <Controls
        isCameraActive={true}
        onToggleCamera={() => {}}
        onFlipCamera={() => {}}
        onCaptureAndDetect={() => {}}
        onFileUpload={() => {}}
        isLiveActive={false}
        onToggleLive={() => {}}
        isDetecting={false}
        detectionCount={0}
        statusMessage="Ready"
        threshold={0.50}
        onThresholdChange={() => {}}
        hasMedia={true}
        isModelReady={true}
        onReset={onReset}
      />
    );

    const resetBtn = screen.getByRole('button', { name: /Reset detection and camera/i });
    expect(resetBtn).toBeInTheDocument();
    expect(screen.getByText('Reset')).toBeInTheDocument();

    fireEvent.click(resetBtn);
    expect(onReset).toHaveBeenCalledTimes(1);
  });
});

