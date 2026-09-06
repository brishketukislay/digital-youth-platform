import { useEffect, useState } from "react";

import {
  apiFetch,
  type Phase,
} from "../../api/client";

type MapPhase = {
  id: number;
  name: string;
};

type MapLocation = {
  id: number;
  name: string;
  description: string | null;
  x: number;
  y: number;
  icon: string;
  active: boolean;
  phases: MapPhase[];
};

type GameMap = {
  id: number;
  name: string;
  description: string | null;
  background_image: string | null;
  active: boolean;
  locations: MapLocation[];
};

type LocationForm = {
  name: string;
  description: string;
  x: number;
  y: number;
  icon: string;
  active: boolean;
  phase_ids: number[];
};

const EMPTY_LOCATION: LocationForm = {
  name: "",
  description: "",
  x: 0.5,
  y: 0.5,
  icon: "pin",
  active: true,
  phase_ids: [],
};

export default function AdminMap() {
  const [maps, setMaps] = useState<GameMap[]>([]);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [selectedMapId, setSelectedMapId] =
    useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [mapName, setMapName] = useState("");
  const [mapDescription, setMapDescription] = useState("");
  const [mapBackground, setMapBackground] = useState("");
  const [mapActive, setMapActive] = useState(true);

  const [editingLocationId, setEditingLocationId] =
    useState<number | null>(null);

  const [locationForm, setLocationForm] =
    useState<LocationForm>(EMPTY_LOCATION);

  const selectedMap =
    maps.find(map => map.id === selectedMapId) ?? null;

  async function load() {
    try {
      setLoading(true);
      setError("");

      const [mapData, phaseData] = await Promise.all([
        apiFetch<GameMap[]>("/api/admin/maps"),
        apiFetch<Phase[]>("/api/admin/phases"),
      ]);

      setMaps(mapData);
      setPhases(phaseData);

      if (
        selectedMapId === null &&
        mapData.length > 0
      ) {
        setSelectedMapId(mapData[0].id);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load map configuration.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (!selectedMap) {
      setMapName("");
      setMapDescription("");
      setMapBackground("");
      setMapActive(true);
      return;
    }

    setMapName(selectedMap.name);
    setMapDescription(selectedMap.description ?? "");
    setMapBackground(selectedMap.background_image ?? "");
    setMapActive(selectedMap.active);
  }, [selectedMapId, maps]);

  async function saveMap() {
    if (!mapName.trim()) {
      setError("Map name is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        name: mapName.trim(),
        description:
          mapDescription.trim() || null,
        background_image:
          mapBackground.trim() || null,
        active: mapActive,
      };

      if (selectedMap) {
        await apiFetch(
          `/api/admin/maps/${selectedMap.id}`,
          {
            method: "PUT",
            body: JSON.stringify(payload),
          },
        );
      } else {
        const result = await apiFetch<{ id: number }>(
          "/api/admin/maps",
          {
            method: "POST",
            body: JSON.stringify(payload),
          },
        );

        setSelectedMapId(result.id);
      }

      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save map.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function createMap() {
    setSelectedMapId(null);
    setMapName("");
    setMapDescription("");
    setMapBackground("");
    setMapActive(true);
    setEditingLocationId(null);
    setLocationForm(EMPTY_LOCATION);
  }

  async function deleteMap() {
    if (!selectedMap) {
      return;
    }

    if (
      !window.confirm(
        `Delete "${selectedMap.name}" and all of its locations?`,
      )
    ) {
      return;
    }

    try {
      setSaving(true);
      setError("");

      await apiFetch(
        `/api/admin/maps/${selectedMap.id}`,
        {
          method: "DELETE",
        },
      );

      setSelectedMapId(null);
      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete map.",
      );
    } finally {
      setSaving(false);
    }
  }

  function startLocation(location: MapLocation) {
    setEditingLocationId(location.id);

    setLocationForm({
      name: location.name,
      description: location.description ?? "",
      x: location.x,
      y: location.y,
      icon: location.icon,
      active: location.active,
      phase_ids: location.phases.map(
        phase => phase.id,
      ),
    });
  }

  function resetLocation() {
    setEditingLocationId(null);
    setLocationForm(EMPTY_LOCATION);
  }

  async function saveLocation() {
    if (!selectedMap) {
      setError("Create or select a map first.");
      return;
    }

    if (!locationForm.name.trim()) {
      setError("Location name is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        ...locationForm,
        name: locationForm.name.trim(),
        description:
          locationForm.description.trim() || null,
      };

      if (editingLocationId !== null) {
        await apiFetch(
          `/api/admin/maps/${selectedMap.id}/locations/${editingLocationId}`,
          {
            method: "PUT",
            body: JSON.stringify(payload),
          },
        );
      } else {
        await apiFetch(
          `/api/admin/maps/${selectedMap.id}/locations`,
          {
            method: "POST",
            body: JSON.stringify(payload),
          },
        );
      }

      resetLocation();
      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save location.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteLocation(locationId: number) {
    if (!selectedMap) {
      return;
    }

    if (!window.confirm("Delete this map location?")) {
      return;
    }

    try {
      setSaving(true);
      setError("");

      await apiFetch(
        `/api/admin/maps/${selectedMap.id}/locations/${locationId}`,
        {
          method: "DELETE",
        },
      );

      if (editingLocationId === locationId) {
        resetLocation();
      }

      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete location.",
      );
    } finally {
      setSaving(false);
    }
  }

  function togglePhase(phaseId: number) {
    setLocationForm(current => ({
      ...current,
      phase_ids: current.phase_ids.includes(phaseId)
        ? current.phase_ids.filter(
            id => id !== phaseId,
          )
        : [...current.phase_ids, phaseId],
    }));
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-slate-900 p-8 text-white">
        Loading game map…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-400">
          Programme
        </div>

        <h1 className="mt-2 text-3xl font-bold text-white">
          Game Map
        </h1>

        <p className="mt-2 max-w-3xl text-sm text-slate-400">
          Configure the programme map, place locations,
          and connect locations to phases.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-white/10 bg-slate-900 p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-white">
              Maps
            </h2>

            <button
              type="button"
              onClick={() => void createMap()}
              className="rounded-lg bg-cyan-500 px-3 py-2 text-xs font-semibold text-slate-950"
            >
              + New
            </button>
          </div>

          <div className="space-y-2">
            {maps.map(map => (
              <button
                key={map.id}
                type="button"
                onClick={() =>
                  setSelectedMapId(map.id)
                }
                className={`w-full rounded-xl border px-3 py-3 text-left ${
                  selectedMapId === map.id
                    ? "border-cyan-400/40 bg-cyan-400/10"
                    : "border-white/10 bg-slate-950/40 hover:bg-white/5"
                }`}
              >
                <div className="font-medium text-white">
                  {map.name}
                </div>

                <div className="mt-1 text-xs text-slate-400">
                  {map.locations.length} location
                  {map.locations.length === 1
                    ? ""
                    : "s"}
                </div>
              </button>
            ))}

            {maps.length === 0 && (
              <div className="rounded-xl border border-dashed border-white/10 p-4 text-sm text-slate-500">
                No maps yet.
              </div>
            )}
          </div>
        </aside>

        <section className="space-y-6">
          <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Map configuration
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Set the map identity and background.
                </p>
              </div>

              {selectedMap && (
                <button
                  type="button"
                  onClick={() => void deleteMap()}
                  className="rounded-lg border border-red-400/20 px-3 py-2 text-xs font-semibold text-red-300"
                >
                  Delete map
                </button>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm text-slate-300">
                  Map name
                </span>

                <input
                  value={mapName}
                  onChange={event =>
                    setMapName(event.target.value)
                  }
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400/50"
                  placeholder="Cumbernauld Adventure Map"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm text-slate-300">
                  Background image URL
                </span>

                <input
                  value={mapBackground}
                  onChange={event =>
                    setMapBackground(event.target.value)
                  }
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400/50"
                  placeholder="https://…"
                />
              </label>
            </div>

            <label className="mt-4 block space-y-2">
              <span className="text-sm text-slate-300">
                Description
              </span>

              <textarea
                value={mapDescription}
                onChange={event =>
                  setMapDescription(event.target.value)
                }
                rows={3}
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400/50"
              />
            </label>

            <label className="mt-4 flex items-center gap-3 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={mapActive}
                onChange={event =>
                  setMapActive(event.target.checked)
                }
              />
              Map is active
            </label>

            <button
              type="button"
              onClick={() => void saveMap()}
              disabled={saving}
              className="mt-5 rounded-xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 disabled:opacity-50"
            >
              {saving
                ? "Saving…"
                : selectedMap
                  ? "Save map"
                  : "Create map"}
            </button>
          </div>

          {selectedMap && (
            <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-white">
                      Map locations
                    </h2>

                    <p className="mt-1 text-sm text-slate-400">
                      Coordinates use 0–1, so 0.5 / 0.5 is
                      the centre of the map.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={resetLocation}
                    className="rounded-lg bg-cyan-500 px-3 py-2 text-xs font-semibold text-slate-950"
                  >
                    + Location
                  </button>
                </div>

                <div
                  className="relative aspect-video overflow-hidden rounded-2xl border border-white/10 bg-slate-950"
                  style={
                    selectedMap.background_image
                      ? {
                          backgroundImage: `url(${selectedMap.background_image})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }
                      : undefined
                  }
                >
                  {!selectedMap.background_image && (
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(34,211,238,0.12),_transparent_55%)]" />
                  )}

                  {selectedMap.locations
                    .filter(location => location.active)
                    .map(location => (
                      <button
                        key={location.id}
                        type="button"
                        onClick={() =>
                          startLocation(location)
                        }
                        className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 px-3 py-2 text-xs font-semibold shadow-lg ${
                          editingLocationId ===
                          location.id
                            ? "border-white bg-cyan-400 text-slate-950"
                            : "border-cyan-300/70 bg-slate-900/90 text-white"
                        }`}
                        style={{
                          left: `${location.x * 100}%`,
                          top: `${location.y * 100}%`,
                        }}
                        title={location.name}
                      >
                        {location.icon === "pin"
                          ? "📍"
                          : location.icon}{" "}
                        {location.name}
                      </button>
                    ))}
                </div>

                <div className="mt-5 space-y-2">
                  {selectedMap.locations.map(
                    location => (
                      <div
                        key={location.id}
                        className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            startLocation(location)
                          }
                          className="text-left"
                        >
                          <div className="font-medium text-white">
                            {location.icon === "pin"
                              ? "📍"
                              : location.icon}{" "}
                            {location.name}
                          </div>

                          <div className="mt-1 text-xs text-slate-500">
                            {Math.round(
                              location.x * 100,
                            )}
                            % ×{" "}
                            {Math.round(
                              location.y * 100,
                            )}
                            % ·{" "}
                            {location.phases.length} phase
                            {location.phases.length ===
                            1
                              ? ""
                              : "s"}
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            void deleteLocation(
                              location.id,
                            )
                          }
                          className="text-xs text-red-300"
                        >
                          Delete
                        </button>
                      </div>
                    ),
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">
                <h2 className="text-xl font-semibold text-white">
                  {editingLocationId
                    ? "Edit location"
                    : "New location"}
                </h2>

                <div className="mt-5 space-y-4">
                  <label className="block space-y-2">
                    <span className="text-sm text-slate-300">
                      Name
                    </span>

                    <input
                      value={locationForm.name}
                      onChange={event =>
                        setLocationForm(current => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none"
                      placeholder="Community Centre"
                    />
                  </label>

                  <label className="block space-y-2">
                    <span className="text-sm text-slate-300">
                      Description
                    </span>

                    <textarea
                      value={
                        locationForm.description
                      }
                      onChange={event =>
                        setLocationForm(current => ({
                          ...current,
                          description:
                            event.target.value,
                        }))
                      }
                      rows={3}
                      className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none"
                    />
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="space-y-2">
                      <span className="text-sm text-slate-300">
                        X position
                      </span>

                      <input
                        type="number"
                        min={0}
                        max={1}
                        step={0.01}
                        value={locationForm.x}
                        onChange={event =>
                          setLocationForm(current => ({
                            ...current,
                            x: Number(
                              event.target.value,
                            ),
                          }))
                        }
                        className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white"
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-sm text-slate-300">
                        Y position
                      </span>

                      <input
                        type="number"
                        min={0}
                        max={1}
                        step={0.01}
                        value={locationForm.y}
                        onChange={event =>
                          setLocationForm(current => ({
                            ...current,
                            y: Number(
                              event.target.value,
                            ),
                          }))
                        }
                        className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white"
                      />
                    </label>
                  </div>

                  <label className="block space-y-2">
                    <span className="text-sm text-slate-300">
                      Marker
                    </span>

                    <input
                      value={locationForm.icon}
                      onChange={event =>
                        setLocationForm(current => ({
                          ...current,
                          icon: event.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white"
                      placeholder="pin"
                    />
                  </label>

                  <div>
                    <div className="mb-2 text-sm text-slate-300">
                      Connected phases
                    </div>

                    <div className="space-y-2">
                      {phases.map(phase => (
                        <label
                          key={phase.id}
                          className="flex items-center gap-3 rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300"
                        >
                          <input
                            type="checkbox"
                            checked={locationForm.phase_ids.includes(
                              phase.id,
                            )}
                            onChange={() =>
                              togglePhase(
                                phase.id,
                              )
                            }
                          />

                          {phase.name}
                        </label>
                      ))}
                    </div>
                  </div>

                  <label className="flex items-center gap-3 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={locationForm.active}
                      onChange={event =>
                        setLocationForm(current => ({
                          ...current,
                          active:
                            event.target.checked,
                        }))
                      }
                    />
                    Location is active
                  </label>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        void saveLocation()
                      }
                      disabled={saving}
                      className="flex-1 rounded-xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-50"
                    >
                      {saving
                        ? "Saving…"
                        : editingLocationId
                          ? "Save location"
                          : "Create location"}
                    </button>

                    {editingLocationId && (
                      <button
                        type="button"
                        onClick={resetLocation}
                        className="rounded-xl border border-white/10 px-4 py-3 text-sm text-slate-300"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
