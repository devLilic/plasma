import React from 'react';
import {createRoot} from 'react-dom/client';
import {Provider} from 'react-redux';
import axios from 'axios';
import {API} from '@/API/API';
import ArticlesList from '@/Components/Articles/ArticlesList';
import {store} from '@/Store/store';
import {articlesActions} from '@/Store/article/article.slice';
import {imagesActions} from '@/Store/image/image.slice';
import {Article, Image} from '@/types';
import '../../../resources/css/app.css';

declare global {
    interface Window {route: (name: string, params?: Record<string, string | number>) => string}
}

const imageData = (label: string, color: string) => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720"><defs><linearGradient id="g"><stop stop-color="${color}"/><stop offset="1" stop-color="#172033"/></linearGradient></defs><rect width="1280" height="720" fill="url(#g)"/><circle cx="970" cy="340" r="210" fill="#fff" fill-opacity=".12"/><text x="72" y="610" fill="white" font-family="sans-serif" font-size="56" font-weight="700">${label}</text></svg>`)}`;

const images: Image[] = [
    {id: 105, url: imageData('PREGĂTITĂ', '#2878ff'), thumbnailUrl: imageData('PREGĂTITĂ', '#2878ff'), sourceUrl: null, isNew: false, lastUsedAt: null, tags: [{id: 1, title: 'interviu'}]},
    {id: 106, url: imageData('PLASMA ACTIV', '#b42318'), thumbnailUrl: imageData('PLASMA ACTIV', '#b42318'), sourceUrl: null, isNew: false, lastUsedAt: null, tags: [{id: 2, title: 'reportaj'}]},
    {id: 107, url: imageData('PREVIEW URMĂTOR', '#00876c'), thumbnailUrl: imageData('PREVIEW URMĂTOR', '#00876c'), sourceUrl: null, isNew: false, lastUsedAt: null, tags: [{id: 3, title: 'economie'}]},
];

const graphic = (id: number, template: string, values: Array<{name: string; value: string; role: 'title' | 'short_title' | 'value'}>) => ({
    commandId: `${template}-${id}`, objectKey: `fixture-object-${id}`, memberObjectKeys: [`fixture-object-${id}`], revision: `fixture-revision-${id}`, editable: true, slug: template,
    editableObjects: values.map((field, index) => ({...field, type: 'text', fieldKey: `field-${id}-${index}`, importedValue: field.value, isOverridden: false, sourceChanged: false})),
});

const makeArticle = (id: number, order: number, title: string, imageId: number, template: string, fields: Array<{name: string; value: string; role: 'title' | 'short_title' | 'value'}>): Article => {
    const image = images.find(item => item.id === imageId)!;
    const mos = graphic(id, template, fields);
    return {
        id, block_title: title, title, subtitle: title, technical_title: title, slugs: '', intro: '',
        content_sections: [{slug: '', type: 'BETA', paragraphs: [`${title}. Primul paragraf editorial pentru previzualizarea fixture.`, 'Acesta este un paragraf secundar de exemplu.']}],
        article_type: 'BETA', article_types: ['BETA'], mos_objects: [mos],
        mos_timeline: [{kind: 'mos', position: 10, sourceLine: 1, count: null, object: mos, snippet: `${title}. Primul paragraf editorial`}, {kind: 'vox', position: 20, sourceLine: 4, count: 2, object: null, snippet: ''}],
        playlist_id: 44, playlist_order: order, image, current: id === 5, search_by: 'subtitle', enps_marker_color: id === 5 ? 'green' : id === 6 ? 'red' : 'yellow',
    };
};

const articles = [
    makeArticle(5, 5, 'Știrea pregătită', 105, '05_Titlu_Ultima_Ora', [{name: 'Titlu', value: 'Titlu pregătit pentru grafică', role: 'title'}, {name: 'Titlu scurt', value: 'Titlu pregătit', role: 'short_title'}]),
    makeArticle(6, 6, 'Știrea difuzată', 106, '06_Nume_Ultima_Ora', [{name: 'Nume', value: 'Ana Șerban', role: 'value'}, {name: 'Funcție', value: 'corespondent', role: 'value'}]),
    makeArticle(7, 7, 'Următoarea știre', 107, '05_Titlu_Ultima_Ora', [{name: 'Titlu', value: 'Proiectul se extinde', role: 'title'}, {name: 'Titlu scurt', value: 'Extindere', role: 'short_title'}]),
];

