"use client";
import React from "react";

interface TextareaFieldProps {
	id?: string;
	name?: string;
	label?: string;
	value: string;
	onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void; // Accept full event object
	onBlur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
	placeholder?: string;
	maxLength?: number;
	rows?: number;
	showCount?: boolean;
	className?: string;
	error?: string | boolean;
	disabled?: boolean;
}

export const TextareaField: React.FC<TextareaFieldProps> = ({
	id,
	name,
	label = "Description",
	value,
	onChange,
	onBlur,
	placeholder = "",
	maxLength,
	rows = 4,
	showCount = true,
	className = "",
	error,
	disabled = false,
}) => {
	const length = value ? value.length : 0;

	return (
		<div className={`w-full ${className}`}>
			{label && (
				<label htmlFor={id || name} className="block text-sm font-medium text-gray-700 mb-1">
					{label}
				</label>
			)}

			<textarea
				id={id || name}
				name={name}
				rows={rows}
				value={value}
				onChange={onChange} // Pass the full event object
				onBlur={onBlur}
				placeholder={placeholder}
				maxLength={maxLength}
				disabled={disabled}
				className={`resize-none w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-300 placeholder-gray-400 ${error ? "border-red-400" : "border-gray-200"
					}`}
			/>

			<div className="mt-2 flex items-center justify-between text-xs text-gray-500">
				<div>
					{typeof error === "string" ? (
						<span className="text-red-600">{error}</span>
					) : null}
				</div>
				<div>
					{showCount && (
						<span>
							{maxLength ? `${length} / ${maxLength}` : `${length} chars`}
						</span>
					)}
				</div>
			</div>
		</div>
	);
};

export default TextareaField;

