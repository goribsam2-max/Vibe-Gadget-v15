import React, { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from './dialog';
import { Button } from './button';
import { doc, updateDoc } from 'firebase/firestore';
import { getToken } from 'firebase/messaging';
import { db, messaging, auth } from '../../firebase';
import { useNotify } from '../Notifications';

export function NotificationPermissionModal() {
  const [open, setOpen] = useState(false);
  const notify = useNotify();

  useEffect(() => {
    // Check if the user has already granted/denied permission
    // and if we have already asked them before.
    if ('Notification' in window) {
      const permission = Notification.permission;
      const hasDismissed = localStorage.getItem('notificationPromptDismissed');
      
      // Only show if default (not asked) and haven't dismissed deliberately
      if (permission === 'default' && !hasDismissed && auth.currentUser) {
         // Show after a small delay to not overwhelm on login
         const timer = setTimeout(() => {
            setOpen(true);
         }, 3000);
         return () => clearTimeout(timer);
      }
    }
  }, []);

  const handleAllow = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
         const msg = await messaging();
         if (msg && auth.currentUser) {
            const token = await getToken(msg);
            if (token) {
              await updateDoc(doc(db, 'users', auth.currentUser.uid), {
                fcmToken: token
              });
              notify('Push notifications enabled!', 'success');
            }
         }
      } else {
         notify('Permission denied. You can change this in your browser settings.', 'error');
         localStorage.setItem('notificationPromptDismissed', 'true');
      }
    } catch (err) {
      console.error('Error requesting notification permission:', err);
    } finally {
      setOpen(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('notificationPromptDismissed', 'true');
    setOpen(false);
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (!val) handleDismiss();
      setOpen(val);
    }}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-900 border-none rounded-[24px] shadow-2xl p-0 overflow-hidden">
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-8 flex flex-col items-center text-center relative">
          <button 
             onClick={handleDismiss} 
             className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-white/20 hover:bg-white/30 text-white rounded-full transition-colors backdrop-blur-md"
          >
             <X size={16} />
          </button>
          
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg mb-6 shadow-indigo-900/20">
            <Bell className="w-8 h-8 text-indigo-600" />
          </div>
          
          <DialogTitle className="text-2xl font-bold text-white mb-2 tracking-tight">Stay updated</DialogTitle>
          <DialogDescription className="text-white/80 font-medium max-w-[280px]">
            Enable notifications to receive updates about your orders, exclusive discounts, and mystery box drops!
          </DialogDescription>
        </div>
        
        <div className="p-6 bg-white dark:bg-zinc-900 flex flex-col gap-3">
          <Button 
            onClick={handleAllow} 
            size="lg" 
            className="w-full rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-base py-6 shadow-md shadow-indigo-600/20"
          >
            Allow Notifications
          </Button>
          <Button 
            onClick={handleDismiss} 
            variant="ghost" 
            size="lg" 
            className="w-full rounded-2xl font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
          >
            Not Now
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