window.route = (name, params = {}) => {
    if (name === 'viewer.state') return '/fixture/viewer-state';
    if (name === 'viewer.command') return '/fixture/viewer-command';
    if (name === 'oscon.connection') return '/fixture/oscon-connection';
    if (name === 'profile.edit') return '/fixture/profile-edit';
    if (name === 'playlists.mos-overrides.index') return `/playlists/${params.playlist}/mos-overrides`;
    if (name === 'playlists.mos-overrides.destroy') return `/playlists/${params.playlist}/mos-overrides/${params.override}`;
    if (name === 'playlists.mos.update') return `/playlists/${params.playlist}/mos/${params.objectKey}`;
    if (name === 'playlists.mos.reset') return `/playlists/${params.playlist}/mos/${params.objectKey}`;
    return `/${name.replaceAll('.', '/')}`;
};

const activeViewer = () => ({visible: true, activeImage: {articleId: 6, imageId: 106, title: 'Știrea difuzată', url: images[1].url}, transform: {brightness: 100, contrast: 100, saturation: 100, zoom: 1, panX: 0, panY: 0, flipX: false}, transformDefaults: {brightness: 100, contrast: 100, saturation: 100, zoom: 1, panX: 0, panY: 0, flipX: false}, error: null});

const mockAdapter = async config => {
    const url = String(config.url || '');
    let data: unknown = {};
    if (url === '/fixture/viewer-state' || url === '/fixture/viewer-command') data = activeViewer();
    else if (url.includes('/images')) data = images;
    else if (url.endsWith('/mos-overrides')) data = {data: []};
    else if (url.includes('/mos/')) {
        const objectKey = url.split('/').pop();
        const object = articles.flatMap(article => article.mos_objects || []).find(item => item.objectKey === objectKey) || articles[0].mos_objects![0];
        data = {data: object};
    }
    return {data, status: 200, statusText: 'OK', headers: {}, config};
};
axios.defaults.adapter = mockAdapter;
API.defaults.adapter = mockAdapter;

const pendingSource = {playlistId: 44, articleId: 7, mosObjectKey: 'fixture-object-7', revision: 'fixture-revision-7'};
const osconState = {
    groups: [
        {id: 'headline', state: 'ON_AIR', busy: false, activeTemplate: '05_Titlu_Ultima_Ora', source: {playlistId: 44, articleId: 6, mosObjectKey: 'fixture-object-6', revision: 'fixture-revision-6'}, pending: null, personExpiresAt: null},
        {id: 'person', state: 'PENDING', busy: false, activeTemplate: null, source: null, pending: {commandId: 'fixture-pending', template: '06_Nume_Ultima_Ora', source: pendingSource}, personExpiresAt: Date.now() + 24_000},
    ],
};

const originalFetch = window.fetch.bind(window);
window.fetch = async (input, init) => {
    const url = String(input);
    if (url === '/fixture/oscon-connection') return Response.json({endpoint: 'http://oscon.fixture.invalid', token: 'fixture-token-only', timeoutMs: 10_000});
    if (url.startsWith('http://oscon.fixture.invalid/v1/')) {
        const path = new URL(url).pathname;
        if (path === '/v1/health') return Response.json({service: 'oscon', softwareVersion: '1.0.0-fixture', protocolVersion: 1, ready: true, capabilities: ['mos-profile-play-v1', 'group-state-v1', 'person-pending-v1', 'scoped-stop-v1', 'preset-play-v1']});
        if (path === '/v1/profiles') return Response.json({profiles: [], mosProfiles: [
            {id: 'profile-title', template: '05_Titlu_Ultima_Ora', group: 'headline', behavior: 'generic', params: ['TITLE', 'SHORT_TITLE']},
            {id: 'profile-person', template: '06_Nume_Ultima_Ora', group: 'person', behavior: 'person', params: ['NAME', 'ROLE']},
        ]});
        if (path === '/v1/state') return Response.json({state: osconState});
        return Response.json({ok: true, state: osconState});
    }
    return originalFetch(input, init);
};

store.dispatch(articlesActions.setArticles(articles));
store.dispatch(articlesActions.setCurrent({id: 5}));
store.dispatch(articlesActions.setPlaylist(44));
store.dispatch(imagesActions.setImages(images));

createRoot(document.getElementById('root')!).render(<Provider store={store}><div className="min-h-screen p-3 sm:p-5"><div className="mx-auto max-w-[1800px]"><ArticlesList playlistTitle="Știri · Ediția de seară"/></div></div></Provider>);
