import React from 'react';

type DateTimeFieldProps = {
  value: Date;
  mode: 'date' | 'time';
  minimumDate?: Date;
  accentColor?: string;
  onChange: (event: unknown, value?: Date) => void;
};

function dateValue(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function timeValue(value: Date) {
  return `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`;
}

export default function DateTimeField({ value, mode, minimumDate, accentColor, onChange }: DateTimeFieldProps) {
  function update(event: React.ChangeEvent<HTMLInputElement>) {
    const next = new Date(value);
    if (mode === 'date') {
      const [year, month, day] = event.target.value.split('-').map(Number);
      if (!year || !month || !day) return;
      next.setFullYear(year, month - 1, day);
    } else {
      const [hours, minutes] = event.target.value.split(':').map(Number);
      if (hours === undefined || minutes === undefined) return;
      next.setHours(hours, minutes, 0, 0);
    }
    onChange(event, next);
  }

  return (
    <input
      aria-label={mode === 'date' ? 'Reminder date' : 'Reminder time'}
      type={mode}
      value={mode === 'date' ? dateValue(value) : timeValue(value)}
      min={mode === 'date' && minimumDate ? dateValue(minimumDate) : undefined}
      onChange={update}
      style={{
        accentColor,
        background: 'transparent',
        border: '1px solid #D8D1D3',
        borderRadius: 10,
        color: '#55142F',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif',
        fontSize: 16,
        padding: '8px 10px',
      }}
    />
  );
}
