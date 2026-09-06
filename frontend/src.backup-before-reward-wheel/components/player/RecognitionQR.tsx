import {
  useEffect,
  useState,
} from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  createRecognitionToken,
  getApiErrorMessage,
} from "../../api/client";

type Props = {
  playerId: number;
  gamertag: string;
};

export default function RecognitionQR({
  playerId,
  gamertag,
}: Props) {
  const [token, setToken] =
    useState<string | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  async function generate() {
    try {
      setLoading(true);
      setError(null);

      const response =
        await createRecognitionToken(playerId);

      setToken(response.data.token);
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          "Could not create your recognition code.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void generate();
  }, [playerId]);

  if (loading) {
    return (
      <div className="player-card">
        <p>Creating your recognition code…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="player-card">
        <p>{error}</p>

        <button
          type="button"
          className="button button--primary"
          onClick={() => void generate()}
        >
          Try again
        </button>
      </div>
    );
  }

  if (!token) {
    return null;
  }

  const scanUrl =
    `${window.location.origin}/recognise/${encodeURIComponent(token)}`;

  return (
    <section className="player-card">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <span className="staff-eyebrow">
            COMMUNITY RECOGNITION
          </span>

          <h2>
            Your recognition code
          </h2>

          <p>
            Let someone scan this code to recognise
            something positive you've done.
          </p>
        </div>

        <button
          type="button"
          className="button button--secondary"
          onClick={() => void generate()}
        >
          Generate new code
        </button>
      </div>

      <div
        style={{
          display: "grid",
          placeItems: "center",
          marginTop: 20,
        }}
      >
        <div
          style={{
            background: "#fff",
            padding: 20,
            borderRadius: 18,
          }}
        >
          <QRCodeSVG
            value={scanUrl}
            size={220}
            level="M"
            includeMargin
          />
        </div>
      </div>

      <p
        style={{
          textAlign: "center",
          marginTop: 14,
        }}
      >
        <strong>{gamertag}</strong>
      </p>
    </section>
  );
}
