import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import {
  lookupRecognitionToken,
  submitRecognition,
  getApiErrorMessage,
  type RecognitionPlayer,
} from "../api/client";

export default function RecognitionPage() {
  const [player, setPlayer] =
    useState<RecognitionPlayer | null>(null);

  const [category, setCategory] =
    useState("Positive contribution");

  const [description, setDescription] =
    useState("");

  const [name, setName] =
    useState("");

  const [contact, setContact] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [complete, setComplete] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const token =
    decodeURIComponent(
      window.location.pathname
        .split("/")
        .filter(Boolean)
        .at(-1) ?? "",
    );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);

        const response =
          await lookupRecognitionToken(token);

        if (!cancelled) {
          setPlayer(response.data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            getApiErrorMessage(
              err,
              "This recognition code is invalid.",
            ),
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (token) {
      void load();
    } else {
      setError("No recognition code was supplied.");
      setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [token]);

  async function submit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError(null);

      await submitRecognition({
        token,
        category,
        description,
        submitted_by_name: name,
        submitted_by_contact: contact,
      });

      setComplete(true);
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          "Could not submit recognition.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="public-page">
        <section className="public-panel">
          <h1>Loading recognition…</h1>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="public-page">
        <section className="public-panel">
          <h1>Recognition unavailable</h1>
          <p>{error}</p>
        </section>
      </main>
    );
  }

  if (complete) {
    return (
      <main className="public-page">
        <section className="public-panel">
          <span className="public-panel__eyebrow">
            THANK YOU
          </span>

          <h1>
            Recognition submitted
          </h1>

          <p>
            Your recognition for{" "}
            <strong>
              {player?.gamertag}
            </strong>{" "}
            has been submitted for review.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="public-page">
      <section className="public-panel">
        <span className="public-panel__eyebrow">
          COMMUNITY RECOGNITION
        </span>

        <h1>
          Recognise {player?.gamertag}
        </h1>

        {player?.avatar && (
          <div
            style={{
              fontSize: 52,
              margin: "18px 0",
            }}
          >
            {player.avatar}
          </div>
        )}

        <form
          onSubmit={submit}
          style={{
            display: "grid",
            gap: 14,
            maxWidth: 620,
          }}
        >
          <label>
            What are you recognising?
            <select
              value={category}
              onChange={(e) =>
                setCategory(e.target.value)
              }
              required
            >
              <option>
                Positive contribution
              </option>
              <option>
                Helping others
              </option>
              <option>
                Leadership
              </option>
              <option>
                Creativity
              </option>
              <option>
                Community participation
              </option>
              <option>
                Personal progress
              </option>
            </select>
          </label>

          <label>
            What happened?
            <textarea
              value={description}
              onChange={(e) =>
                setDescription(e.target.value)
              }
              minLength={3}
              maxLength={1000}
              required
              rows={5}
            />
          </label>

          <label>
            Your name
            <input
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
              required
              maxLength={200}
            />
          </label>

          <label>
            Contact details
            <input
              value={contact}
              onChange={(e) =>
                setContact(e.target.value)
              }
              required
              maxLength={300}
            />
          </label>

          <button
            type="submit"
            className="button button--primary"
            disabled={submitting}
          >
            {submitting
              ? "Submitting…"
              : "Submit recognition"}
          </button>
        </form>
      </section>
    </main>
  );
}
