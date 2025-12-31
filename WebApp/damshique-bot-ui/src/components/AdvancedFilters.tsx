import React, { useState } from 'react';
import { Calendar } from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

interface DateRangePickerProps {
    startDate: Date | null;
    endDate: Date | null;
    onStartDateChange: (date: Date | null) => void;
    onEndDateChange: (date: Date | null) => void;
}

export function DateRangePicker({ startDate, endDate, onStartDateChange, onEndDateChange }: DateRangePickerProps) {
    const [showPicker, setShowPicker] = useState(false);

    const presets = [
        { label: 'Today', getValue: () => ({ start: new Date(), end: new Date() }) },
        { label: 'Last 7 Days', getValue: () => ({ start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), end: new Date() }) },
        { label: 'Last 30 Days', getValue: () => ({ start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), end: new Date() }) },
        { label: 'This Month', getValue: () => ({ start: new Date(new Date().getFullYear(), new Date().getMonth(), 1), end: new Date() }) },
        {
            label: 'Last Month', getValue: () => {
                const now = new Date();
                return { start: new Date(now.getFullYear(), now.getMonth() - 1, 1), end: new Date(now.getFullYear(), now.getMonth(), 0) };
            }
        },
        { label: 'This Year', getValue: () => ({ start: new Date(new Date().getFullYear(), 0, 1), end: new Date() }) },
    ];

    const applyPreset = (preset: any) => {
        const { start, end } = preset.getValue();
        onStartDateChange(start);
        onEndDateChange(end);
        setShowPicker(false);
    };

    const formatDateRange = () => {
        if (!startDate && !endDate) return 'Select Date Range';
        if (startDate && endDate) {
            return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
        }
        if (startDate) return `From ${startDate.toLocaleDateString()}`;
        return `Until ${endDate?.toLocaleDateString()}`;
    };

    return (
        <div style={{ position: 'relative' }}>
            <button
                onClick={() => setShowPicker(!showPicker)}
                style={{
                    padding: '12px 20px',
                    borderRadius: 12,
                    border: '1px solid #e2e8f0',
                    background: '#fff',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    color: '#0f172a'
                }}
            >
                <Calendar size={18} color="#64748b" />
                {formatDateRange()}
            </button>

            {showPicker && (
                <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    background: '#fff',
                    borderRadius: 20,
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.12)',
                    padding: 24,
                    zIndex: 100,
                    minWidth: 600
                }}>
                    <div style={{ display: 'flex', gap: 24 }}>
                        {/* Presets */}
                        <div style={{ borderRight: '1px solid #f1f5f9', paddingRight: 24 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 12 }}>QUICK SELECT</div>
                            {presets.map((preset, i) => (
                                <button
                                    key={i}
                                    onClick={() => applyPreset(preset)}
                                    style={{
                                        display: 'block',
                                        width: '100%',
                                        padding: '10px 16px',
                                        marginBottom: 8,
                                        borderRadius: 10,
                                        border: 'none',
                                        background: 'transparent',
                                        textAlign: 'left',
                                        fontSize: 14,
                                        fontWeight: 600,
                                        color: '#475569',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>

                        {/* Date Pickers */}
                        <div>
                            <div style={{ marginBottom: 20 }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 8 }}>START DATE</div>
                                <DatePicker
                                    selected={startDate}
                                    onChange={onStartDateChange}
                                    selectsStart
                                    startDate={startDate}
                                    endDate={endDate}
                                    inline
                                />
                            </div>
                            <div>
                                <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 8 }}>END DATE</div>
                                <DatePicker
                                    selected={endDate}
                                    onChange={onEndDateChange}
                                    selectsEnd
                                    startDate={startDate}
                                    endDate={endDate}
                                    minDate={startDate}
                                    inline
                                />
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 12, marginTop: 20, paddingTop: 20, borderTop: '1px solid #f1f5f9' }}>
                        <button
                            onClick={() => {
                                onStartDateChange(null);
                                onEndDateChange(null);
                            }}
                            style={{
                                flex: 1,
                                padding: '12px',
                                borderRadius: 12,
                                border: '1px solid #e2e8f0',
                                background: '#fff',
                                fontSize: 14,
                                fontWeight: 700,
                                cursor: 'pointer',
                                color: '#64748b'
                            }}
                        >
                            Clear
                        </button>
                        <button
                            onClick={() => setShowPicker(false)}
                            style={{
                                flex: 1,
                                padding: '12px',
                                borderRadius: 12,
                                border: 'none',
                                background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                                color: '#fff',
                                fontSize: 14,
                                fontWeight: 700,
                                cursor: 'pointer'
                            }}
                        >
                            Apply
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

