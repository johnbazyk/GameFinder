interface RateLimitBannerProps {
  secondsRemaining: number;
}

export function RateLimitBanner({ secondsRemaining }: RateLimitBannerProps) {
  return (
    <div className="banner banner-rate-limit" role="status">
      <span>
        You're sending messages too fast — slow down for a bit. Retrying in{" "}
        <strong>{secondsRemaining}s</strong>.
      </span>
    </div>
  );
}

interface NetworkErrorBannerProps {
  onRetry: () => void;
}

export function NetworkErrorBanner({ onRetry }: NetworkErrorBannerProps) {
  return (
    <div className="banner banner-network" role="alert">
      <span>Connection lost.</span>
      <button type="button" className="banner-retry-btn" onClick={onRetry}>
        Retry
      </button>
    </div>
  );
}
