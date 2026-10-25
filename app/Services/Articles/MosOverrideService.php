<?php

namespace App\Services\Articles;

use App\Models\Article;
use App\Models\Playlist;
use App\Models\PlaylistEnpsItem;
use App\Models\PlaylistMosOverride;
use App\Services\Enps\EnpsBasicContent;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class MosOverrideService
{
    /** Return only safe, current source objects decorated with local overrides. */
    public function objectsForArticle(Article $article, bool $applyOverrides = true): array
    {
        $rawObjects = $article->mos_objects ?: [];
        if ($rawObjects === []) {
            return [];
        }

        $sourceRows = $this->sourceRows($article);
        $objects = [];
        foreach ($rawObjects as $raw) {
            if (! is_array($raw)) {
                continue;
            }
            $origins = $this->matchingOrigins($raw, $sourceRows);
            $objects[] = $this->identityDescriptor($article->playlist_id, $raw, $origins);
        }

        // A collision means the supposedly stable source identity does not uniquely
        // identify one current object. Fail closed instead of applying either value.
        $counts = [];
        foreach ($objects as $object) {
            if ($object['objectKey'] !== null) {
                $counts[$object['objectKey']] = ($counts[$object['objectKey']] ?? 0) + 1;
            }
        }
        foreach ($objects as &$object) {
            if ($object['objectKey'] !== null && ($counts[$object['objectKey']] ?? 0) > 1) {
                $object['objectKey'] = null;
                $object['fieldKeys'] = [];
                $object['editable'] = false;
            }
        }
        unset($object);

        $memberKeysByTimelineKey = [];
        foreach ($objects as $object) {
            if ($object['objectKey'] !== null) {
                $memberKeysByTimelineKey[$this->timelineKey($object['raw'])][] = $object['objectKey'];
            }
        }
        foreach ($objects as &$object) {
            $object['memberObjectKeys'] = $object['objectKey'] === null
                ? []
                : array_values(array_unique($memberKeysByTimelineKey[$this->timelineKey($object['raw'])] ?? [$object['objectKey']]));
        }
        unset($object);

        $fieldKeys = collect($objects)->flatMap(fn ($object) => array_values($object['fieldKeys']))->unique()->values();
        $overrides = ! $applyOverrides || $fieldKeys->isEmpty() ? collect() : PlaylistMosOverride::query()
            ->where('playlist_id', $article->playlist_id)->whereIn('field_key', $fieldKeys)->get()->keyBy('field_key');
        $objects = $this->overlayFields($objects, $overrides);

        // Every object in a title-content group shares a revision so an explicit
        // apply-to-members write cannot race with a sibling edit.
        foreach ($objects as &$object) {
            $object['revision'] = $this->revisionForMembers($article->playlist_id, $object['memberObjectKeys'], $objects);
        }
        unset($object);
        foreach ($objects as &$object) {
            unset($object['raw'], $object['fieldKeys']);
        }
        unset($object);

        return $objects;
    }

    /** @return array{objectKey:?string,memberObjectKeys:array,revision:string,editable:bool,editableObjects:array} */
    public function objectForArticle(Article $article, string $objectKey): array
    {
        foreach ($this->objectsForArticle($article) as $object) {
            if ($object['objectKey'] === $objectKey) {
                return $object;
            }
        }

        throw new MosOverrideNotFound('Obiectul MOS nu mai este disponibil în sursa curentă.');
    }

    public function update(Playlist $playlist, string $objectKey, string $revision, array $fields, bool $applyToMembers): array
    {
        return DB::transaction(function () use ($playlist, $objectKey, $revision, $fields, $applyToMembers) {
            Playlist::query()->whereKey($playlist->id)->lockForUpdate()->firstOrFail();
            [$article, $sourceObjects] = $this->findSourceObject($playlist, $objectKey);
            $selected = $this->objectForArticle($article, $objectKey);
            $this->assertEditable($selected, $revision, $sourceObjects);
            foreach ($fields as $field) {
                if (! $this->fieldByKey($selected, $field['fieldKey'])) {
                    throw new MosOverrideNotEditable('Câmpul MOS nu aparține obiectului selectat.');
                }
            }
            $targets = $applyToMembers ? $selected['memberObjectKeys'] : [$objectKey];
            $targetFields = $this->targetFields($article, $targets, $selected, $fields, $applyToMembers);

            PlaylistMosOverride::query()->where('playlist_id', $playlist->id)->whereIn('object_key', $targets)->lockForUpdate()->get();
            foreach ($targetFields as $target) {
                PlaylistMosOverride::query()->updateOrCreate(
                    ['playlist_id' => $playlist->id, 'field_key' => $target['fieldKey']],
                    [
                        'object_key' => $target['objectKey'],
                        'field_name' => $target['fieldName'],
                        'override_value' => $target['value'],
                        'source_fingerprint' => hash('sha256', $target['importedValue']),
                    ],
                );
            }

            return $this->objectForArticle($article->fresh(), $objectKey);
        });
    }

    public function reset(Playlist $playlist, string $objectKey, string $revision, bool $applyToMembers): array
    {
        return DB::transaction(function () use ($playlist, $objectKey, $revision, $applyToMembers) {
            Playlist::query()->whereKey($playlist->id)->lockForUpdate()->firstOrFail();
            [$article, $sourceObjects] = $this->findSourceObject($playlist, $objectKey);
            $selected = $this->objectForArticle($article, $objectKey);
            $this->assertEditable($selected, $revision, $sourceObjects);
            $targets = $applyToMembers ? $selected['memberObjectKeys'] : [$objectKey];
            PlaylistMosOverride::query()->where('playlist_id', $playlist->id)->whereIn('object_key', $targets)->delete();

            return $this->objectForArticle($article->fresh(), $objectKey);
        });
    }

    public function orphanOverrides(Playlist $playlist): array
    {
        $activeFieldKeys = [];
        foreach ($playlist->articles()->get() as $article) {
            foreach ($this->objectsForArticle($article) as $object) {
                foreach ($object['editableObjects'] as $field) {
                    if (is_string($field['fieldKey'] ?? null)) {
                        $activeFieldKeys[$field['fieldKey']] = true;
                    }
                }
            }
        }

        return PlaylistMosOverride::query()->where('playlist_id', $playlist->id)->get()
            ->reject(fn (PlaylistMosOverride $override) => isset($activeFieldKeys[$override->field_key]))
            ->map(fn (PlaylistMosOverride $override) => [
                'id' => $override->id,
                'objectKey' => $override->object_key,
                'fieldKey' => $override->field_key,
                'fieldName' => $override->field_name,
                'value' => $override->override_value,
                'sourceChanged' => true,
                'createdAt' => $override->created_at?->toIso8601String(),
                'updatedAt' => $override->updated_at?->toIso8601String(),
            ])->values()->all();
    }

    public function deleteOverride(Playlist $playlist, PlaylistMosOverride $override): void
    {
        if ((int) $override->playlist_id !== (int) $playlist->id) {
            throw new MosOverrideNotFound('Corecția MOS nu există în acest playlist.');
        }
        $override->delete();
    }

    public function deleteOrphan(Playlist $playlist, PlaylistMosOverride $override): void
    {
        if ((int) $override->playlist_id !== (int) $playlist->id) {
            throw new MosOverrideNotFound('Corecția MOS nu există în acest playlist.');
        }
        if ($this->activeFieldKeys($playlist)->contains($override->field_key)) {
            throw new MosOverrideNotEditable('Corecția este activă; reseteaz-o din obiectul MOS curent.');
        }
        $override->delete();
    }

    private function sourceRows(Article $article): Collection
    {
        if (! $article->playlist_id || ! $article->playlist || $article->playlist->source_type !== 'enps') {
            return collect();
        }
        $slugs = array_values(array_filter(explode('||', (string) $article->slugs)));
        if ($slugs === []) {
            return collect();
        }

        return PlaylistEnpsItem::query()->where('playlist_id', $article->playlist_id)->whereIn('slug', $slugs)
            ->orderBy('position')->get(['source_database', 'source_guid', 'slug', 'mos_objects']);
    }

    private function matchingOrigins(array $raw, Collection $sourceRows): array
    {
        $origins = [];
        foreach ($sourceRows as $row) {
            foreach (($row->mos_objects ?: []) as $candidate) {
                if ($this->sameMosObject($raw, $candidate)) {
                    $origin = ['database' => (string) $row->source_database, 'guid' => (string) $row->source_guid];
                    $origins[json_encode($origin, JSON_THROW_ON_ERROR)] = $origin;
                    break;
                }
            }
        }

        $origins = array_values($origins);
        usort($origins, fn ($left, $right) => [$left['database'], $left['guid']] <=> [$right['database'], $right['guid']]);

        return $origins;
    }

    /** Resolve source membership from MOS IDs; mutable field data is not identity. */
    private function sameMosObject(array $left, mixed $right): bool
    {
        if (! is_array($right)) {
            return false;
        }
        foreach (['commandId', 'itemId', 'objectId', 'mosId'] as $key) {
            if ((string) ($left[$key] ?? '') !== (string) ($right[$key] ?? '')) {
                return false;
            }
        }

        return (string) ($left['commandId'] ?? '') !== '';
    }

    private function identityDescriptor(int|string|null $playlistId, array $raw, array $origins): array
    {
        $editableObjects = is_array($raw['editableObjects'] ?? null) ? $raw['editableObjects'] : [];
        if ($origins === [] || ! is_string($raw['commandId'] ?? null) || $raw['commandId'] === '') {
            return ['raw' => $raw, 'objectKey' => null, 'commandId' => (string) ($raw['commandId'] ?? ''),
                'slug' => (string) ($raw['slug'] ?? ''), 'fieldKeys' => [], 'editable' => false,
                'editableObjects' => $editableObjects];
        }
        $stableObject = [
            'playlist' => $playlistId,
            // The exact set of containing ENPS records is part of identity. A
            // changed set intentionally leaves the previous correction orphaned.
            'origins' => $origins,
            'mos' => array_intersect_key($raw, array_flip(['commandId', 'itemId', 'objectId', 'mosId', 'slug'])),
        ];
        $objectKey = 'o_'.hash('sha256', json_encode($stableObject, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR));
        $fieldKeys = [];
        $fieldsEditable = true;
        $normalizedNames = [];
        foreach ($editableObjects as $index => $field) {
            if (! is_array($field) || ! is_string($field['name'] ?? null) || ! is_string($field['value'] ?? null)) {
                $fieldKeys[$index] = null;
                $fieldsEditable = false;
                continue;
            }
            $normalizedName = $this->normalizedFieldName($field['name']);
            if ($normalizedName === '') {
                $fieldKeys[$index] = null;
                $fieldsEditable = false;
                continue;
            }
            $normalizedNames[$normalizedName] = ($normalizedNames[$normalizedName] ?? 0) + 1;
            $fieldKeys[$index] = 'f_'.hash('sha256', json_encode([$objectKey, $normalizedName], JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR));
        }
        if ($editableObjects === [] || in_array(2, $normalizedNames, true) || max($normalizedNames ?: [0]) > 1) {
            // Repeated field names have no source ID to distinguish them. Do not
            // use their array position, which can change on refresh.
            $fieldKeys = array_fill_keys(array_keys($editableObjects), null);
            $fieldsEditable = false;
        }

        return ['raw' => $raw, 'objectKey' => $objectKey,
            'commandId' => (string) ($raw['commandId'] ?? ''), 'slug' => (string) ($raw['slug'] ?? ''),
            'fieldKeys' => $fieldKeys,
            'editable' => $fieldsEditable, 'editableObjects' => $editableObjects];
    }

    private function overlayFields(array $objects, Collection $overrides): array
    {
        foreach ($objects as &$object) {
            $fields = [];
            foreach ($object['editableObjects'] as $index => $field) {
                $fieldKey = $object['fieldKeys'][$index] ?? null;
                $override = is_string($fieldKey) ? $overrides->get($fieldKey) : null;
                $importedValue = is_string($field['value'] ?? null) ? $field['value'] : '';
                $sourceFingerprint = hash('sha256', $importedValue);
                $fields[] = [
                    'type' => (string) ($field['type'] ?? ''),
                    'name' => (string) ($field['name'] ?? ''),
                    'role' => EnpsBasicContent::editableRole((string) ($field['name'] ?? '')),
                    'fieldKey' => $fieldKey,
                    'importedValue' => $importedValue,
                    'value' => $override ? (string) $override->override_value : $importedValue,
                    'isOverridden' => $override !== null,
                    'sourceChanged' => $override !== null && ! hash_equals((string) $override->source_fingerprint, $sourceFingerprint),
                ];
            }
            $object['editableObjects'] = $fields;
        }
        unset($object);

        return $objects;
    }

    private function revisionForMembers(int|string|null $playlistId, array $memberKeys, array $objects): string
    {
        $memberKeys = array_values(array_unique(array_filter($memberKeys, 'is_string')));
        $fieldState = [];
        foreach ($objects as $object) {
            if (! in_array($object['objectKey'], $memberKeys, true)) {
                continue;
            }
            foreach ($object['editableObjects'] as $index => $field) {
                $key = $object['fieldKeys'][$index] ?? null;
                if (is_string($key)) {
                    $fieldState[$key] = hash('sha256', (string) ($field['importedValue'] ?? $field['value'] ?? ''));
                }
            }
        }
        ksort($fieldState);
        $overrides = $memberKeys === [] ? [] : PlaylistMosOverride::query()->where('playlist_id', $playlistId)
            ->whereIn('object_key', $memberKeys)->orderBy('field_key')->get(['field_key', 'override_value', 'source_fingerprint'])
            ->map(fn (PlaylistMosOverride $item) => [$item->field_key, hash('sha256', $item->override_value), $item->source_fingerprint])->all();

        return hash('sha256', json_encode([$memberKeys, $fieldState, $overrides], JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR));
    }

    private function timelineKey(array $raw): string
    {
        $titles = [];
        foreach (($raw['editableObjects'] ?? []) as $field) {
            if (! is_array($field) || ! is_string($field['name'] ?? null) || ! is_string($field['value'] ?? null)) {
                continue;
            }
            $role = EnpsBasicContent::editableRole($field['name']);
            if (in_array($role, ['title', 'short_title'], true) && trim($field['value']) !== '') {
                $titles[$role][] = $this->normalizedTimelineText($field['value']);
            }
        }
        if ($titles !== []) {
            ksort($titles);

            return 'title:'.json_encode($titles, JSON_THROW_ON_ERROR);
        }

        return 'command:'.(string) ($raw['commandId'] ?? '');
    }

    private function normalizedTimelineText(string $value): string
    {
        return trim(preg_replace('/[^a-z0-9]+/', ' ', strtolower(Str::ascii($value, 'ro'))));
    }

    private function findSourceObject(Playlist $playlist, string $objectKey): array
    {
        foreach ($playlist->articles()->get() as $article) {
            $descriptors = $this->objectsForArticle($article);
            foreach ($descriptors as $descriptor) {
                if ($descriptor['objectKey'] === $objectKey) {
                    return [$article, $descriptors];
                }
            }
        }

        throw new MosOverrideNotFound('Obiectul MOS nu mai este disponibil în sursa curentă.');
    }

    private function activeFieldKeys(Playlist $playlist): Collection
    {
        return $playlist->articles()->get()->flatMap(function (Article $article) {
            return collect($this->objectsForArticle($article))->flatMap(fn ($object) => collect($object['editableObjects'])
                ->pluck('fieldKey')->filter(fn ($key) => is_string($key)));
        })->unique()->values();
    }

    private function assertEditable(array $object, string $revision, array $sourceObjects): void
    {
        if (! $object['editable']) {
            throw new MosOverrideNotEditable('Identitatea sursei MOS este ambiguă sau obiectul nu mai este disponibil.');
        }
        if (! hash_equals((string) $object['revision'], $revision)) {
            throw new MosOverrideConflict($object);
        }
    }

    private function targetFields(Article $article, array $targetKeys, array $selected, array $requestedFields, bool $allowMemberMapping): array
    {
        $targets = [];
        foreach ($targetKeys as $targetKey) {
            $target = null;
            foreach ($this->objectsForArticle($article) as $object) {
                if ($object['objectKey'] === $targetKey) {
                    $target = $object;
                    break;
                }
            }
            if (! $target || ! $target['editable']) {
                throw new MosOverrideNotEditable('Unul dintre obiectele MOS selectate nu are identitate stabilă.');
            }
            foreach ($requestedFields as $requested) {
                $sourceField = $this->fieldByKey($target, $requested['fieldKey']);
                if (! $sourceField) {
                    // For an explicit group edit, map by canonical field name and
                    // unique canonical field name; never by field position or value.
                    if (! $allowMemberMapping) {
                        throw new MosOverrideNotEditable('Câmpul MOS nu aparține obiectului selectat.');
                    }
                    $origin = $this->findRequestField($selected, $requested['fieldKey']);
                    if (! $origin) {
                        throw new MosOverrideNotEditable('Câmpul MOS nu mai există în sursa curentă.');
                    }
                    $sourceField = $this->fieldByName($target, $origin['normalizedName']);
                }
                if (! $sourceField || ! is_string($sourceField['fieldKey'] ?? null)) {
                    throw new MosOverrideNotEditable('Câmpul MOS lipsește din unul dintre obiectele selectate.');
                }
                $targets[] = [
                    'objectKey' => $targetKey,
                    'fieldKey' => $sourceField['fieldKey'],
                    'fieldName' => $sourceField['name'],
                    'importedValue' => $sourceField['importedValue'],
                    'value' => $requested['value'],
                ];
            }
        }

        return $targets;
    }

    private function fieldByKey(array $object, string $fieldKey): ?array
    {
        foreach ($object['editableObjects'] as $field) {
            if (($field['fieldKey'] ?? null) === $fieldKey) {
                return $field;
            }
        }

        return null;
    }

    private function findRequestField(array $object, string $fieldKey): ?array
    {
        foreach ($object['editableObjects'] as $field) {
            if (($field['fieldKey'] ?? null) === $fieldKey) {
                return ['normalizedName' => $this->normalizedFieldName($field['name'])];
            }
        }

        return null;
    }

    private function fieldByName(array $object, string $normalizedName): ?array
    {
        $match = null;
        foreach ($object['editableObjects'] as $field) {
            if ($this->normalizedFieldName($field['name'] ?? '') === $normalizedName) {
                if ($match !== null) {
                    return null;
                }
                $match = $field;
            }
        }

        return $match;
    }

    private function normalizedFieldName(string $name): string
    {
        return mb_strtolower(trim(preg_replace('/[\s\p{Z}]+/u', ' ', $name) ?? $name));
    }
}