interface MultiSelectProps {
    options: string[];
    selected: string[];
    onChange: (selected: string[]) => void;
    placeholder?: string;
}

export function MultiSelect({ options, selected, onChange, placeholder = 'Select...' }: MultiSelectProps) {
    const [isOpen, setIsOpen] = useState(false);

    const toggleOption = (option: string) => {
        if (selected.includes(option)) {
            onChange(selected.filter(s => s !== option));
        } else {
            onChange([...selected, option]);
        }
    };

    const selectAll = () => {
        onChange(options);
    };

    const clearAll = () => {
        onChange([]);
    };

    return (
        <div style={{ position: 'relative' }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    padding: '12px 20px',
                    borderRadius: 12,
                    border: '1px solid #e2e8f0',
                    background: '#fff',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    color: '#0f172a',
                    minWidth: 200
                }}
            >
                {selected.length === 0 ? placeholder : `${selected.length} selected`}
            </button>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    left: 0,
                    background: '#fff',
                    borderRadius: 16,
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.12)',
                    padding: 16,
                    zIndex: 100,
                    minWidth: 250,
                    maxHeight: 400,
                    overflowY: 'auto'
                }}>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid #f1f5f9' }}>
                        <button
                            onClick={selectAll}
                            style={{
                                flex: 1,
                                padding: '8px',
                                borderRadius: 8,
                                border: '1px solid #e2e8f0',
                                background: '#fff',
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: 'pointer',
                                color: '#3b82f6'
                            }}
                        >
                            Select All
                        </button>
                        <button
                            onClick={clearAll}
                            style={{
                                flex: 1,
                                padding: '8px',
                                borderRadius: 8,
                                border: '1px solid #e2e8f0',
                                background: '#fff',
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: 'pointer',
                                color: '#64748b'
                            }}
                        >
                            Clear
                        </button>
                    </div>

                    {options.map((option, i) => (
                        <label
                            key={i}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                padding: '10px 12px',
                                borderRadius: 10,
                                cursor: 'pointer',
                                transition: 'background 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                            <input
                                type="checkbox"
                                checked={selected.includes(option)}
                                onChange={() => toggleOption(option)}
                                style={{ width: 18, height: 18, cursor: 'pointer' }}
                            />
                            <span style={{ fontSize: 14, fontWeight: 600, color: '#475569' }}>{option}</span>
                        </label>
                    ))}
                </div>
            )}
        </div>
    );
}

interface AmountSliderProps {
    min: number;
    max: number;
    value: [number, number];
    onChange: (value: [number, number]) => void;
}

export function AmountSlider({ min, max, value, onChange }: AmountSliderProps) {
    return (
        <div style={{ padding: '12px 20px', borderRadius: 12, border: '1px solid #e2e8f0', background: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8' }}>AMOUNT RANGE</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                    {value[0].toLocaleString()} - {value[1].toLocaleString()} AED
                </span>
            </div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <input
                    type="range"
                    min={min}
                    max={max}
                    value={value[0]}
                    onChange={(e) => onChange([parseInt(e.target.value), value[1]])}
                    style={{ flex: 1 }}
                />
                <input
                    type="range"
                    min={min}
                    max={max}
                    value={value[1]}
                    onChange={(e) => onChange([value[0], parseInt(e.target.value)])}
                    style={{ flex: 1 }}
                />
            </div>
        </div>
    );
}
