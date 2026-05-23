import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MenuToggleIcon } from '@/components/ui/menu-toggle-icon';
import { createPortal } from 'react-dom';
import { useTheme } from '../ThemeContext';
import Icon from '../Icon';
import AccountMenu from './account-menu';
import {
	NavigationMenu,
	NavigationMenuContent,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
	NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { 
    Home, 
    Search,
    ShoppingBag, 
    Heart, 
    User, 
    Bell,
    Box,
    ShoppingCart,
    Newspaper,
    Headset,
    Moon,
    Sun,
    ChevronLeft,
    ListOrdered,
    Star,
    Image as ImageIcon,
    DollarSign,
    Layout,
    MessageSquare,
    Users,
    Bike,
    FileText,
    Settings,
    LogOut
} from 'lucide-react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';

import { Modal } from '@/components/ui/modal';

type LinkItem = {
	title: string;
	href: string;
	icon: any;
	description?: string;
};

const adminLinks: LinkItem[] = [
	{ title: 'Dashboard', href: '/admin', icon: Home, description: 'Overview & Stats' },
	{ title: 'Products', href: '/admin/products', icon: ShoppingBag, description: 'Manage items' },
	{ title: 'Orders', href: '/admin/orders', icon: ListOrdered, description: 'Track & update orders' },
	{ title: 'Users & Staff', href: '/admin/users', icon: Users, description: 'Manage accounts' },
	{ title: 'Delivery Riders', href: '/admin/riders', icon: Bike, description: 'Rider assignments' },
	{ title: 'Withdrawals', href: '/admin/withdrawals', icon: DollarSign, description: 'Affiliate payouts' },
	{ title: 'Reviews', href: '/admin/reviews', icon: Star, description: 'Customer feedback' },
	{ title: 'Banners', href: '/admin/banners', icon: ImageIcon, description: 'Promo images' },
	{ title: 'Stories', href: '/admin/stories', icon: Layout, description: 'App stories/highlights' },
	{ title: 'UI Builder', href: '/admin/custom-sections', icon: FileText, description: 'Custom sections' },
	{ title: 'Live Chats', href: '/admin/chats', icon: MessageSquare, description: 'Real-time support chats' },
	{ title: 'Help Desk', href: '/admin/helpdesk', icon: MessageSquare, description: 'Support tickets' },
	{ title: 'Notifications', href: '/admin/notifications', icon: Bell, description: 'Push alerts' },
	{ title: 'Config', href: '/admin/config', icon: Settings, description: 'App settings' },
];

const productLinks: LinkItem[] = [
	{
		title: 'Home',
		href: '/',
		description: 'Discover new and trending gadgets',
		icon: Home,
	},
	{
		title: 'Catalog',
		href: '/all-products',
		description: 'Browse our full collection',
		icon: Box,
	},
	{
		title: 'Pay',
		href: '/payment-methods',
		description: 'Secure payment options',
		icon: DollarSign,
	},
	{
		title: 'Receive',
		href: '/orders',
		description: 'Track and manage your orders',
		icon: ShoppingBag,
	},
	{
		title: 'Ship',
		href: '/orders',
		description: 'Shipping details and status',
		icon: Bike,
	},
	{
		title: 'Review',
		href: '/wishlist',
		description: 'Your saved favorite items',
		icon: Star,
	},
	{
		title: 'Help Center',
		href: '/help-center',
		description: 'Get support and answers',
		icon: Headset,
	},
];

export function Header() {
	const [open, setOpen] = React.useState(false);
	const [showBackDialog, setShowBackDialog] = React.useState(false);
	const [user, setUser] = React.useState<any>(null);
	const [categories, setCategories] = React.useState<string[]>([]);
	const scrolled = useScroll(10);
    const { isDark, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();

    const isAdmin = location.pathname.startsWith('/admin');
    const isInnerPage = location.pathname !== '/' && location.pathname !== '/admin';
    const linksToShow = isAdmin ? adminLinks : productLinks;

	useEffect(() => {
        import('@/firebase').then(({ auth, db }) => {
            const unsubscribeAuth = auth.onAuthStateChanged((u) => setUser(u));
            
            import('firebase/firestore').then(({ collection, getDocs, query }) => {
                const fetchCategories = async () => {
                    try {
                        const q = query(collection(db, 'products'));
                        const snapshot = await getDocs(q);
                        const allCategories = new Set<string>();
                        snapshot.forEach(doc => {
                            const data = doc.data();
                            if (data.category) allCategories.add(data.category);
                        });
                        setCategories(Array.from(allCategories).slice(0, 8)); // Get top 8 categories
                    } catch (error) {
                        console.error("Failed to fetch categories:", error);
                    }
                };
                fetchCategories();
            });

            return () => unsubscribeAuth();
        });
		if (open) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = '';
		}
		return () => {
			document.body.style.overflow = '';
		};
	}, [open]);

	const buttonClass = cn(
        "transition-all duration-300 bg-transparent text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full"
    );

	return (
		<header
			className={cn('sticky top-0 z-50 w-full transition-all duration-300 ease-in-out bg-white dark:bg-zinc-900', {
				'shadow-[0_4px_20px_-10px_rgba(0,0,0,0.1)] border-b border-zinc-200 dark:border-zinc-800': scrolled,
                'border-transparent': !scrolled
			})}
		>
			<nav className={cn(
                "mx-auto flex w-full max-w-[1920px] items-center justify-between px-4 lg:px-8 transition-all duration-300",
                scrolled ? "h-16 md:h-18" : "h-20 md:h-24"
            )}>
				<div className="flex items-center gap-2 md:gap-5">
					<Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                            if (isInnerPage) {
                                navigate(-1);
                            } else {
                                setOpen(!open);
                                window.dispatchEvent(new CustomEvent('toggleSidebar', { detail: !open }));
                            }
                        }}
                        className={cn("mr-1", buttonClass)}
                        aria-expanded={open}
                        aria-controls="mobile-menu"
                        aria-label="Toggle menu"
                    >
                        {isInnerPage ? (
                            <ChevronLeft className="size-6" />
                        ) : (
                            <MenuToggleIcon open={open} className="size-5" duration={300} />
                        )}
                    </Button>
					<NavLink to={isAdmin ? "/admin" : "/"} className={cn("p-2 flex items-center pr-2 shrink-0", buttonClass, "rounded-3xl border-none ring-0 shadow-none hover:shadow-none bg-transparent")}>
						<WordmarkIcon className="text-zinc-900 dark:text-zinc-100" />
					</NavLink>
				</div>
                
				<div className="hidden items-center gap-2 md:flex">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/search')} className={buttonClass}>
                      <Search className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => navigate('/wishlist')} className={buttonClass}>
                      <Heart className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => navigate('/cart')} className={cn("relative", buttonClass)}>
                      <ShoppingCart className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={toggleTheme} className={buttonClass}>
                      {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => navigate('/notifications')} className={buttonClass}>
                      <Bell className="w-5 h-5" />
                    </Button>
					{location.pathname !== '/profile' && <AccountMenu scrolled={scrolled} />}
				</div>
                <div className="flex items-center gap-2 md:hidden">
                    <Button variant="ghost" size="icon" onClick={toggleTheme} className={buttonClass}>
                      {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => navigate('/notifications')} className={cn("hidden sm:flex", buttonClass)}>
                      <Bell className="w-5 h-5" />
                    </Button>
					{location.pathname !== '/profile' && <AccountMenu scrolled={scrolled} />}
                </div>
			</nav>

				<MobileMenu open={open} className="flex flex-col justify-between gap-2 overflow-y-auto bg-white dark:bg-zinc-900 pb-20 md:pb-4 border-l md:border-l-0 md:border-r border-zinc-200 dark:border-zinc-800">
				<div className="max-w-full block">
					<div className="flex w-full flex-col gap-y-2 pb-4">
						<span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 px-4 mt-4 mb-2">{isAdmin ? "Admin Pages" : "Explore Pages"}</span>
						{linksToShow.map((link) => (
							<ListItem key={link.title} {...link} className="mx-2" onClick={() => setOpen(false)} />
						))}

                        {!isAdmin && categories.length > 0 && (
                            <>
                                <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 px-4 mt-6 mb-2">Categories</span>
                                <div className="grid grid-cols-2 gap-2 px-2">
                                    {categories.map((cat, i) => (
                                        <NavLink
                                            key={i}
                                            to={`/search?q=${encodeURIComponent(cat)}`}
                                            onClick={() => setOpen(false)}
                                            className="px-3 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
                                        >
                                            {cat}
                                        </NavLink>
                                    ))}
                                </div>
                            </>
                        )}
					</div>
				</div>
				<div className="flex flex-col gap-2 p-4 mt-auto border-t border-zinc-100 dark:border-zinc-800 w-full mb-4">
                    {isAdmin && (
                        <Button variant="outline" className="w-full bg-transparent border-zinc-200 dark:border-zinc-700 mb-2 text-zinc-700 dark:text-zinc-200" onClick={() => { setOpen(false); navigate('/'); }}>
                            <ChevronLeft className="w-4 h-4 mr-2" /> Back to Store
                        </Button>
                    )}
					{!user ? (
						<>
							<Button variant="outline" className="w-full bg-transparent border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200" onClick={() => { setOpen(false); navigate('/auth-selector'); }}>
								Sign In
							</Button>
							<Button className="w-full bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900" onClick={() => { setOpen(false); navigate('/auth-selector'); }}>
								Sign Up
							</Button>
						</>
					) : (
						<>
							<Button variant="outline" className="w-full bg-transparent border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200" onClick={() => { setOpen(false); navigate('/profile'); }}>
								Account
							</Button>
							<Button className="w-full bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900" onClick={() => { setOpen(false); navigate('/orders'); }}>
								My Orders
							</Button>
						</>
					)}
				</div>
			</MobileMenu>
		</header>
	);
}

