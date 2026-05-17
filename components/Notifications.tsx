
import React, { useState, createContext, useContext } from 'react';
import { toast, Toaster } from 'sonner';
import { Modal } from './ui/modal';

type ToastType = 'success' | 'error' | 'info';

interface ConfirmOptions {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
}

interface AlertOptions {
  title: string;
  message: string;
  buttonText?: string;
  onClose?: () => void;
}

interface PromptOptions {
  title: string;
  message: string;
  placeholder?: string;
  onConfirm: (val: string) => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  required?: boolean;
}

interface FullScreenInfoOptions {
  title: string;
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
  buttonText?: string;
}

interface ToastContextType {
  notify: (message: string, type?: ToastType) => void;
  confirm: (options: ConfirmOptions) => void;
  alert: (options: AlertOptions) => void;
  prompt: (options: PromptOptions) => void;
  fullScreenInfo: (options: FullScreenInfoOptions) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [confirmModal, setConfirmModal] = useState<ConfirmOptions | null>(null);
  const [alertModal, setAlertModal] = useState<AlertOptions | null>(null);
  const [promptModal, setPromptModal] = useState<PromptOptions | null>(null);
  const [fullScreenModal, setFullScreenModal] = useState<FullScreenInfoOptions | null>(null);
  
  const [promptVal, setPromptVal] = useState("");

  const notify = (message: string, type: ToastType = 'info') => {
    if (type === 'success') toast.success(message);
    else if (type === 'error') toast.error(message);
    else toast.info(message);
  };

  const confirm = (options: ConfirmOptions) => setConfirmModal(options);
  const alert = (options: AlertOptions) => setAlertModal(options);
  const prompt = (options: PromptOptions) => {
    setPromptVal("");
    setPromptModal(options);
  };
  const fullScreenInfo = (options: FullScreenInfoOptions) => setFullScreenModal(options);

  return (
    <ToastContext.Provider value={{ notify, confirm, alert, prompt, fullScreenInfo }}>
      {children}
      <Toaster position="top-right" duration={4000} richColors style={{ zIndex: 999999 }} />
      
      <Modal.Modal zIndex={200000} active={!!confirmModal} onClickOutside={() => { confirmModal?.onCancel?.(); setConfirmModal(null); }}>
        <Modal.Body>
          <Modal.Title>{confirmModal?.title}</Modal.Title>
          <Modal.Subtitle>{confirmModal?.message}</Modal.Subtitle>
        </Modal.Body>
        <Modal.Actions>
          <Modal.Action variant="unstyled" onClick={() => { confirmModal?.onCancel?.(); setConfirmModal(null); }}>
            {confirmModal?.cancelText || 'Cancel'}
          </Modal.Action>
          <Modal.Action onClick={() => { confirmModal?.onConfirm(); setConfirmModal(null); }}>
            {confirmModal?.confirmText || 'Confirm'}
          </Modal.Action>
        </Modal.Actions>
      </Modal.Modal>

      <Modal.Modal zIndex={200000} active={!!alertModal} onClickOutside={() => { alertModal?.onClose?.(); setAlertModal(null); }}>
        <Modal.Body>
          <Modal.Title>{alertModal?.title}</Modal.Title>
          <Modal.Subtitle>{alertModal?.message}</Modal.Subtitle>
        </Modal.Body>
        <Modal.Actions>
          <Modal.Action onClick={() => { alertModal?.onClose?.(); setAlertModal(null); }}>
            {alertModal?.buttonText || 'OK'}
          </Modal.Action>
        </Modal.Actions>
      </Modal.Modal>

      <Modal.Modal zIndex={200000} active={!!promptModal} onClickOutside={() => { promptModal?.onCancel?.(); setPromptModal(null); }}>
        <Modal.Body>
          <Modal.Title>{promptModal?.title}</Modal.Title>
          <Modal.Subtitle>{promptModal?.message}</Modal.Subtitle>
          <div className="mt-4">
            <input
              type="text"
              className="w-full px-4 py-2 border rounded-lg dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
              placeholder={promptModal?.placeholder || "Enter reason..."}
              value={promptVal}
              onChange={(e) => setPromptVal(e.target.value)}
            />
          </div>
        </Modal.Body>
        <Modal.Actions>
          <Modal.Action variant="unstyled" onClick={() => { promptModal?.onCancel?.(); setPromptModal(null); }}>
            {promptModal?.cancelText || 'Cancel'}
          </Modal.Action>
          <Modal.Action onClick={() => { 
            if (promptModal?.required && !promptVal.trim()) return notify("Please enter a value", "error");
            promptModal?.onConfirm(promptVal); 
            setPromptModal(null); 
          }}>
            {promptModal?.confirmText || 'Submit'}
          </Modal.Action>
        </Modal.Actions>
      </Modal.Modal>

      {!!fullScreenModal && (
        <div 
           className="fixed inset-0 flex flex-col items-center justify-center bg-zinc-900/40 backdrop-blur-md p-6"
           style={{ zIndex: 200000 }}
        >
          <div className="bg-white dark:bg-zinc-900 rounded-[32px] p-10 w-full max-w-lg shadow-2xl text-center flex flex-col items-center animate-stagger-1 border border-zinc-100 dark:border-zinc-800">
            {fullScreenModal.type === 'success' && (
              <div className="w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-6">
                <i className="fas fa-check text-4xl text-green-600 dark:text-green-400"></i>
              </div>
            )}
            {fullScreenModal.type === 'error' && (
              <div className="w-24 h-24 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-6">
                <i className="fas fa-times text-4xl text-red-600 dark:text-red-400"></i>
              </div>
            )}
            <h2 className="text-3xl font-bold mb-4 font-outfit text-zinc-900 dark:text-white">{fullScreenModal.title}</h2>
            <p className="text-lg text-zinc-500 font-medium mb-10 leading-relaxed text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">{fullScreenModal.message}</p>
            <button onClick={() => { fullScreenModal.onClose(); setFullScreenModal(null); }} className="w-full max-w-xs py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-full font-bold text-sm tracking-wide shadow-lg hover:opacity-90 transition-opacity">
              {fullScreenModal.buttonText || 'Continue'}
            </button>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
};

export const useNotify = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useNotify must be used within ToastProvider");
  return context.notify;
};

export const useConfirm = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useConfirm must be used within ToastProvider");
  return context.confirm;
};

export const useAlert = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useAlert must be used within ToastProvider");
  return context.alert;
};

export const usePromptModal = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("usePrompt must be used within ToastProvider");
  return context.prompt;
};

export const useFullScreenInfo = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useFullScreenInfo must be used within ToastProvider");
  return context.fullScreenInfo;
};
