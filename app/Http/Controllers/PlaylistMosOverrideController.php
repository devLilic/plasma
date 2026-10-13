<?php

namespace App\Http\Controllers;

use App\Models\Playlist;
use App\Models\PlaylistMosOverride;
use App\Services\Articles\MosOverrideConflict;
use App\Services\Articles\MosOverrideNotEditable;
use App\Services\Articles\MosOverrideNotFound;
use App\Services\Articles\MosOverrideService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class PlaylistMosOverrideController extends Controller
{
    public function update(Request $request, Playlist $playlist, string $objectKey, MosOverrideService $overrides): JsonResponse
    {
        $payload = $this->jsonPayload($request);
        $validated = Validator::make($payload, [
            'revision' => ['required', 'string', 'size:64', 'regex:/^[a-f0-9]{64}$/'],
            'fields' => ['required', 'array', 'min:1', 'max:100'],
            'fields.*.fieldKey' => ['required', 'string', 'regex:/^f_[a-f0-9]{64}$/'],
            // MOS text is exact source data: empty strings and surrounding
            // whitespace are meaningful, so validate presence rather than required.
            'fields.*.value' => ['present', 'string', 'max:20000'],
            'applyToMembers' => ['required', 'boolean'],
        ])->validate();
        $this->assertKeys($payload, ['revision', 'fields', 'applyToMembers']);
        foreach ($payload['fields'] as $field) {
            if (! is_array($field)) {
                throw ValidationException::withMessages(['fields' => 'Câmpurile salvării MOS sunt invalide.']);
            }
            if (array_diff(array_keys($field), ['fieldKey', 'value']) !== []) {
                throw ValidationException::withMessages(['fields' => 'Câmpurile salvării MOS sunt invalide.']);
            }
            if (preg_match('/[\x00-\x08\x0B\x0C\x0E-\x1F]/', $field['value'])) {
                throw ValidationException::withMessages(['fields' => 'Valorile MOS nu pot conține caractere de control.']);
            }
        }
        $this->assertUniqueFields($validated['fields']);

        try {
            $object = $overrides->update($playlist, $objectKey, $validated['revision'], $validated['fields'], (bool) $validated['applyToMembers']);
        } catch (MosOverrideConflict $exception) {
            return response()->json(['message' => $exception->getMessage(), 'current' => $exception->current], 409);
        } catch (MosOverrideNotFound $exception) {
            return response()->json(['message' => $exception->getMessage()], 404);
        } catch (MosOverrideNotEditable $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }

        return response()->json(['data' => $object]);
    }

    public function reset(Request $request, Playlist $playlist, string $objectKey, MosOverrideService $overrides): JsonResponse
    {
        $payload = $this->jsonPayload($request);
        $validated = Validator::make($payload, [
            'revision' => ['required', 'string', 'size:64', 'regex:/^[a-f0-9]{64}$/'],
            'applyToMembers' => ['required', 'boolean'],
        ])->validate();
        $this->assertKeys($payload, ['revision', 'applyToMembers']);

        try {
            $object = $overrides->reset($playlist, $objectKey, $validated['revision'], (bool) $validated['applyToMembers']);
        } catch (MosOverrideConflict $exception) {
            return response()->json(['message' => $exception->getMessage(), 'current' => $exception->current], 409);
        } catch (MosOverrideNotFound $exception) {
            return response()->json(['message' => $exception->getMessage()], 404);
        } catch (MosOverrideNotEditable $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }

        return response()->json(['data' => $object]);
    }

    public function index(Playlist $playlist, MosOverrideService $overrides): JsonResponse
    {
        return response()->json(['data' => $overrides->orphanOverrides($playlist)]);
    }

    public function destroy(Playlist $playlist, PlaylistMosOverride $override, MosOverrideService $overrides): JsonResponse
    {
        try {
            $overrides->deleteOrphan($playlist, $override);
        } catch (MosOverrideNotFound $exception) {
            return response()->json(['message' => $exception->getMessage()], 404);
        } catch (MosOverrideNotEditable $exception) {
            return response()->json(['message' => $exception->getMessage()], 409);
        }

        return response()->json(['deleted' => true]);
    }

    private function assertUniqueFields(array $fields): void
    {
        $keys = array_column($fields, 'fieldKey');
        if (count($keys) !== count(array_unique($keys))) {
            throw ValidationException::withMessages(['fields' => 'Un câmp MOS poate apărea o singură dată în salvare.']);
        }
    }

    private function assertKeys(array $payload, array $allowed): void
    {
        if (array_diff(array_keys($payload), $allowed) !== []) {
            throw ValidationException::withMessages(['payload' => 'Payloadul MOS conține câmpuri necunoscute.']);
        }
    }

    private function jsonPayload(Request $request): array
    {
        try {
            $payload = json_decode($request->getContent(), true, 512, JSON_THROW_ON_ERROR);
        } catch (\JsonException) {
            throw ValidationException::withMessages(['payload' => 'Payloadul MOS trebuie să fie JSON valid.']);
        }
        if (! is_array($payload) || array_is_list($payload)) {
            throw ValidationException::withMessages(['payload' => 'Payloadul MOS trebuie să fie un obiect JSON.']);
        }

        return $payload;
    }
}
