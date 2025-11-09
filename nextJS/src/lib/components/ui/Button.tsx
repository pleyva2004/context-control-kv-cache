import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: 'default' | 'outline' | 'ghost' | 'destructive' | 'secondary';
	size?: 'sm' | 'md' | 'lg';
	children: React.ReactNode;
}

export function Button({
	variant = 'default',
	size = 'md',
	className = '',
	children,
	...props
}: ButtonProps) {
	const baseClasses = 'inline-flex items-center justify-center rounded-[var(--radius)] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';
	
	const variantClasses = {
		default: 'bg-primary text-primary-foreground hover:bg-primary/90',
		outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
		ghost: 'hover:bg-accent hover:text-accent-foreground',
		destructive: 'bg-destructive text-white hover:bg-destructive/90',
		secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
	};
	
	const sizeClasses = {
		sm: 'h-8 px-3 text-sm',
		md: 'h-10 px-4 py-2',
		lg: 'h-12 px-6 text-lg'
	};

	return (
		<button
			className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
			{...props}
		>
			{children}
		</button>
	);
}

