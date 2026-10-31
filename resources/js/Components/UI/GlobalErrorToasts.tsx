import {useEffect, useRef, useState, type ReactNode} from 'react';
import {createPortal} from 'react-dom';
import {CheckCircleIcon, ExclamationCircleIcon, XMarkIcon} from '@heroicons/react/24/outline';

interface ToastMessage {
    id: number
    message: string
    type: ToastType
}

type ToastType = 'error' | 'success';

export function GlobalErrorToasts({children}: {children: ReactNode}) {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    const nextId = useRef(0);

    useEffect(() => {
        const recentMessages = new Map<string, number>();

        const addToast = (message: string, type: ToastType = 'error') => {
            const dedupeKey = `${type}:${message}`;
            const now = Date.now();
            recentMessages.forEach((seenAt, seenMessage) => {
                if (now - seenAt >= 10000) recentMessages.delete(seenMessage);
            });
            if (now - (recentMessages.get(dedupeKey) || 0) < 2500) return;
            recentMessages.set(dedupeKey, now);
            setToasts(current => [...current, {id: ++nextId.current, message, type}]);
        };

        const collectAlerts = () => {
            document.querySelectorAll<HTMLElement>('[role="alert"]:not(.global-error-toast)').forEach(element => {
                const managed = element.dataset.plasmaToastManaged === 'true';
                if (!managed && (!element.getClientRects().length || getComputedStyle(element).visibility === 'hidden')) return;

                const message = (element.innerText || element.textContent || '').trim();
                if (!message) return;

                element.dataset.plasmaToastManaged = 'true';
                element.hidden = true;

                if (element.dataset.plasmaToastMessage === message) return;
                element.dataset.plasmaToastMessage = message;
                addToast(message, element.dataset.plasmaToastType === 'success' ? 'success' : 'error');
            });
        };

        const collectToastEvent = (event: Event) => {
            const detail = (event as CustomEvent<{message?: string; type?: ToastType}>).detail;
            const message = detail?.message?.trim();
            if (message) addToast(message, detail?.type === 'success' ? 'success' : 'error');
        };

        const observer = new MutationObserver(collectAlerts);
        observer.observe(document.body, {subtree: true, childList: true, characterData: true});
        window.addEventListener('plasma:toast', collectToastEvent);
        collectAlerts();
        return () => {
            observer.disconnect();
            window.removeEventListener('plasma:toast', collectToastEvent);
        };
    }, []);

    useEffect(() => {
        if (!toasts.length) return;
        const timers = toasts.map(toast => window.setTimeout(() => {
            setToasts(current => current.filter(item => item.id !== toast.id));
        }, 7000));
        return () => timers.forEach(window.clearTimeout);
    }, [toasts]);

    const dismiss = (id: number) => setToasts(current => current.filter(toast => toast.id !== id));

    return <>{children}{toasts.length > 0 && createPortal(
        <div className="global-error-toasts" aria-label="Erori recente" aria-live="assertive" aria-relevant="additions text">
            {toasts.map(toast => <div className={`global-error-toast global-error-toast--${toast.type}`} role="alert" key={toast.id}>
                {toast.type === 'success'
                    ? <CheckCircleIcon className="global-error-toast-icon" aria-hidden="true"/>
                    : <ExclamationCircleIcon className="global-error-toast-icon" aria-hidden="true"/>}
                <p>{toast.message}</p>
                <button type="button" aria-label="Închide notificarea" onClick={() => dismiss(toast.id)}><XMarkIcon className="h-4 w-4"/></button>
            </div>)}
        </div>, document.body,
    )}</>;
}
