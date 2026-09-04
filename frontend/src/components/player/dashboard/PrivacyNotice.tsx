export function PrivacyNotice() {
  return (
    <section className="privacy-notice">
      <div
        className="privacy-notice__icon"
        aria-hidden="true"
      >
        🔒
      </div>

      <div>
        <strong>
          Your game identity stays anonymous
        </strong>

        <p>
          The public game uses your gamertag
          and avatar. Your real name and
          photograph are never displayed on
          the public leaderboard.
        </p>
      </div>
    </section>
  );
}