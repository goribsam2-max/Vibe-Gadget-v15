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

	return (
		<header
			className={cn('sticky top-0 z-50 w-full border-b border-transparent', {
				'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800':
					scrolled,
			})}
		>
			<nav className="mx-auto flex h-16 md:h-20 w-full max-w-[1920px] items-center justify-between px-4 lg:px-8">
				<div className="flex items-center gap-2 md:gap-5">
					<Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                            if (isInnerPage) {
                                navigate(-1);
                            } else {
                                setOpen(!open);
                            }
                        }}
                        className="md:hidden text-zinc-600 dark:text-zinc-300 mr-1"
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
					<NavLink to={isAdmin ? "/admin" : "/"} className="hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md p-2 flex items-center pr-2 border-zinc-200 dark:border-zinc-800 shrink-0">
						<WordmarkIcon className="text-zinc-900 dark:text-zinc-100" />
					</NavLink>
					<NavigationMenu className="hidden md:flex">
						<NavigationMenuList>
							<NavigationMenuItem>
								<NavigationMenuTrigger className="bg-transparent text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100 focus:text-zinc-900 dark:focus:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 focus:bg-zinc-100 dark:focus:bg-zinc-800 data-[state=open]:bg-zinc-100 dark:data-[state=open]:bg-zinc-800 data-[active]:bg-zinc-100 dark:data-[active]:bg-zinc-800">
                                    {isAdmin ? "Admin Pages" : "Discover"}
                                </NavigationMenuTrigger>
								<NavigationMenuContent className="p-1 pr-1.5 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 h-96 overflow-y-auto no-scrollbar">
									<ul className="grid w-[400px] md:w-[600px] grid-cols-2 gap-2 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-2 shadow">
										{linksToShow.map((item, i) => (
											<li key={i}>
												<ListItem {...item} />
											</li>
										))}
									</ul>
                                    {!isAdmin && (
                                        <div className="p-2">
                                            <p className="text-zinc-500 text-sm">
                                                Looking for something specific?{' '}
                                                <NavLink to="/search" className="text-zinc-900 dark:text-zinc-100 font-medium hover:underline">
                                                    Search catalog
                                                </NavLink>
                                            </p>
                                        </div>
                                    )}
								</NavigationMenuContent>
							</NavigationMenuItem>
                            {!isAdmin ? (
                                <>
                                    <NavigationMenuLink className="px-4" asChild>
                                        <NavLink to="/all-products" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md p-2 px-4 transition-colors">
                                            Catalog
                                        </NavLink>
                                    </NavigationMenuLink>
                                    <NavigationMenuLink className="px-4" asChild>
                                        <NavLink to="/blog" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md p-2 px-4 transition-colors">
                                            Blog
                                        </NavLink>
                                    </NavigationMenuLink>
                                </>
                            ) : (
                                <NavigationMenuLink className="px-4" asChild>
                                    <NavLink to="/" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md p-2 px-4 transition-colors">
                                        Back to Store
                                    </NavLink>
                                </NavigationMenuLink>
                            )}
						</NavigationMenuList>
					</NavigationMenu>
				</div>
                
				<div className="hidden items-center gap-2 md:flex">
                    <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                      {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => navigate('/notifications')} className="text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                      <Bell className="w-5 h-5" />
                    </Button>
					<AccountMenu />
				</div>
                <div className="flex items-center gap-1 md:hidden">
                    <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-zinc-600 dark:text-zinc-300">
                      {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => navigate('/notifications')} className="text-zinc-600 dark:text-zinc-300 border-none hidden sm:flex">
                      <Bell className="w-5 h-5" />
                    </Button>
					<AccountMenu />
                </div>
			</nav>

				<MobileMenu open={open} className="flex flex-col justify-between gap-2 overflow-y-auto bg-white dark:bg-zinc-900 pb-20">
				<NavigationMenu className="max-w-full block">
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
				</NavigationMenu>
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
				'fixed top-14 right-0 bottom-0 left-0 z-40 flex flex-col overflow-hidden border-y border-zinc-200 dark:border-zinc-800 md:hidden',
			)}
		>
			<div
				data-slot={open ? 'open' : 'closed'}
				className={cn(
					'data-[slot=open]:animate-in data-[slot=open]:zoom-in-95 ease-out',
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
	...props
}: React.ComponentProps<typeof NavigationMenuLink> & LinkItem) {
	return (
		<NavigationMenuLink className={cn('w-full flex flex-row gap-x-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 focus:bg-zinc-100 dark:focus:bg-zinc-800 rounded-xl p-2 transition-colors', className)} {...props} asChild>
			<NavLink to={href}>
				<div className="bg-zinc-100 dark:bg-zinc-800 flex aspect-square size-12 items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-sm shrink-0">
					<IconComp className="text-zinc-700 dark:text-zinc-300 size-5" />
				</div>
				<div className="flex flex-col items-start justify-center">
					<span className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">{title}</span>
					<span className="text-zinc-500 dark:text-zinc-400 text-xs mt-0.5">{description}</span>
				</div>
			</NavLink>
		</NavigationMenuLink>
	);
}

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
		title: 'Wishlist',
		href: '/wishlist',
		description: 'Your saved favorite items',
		icon: Heart,
	},
	{
		title: 'My Orders',
		href: '/orders',
		description: 'Track and manage your orders',
		icon: ShoppingBag,
	},
	{
		title: 'Blog',
		href: '/blog',
		description: 'Tech news, reviews and tips',
		icon: Newspaper,
	},
	{
		title: 'Help Center',
		href: '/help',
		description: 'Get support and answers',
		icon: Headset,
	},
];


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
