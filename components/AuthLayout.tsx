import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import Logo from './Logo';

export function FloatingPaths({ position }: { position: number }) {
	const paths = Array.from({ length: 36 }, (_, i) => ({
		id: i,
		d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${
			380 - i * 5 * position
		} -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${
			152 - i * 5 * position
		} ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${
			684 - i * 5 * position
		} ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
		color: `rgba(15,23,42,${0.1 + i * 0.03})`,
		width: 0.5 + i * 0.03,
	}));

	return (
		<div className="pointer-events-none absolute inset-0">
			<svg
				className="h-full w-full text-slate-950 dark:text-white"
				viewBox="0 0 696 316"
				fill="none"
			>
				<title>Background Paths</title>
				{paths.map((path) => (
					<motion.path
						key={path.id}
						d={path.d}
						stroke="currentColor"
						strokeWidth={path.width}
						strokeOpacity={0.1 + path.id * 0.03}
						initial={{ pathLength: 0.3, opacity: 0.6 }}
						animate={{
							pathLength: 1,
							opacity: [0.3, 0.6, 0.3],
							pathOffset: [0, 1, 0],
						}}
						transition={{
							duration: 20 + Math.random() * 10,
							repeat: Number.POSITIVE_INFINITY,
							ease: 'linear',
						}}
					/>
				))}
			</svg>
		</div>
	);
}

export function AuthLayout({ children, title, subtitle }: { children: React.ReactNode, title?: string, subtitle?: string }) {
    const navigate = useNavigate();
	return (
		<main className="relative md:h-screen md:overflow-hidden lg:grid lg:grid-cols-2 bg-background text-foreground shrink-0 min-h-screen">
			<div className="bg-muted/60 relative hidden h-full flex-col border-r p-10 lg:flex">
				<div className="from-background absolute inset-0 z-10 bg-gradient-to-t to-transparent" />
				<div className="z-10 flex items-center gap-2">
					<Logo scale={1} className="origin-left" />
				</div>
				<div className="z-10 mt-auto">
					<blockquote className="space-y-2">
						<p className="text-xl font-medium tracking-tight">
							&ldquo;Premium mobile accessories and gadgets delivered right to your doorstep. Experience the best in tech.&rdquo;
						</p>
						<footer className="font-mono text-sm font-semibold">
							~ VibeGadgets
						</footer>
					</blockquote>
				</div>
				<div className="absolute inset-0 overflow-hidden">
					<FloatingPaths position={1} />
					<FloatingPaths position={-1} />
				</div>
			</div>
			<div className="relative flex min-h-screen flex-col p-4 md:p-8">
				<div
					aria-hidden
					className="absolute inset-0 isolate contain-strict -z-10 opacity-30 dark:opacity-60"
				>
					<div className="bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,rgba(0,0,0,0.06)_0,rgba(0,0,0,0.02)_50%,rgba(0,0,0,0.01)_80%)] dark:bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,rgba(255,255,255,0.06)_0,rgba(255,255,255,0.02)_50%,rgba(255,255,255,0.01)_80%)] absolute top-0 right-0 h-[800px] w-[560px] -translate-y-[350px] rounded-full" />
					<div className="bg-[radial-gradient(50%_50%_at_50%_50%,rgba(0,0,0,0.04)_0,rgba(0,0,0,0.01)_80%,transparent_100%)] dark:bg-[radial-gradient(50%_50%_at_50%_50%,rgba(255,255,255,0.04)_0,rgba(255,255,255,0.01)_80%,transparent_100%)] absolute top-0 right-0 h-[800px] w-[240px] translate-x-[5%] translate-y-[-50%] rounded-full" />
					<div className="bg-[radial-gradient(50%_50%_at_50%_50%,rgba(0,0,0,0.04)_0,rgba(0,0,0,0.01)_80%,transparent_100%)] dark:bg-[radial-gradient(50%_50%_at_50%_50%,rgba(255,255,255,0.04)_0,rgba(255,255,255,0.01)_80%,transparent_100%)] absolute top-0 right-0 h-[800px] w-[240px] -translate-y-[350px] rounded-full" />
				</div>
                
				<div className="mx-auto space-y-6 sm:w-[400px] w-full px-4 sm:px-0 md:pt-20 pb-10 z-10 relative mt-auto mb-auto">
					<div className="flex items-center gap-2 lg:hidden mt-4 mb-4">
						<Logo scale={0.8} className="origin-left" />
					</div>
					{(title || subtitle) && (
                        <div className="flex flex-col space-y-1">
                            {title && <h1 className="font-heading text-2xl font-bold tracking-wide">
                                {title}
                            </h1>}
                            {subtitle && <p className="text-muted-foreground text-sm font-medium leading-relaxed">
                                {subtitle}
                            </p>}
                        </div>
                    )}
                    {children}
				</div>
			</div>
		</main>
	);
}

export const AuthSeparator = ({ text = "OR" }: { text?: string }) => {
	return (
		<div className="flex w-full items-center justify-center my-6">
			<div className="bg-border h-px w-full" />
			<span className="text-muted-foreground px-4 text-xs font-semibold tracking-wider uppercase whitespace-nowrap">{text}</span>
			<div className="bg-border h-px w-full" />
		</div>
	);
};