type MobileMenuProps = React.ComponentProps<'div'> & {
	open: boolean;
};

function MobileMenu({ open, children, className, ...props }: MobileMenuProps) {
	if (!open || typeof window === 'undefined') return null;

	return createPortal(
		<div
			id="mobile-menu"
			className={cn(
				'bg-white dark:bg-zinc-900',
				'fixed top-16 md:top-20 bottom-0 z-40 flex flex-col overflow-hidden',
                'md:left-0 md:w-64 md:border-r md:border-zinc-200 md:dark:border-zinc-800', // desktop
                'left-0 right-0' // mobile (removed md:hidden)
			)}
		>
			<div
				data-slot={open ? 'open' : 'closed'}
				className={cn(
                    // On mobile, slide in from right. On desktop, slide in from left.
					'data-[slot=open]:animate-in data-[slot=closed]:animate-out ease-out duration-300',
                    'max-md:data-[slot=open]:slide-in-from-right-full max-md:data-[slot=closed]:slide-out-to-right-full',
                    'md:data-[slot=open]:slide-in-from-left-full md:data-[slot=closed]:slide-out-to-left-full',
					'size-full',
					className,
				)}
				{...props}
			>
				{children}
			</div>
		</div>,
		document.body,
	);
}

function ListItem({
	title,
	description,
	icon: IconComp,
	className,
	href,
    onClick,
}: LinkItem & { className?: string, onClick?: () => void }) {
	return (
		<NavLink
            to={href}
            onClick={onClick}
            className={({ isActive }) => 
                cn('w-full flex items-center flex-row gap-x-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 focus:bg-zinc-100 dark:focus:bg-zinc-800 rounded-xl p-2 transition-colors', isActive && 'bg-zinc-100 dark:bg-zinc-800', className)
            }
        >
				<div className="bg-zinc-100 dark:bg-zinc-800 flex aspect-square size-12 items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-sm shrink-0">
					<IconComp className="text-zinc-700 dark:text-zinc-300 size-5" />
				</div>
				<div className="flex flex-col items-start justify-center">
					<span className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">{title}</span>
					<span className="text-zinc-500 dark:text-zinc-400 text-xs mt-0.5">{description}</span>
				</div>
		</NavLink>
	);
}

function useScroll(threshold: number) {
	const [scrolled, setScrolled] = React.useState(false);

	const onScroll = React.useCallback(() => {
		setScrolled(window.scrollY > threshold);
	}, [threshold]);

	React.useEffect(() => {
		window.addEventListener('scroll', onScroll);
		return () => window.removeEventListener('scroll', onScroll);
	}, [onScroll]);

	React.useEffect(() => {
		onScroll();
	}, [onScroll]);

	return scrolled;
}

const WordmarkIcon = (props: React.ComponentProps<"span">) => (
  <span className="font-outfit font-bold text-xl tracking-tight text-gradient" {...props}>
    Vibe Gadget
  </span>
);
