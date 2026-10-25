import {useEffect, useState} from 'react';
import {ArrowPathIcon, LinkIcon, SignalIcon} from '@heroicons/react/24/outline';
import {Article} from '@/types';
import {OsconGroupState, OsconLastCommand, OsconProfile, OsconConnectionStatus} from './useOsconController';

interface Props {
    articles: Article[]
    status: OsconConnectionStatus
    profiles: OsconProfile[]
    softwareVersion: string | null
    groups: OsconGroupState[]
    lastCommand: OsconLastCommand | null
    error: string | null
    errorHint: string | null
    busy: boolean
    lastStateAt: number | null
    onConnect: () => void
    onDisconnect: () => void
    onRefresh: () => void
    onStop: (template: string, scope: 'profile' | 'group') => Promise<void>
}

export function OsconOperatorBar({articles, status, profiles, softwareVersion, groups, lastCommand, error, errorHint, busy, lastStateAt, onConnect, onDisconnect, onRefresh, onStop}: Props) {
    const [now, setNow] = useState(Date.now());
    useEffect(() => {
        if (status !== 'connected') return;
        const timer = window.setInterval(() => setNow(Date.now()), 500);
        return () => window.clearInterval(timer);
    }, [status]);
    const articleById = new Map(articles.map(article => [article.id, article]));
    const groupIds = [...new Set([...profiles.map(profile => profile.group), ...groups.map(group => group.id)])];
    const operatorGroups = groupIds.map(id => groups.find(group => group.id === id) || ({id, state: 'UNKNOWN', busy: false, activeTemplate: null, source: null, pending: null, personExpiresAt: null} satisfies OsconGroupState));
    const statusLabel = status === 'connected' ? 'OSCon conectat' : status === 'connecting' ? 'Se conectează…' : status === 'stale' ? 'OSCon fără stare recentă' : status === 'error' ? 'OSCon indisponibil' : 'OSCon neverificat';
    const lastCommandLabel = lastCommand ? `${lastCommand.status === 'sending' ? 'Se trimite' : lastCommand.status === 'pending' ? 'În așteptare' : lastCommand.status === 'uncertain' ? 'Rezultat incert' : lastCommand.status === 'failed' ? 'Eșuat' : 'Acceptat'} · ${lastCommand.template} · ${lastCommand.articleTitle}` : '';

    return <section className="oscon-operator-bar" aria-label="Conexiune și stare OSCon">
        <div className="oscon-operator-top">
            <div className="oscon-connect-state"><span className={`oscon-status-dot ${status}`} /><div><strong>{statusLabel}</strong><small>{status === 'connected' ? `OSCon ${softwareVersion || '—'} · ${profiles.length} profiluri · ${lastStateAt ? `actualizat ${new Date(lastStateAt).toLocaleTimeString()}` : 'stare citită'}` : 'Conectarea și citirea stării sunt explicite.'}</small></div></div>
            <div className="oscon-actions">
                {(status === 'unchecked' || status === 'error' || status === 'stale')
                    ? <button type="button" className="oscon-primary" disabled={busy} onClick={onConnect}><SignalIcon className="h-4 w-4"/>{busy ? 'Se conectează…' : status === 'unchecked' ? 'Conectează OSCon' : 'Reconectează explicit'}</button>
                    : <><button type="button" className="oscon-secondary" disabled={busy} onClick={onRefresh}><ArrowPathIcon className="h-4 w-4"/>Reîmprospătează starea</button><button type="button" className="oscon-secondary" disabled={busy} onClick={onDisconnect}>Deconectează</button></>}
                <a className="oscon-settings-link" href={`${route('profile.edit')}#oscon`}><LinkIcon className="h-4 w-4"/>Setări OSCon</a>
            </div>
        </div>
        {error && <div className="oscon-bar-error" role="alert"><p>{error}</p>{errorHint && <small>{errorHint}</small>}</div>}
        {lastCommand && <p className={`oscon-last-command ${lastCommand.status}`} role="status">{lastCommandLabel}{lastCommand.error ? ` — ${lastCommand.error}` : ''}</p>}
        {!!operatorGroups.length && <div className="oscon-group-states">{operatorGroups.map(group => {
            const activeSourceArticle = group.source ? articleById.get(group.source.articleId) : undefined;
            const pendingSourceArticle = group.pending?.source ? articleById.get(group.pending.source.articleId) : undefined;
            const expires = group.personExpiresAt ? Math.max(0, Math.ceil((group.personExpiresAt - now) / 1000)) : null;
            const template = group.pending?.template || group.activeTemplate || profiles.find(profile => profile.group === group.id)?.template;
            const stateLabel = group.state === 'UNKNOWN' ? 'Necunoscută' : group.state === 'NEEDS_RESYNC' ? 'Necesită STOP / resync' : group.state === 'OFF' ? 'Oprit' : group.state;
            return <div className="oscon-group-state" key={group.id}>
                <span className="oscon-group-name">{group.id}</span>
                <span>{group.busy ? 'În curs' : stateLabel}</span>
                {group.activeTemplate && <span>Activ · {group.activeTemplate}</span>}
                {activeSourceArticle && <span className="oscon-group-source">Activ · {activeSourceArticle.subtitle || activeSourceArticle.title || activeSourceArticle.technical_title}</span>}
                {group.source && !activeSourceArticle && <span className="oscon-group-source">Sursă activă #{group.source.articleId}</span>}
                {group.pending && <span>În așteptare · {group.pending.template}</span>}
                {pendingSourceArticle && <span className="oscon-group-source">Pending · {pendingSourceArticle.subtitle || pendingSourceArticle.title || pendingSourceArticle.technical_title}</span>}
                {group.pending?.source && !pendingSourceArticle && <span className="oscon-group-source">Sursă pending #{group.pending.source.articleId}</span>}
                {expires !== null && <span className="oscon-person-timer">Person expiră în {expires}s</span>}
                {template && <button type="button" disabled={busy || status !== 'connected'} onClick={() => void onStop(template, 'group')}>{group.state === 'UNKNOWN' || group.state === 'NEEDS_RESYNC' ? 'STOP / RESYNC' : 'STOP grup'}</button>}
            </div>;
        })}</div>}
    </section>;
}
