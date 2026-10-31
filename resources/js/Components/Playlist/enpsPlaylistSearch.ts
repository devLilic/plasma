export type EnpsPlaylistSearchItem = {title: string};

export const ENPS_PLAYLIST_QUICK_FILTERS = ['1300', '1900', 'sport', 'weekend', 'Retrospectiva', 'Impact Global'] as const;

export const filterEnpsPlaylists = <T extends EnpsPlaylistSearchItem>(playlists: T[], search: string): T[] => {
    const query = search.trim().toLocaleLowerCase('ro');
    return query ? playlists.filter(playlist => playlist.title.toLocaleLowerCase('ro').includes(query)) : playlists;
};
