export default function StageIndicator({ stages, currentIndex }) {
  return (
    <ol className="stage-indicator" aria-label="Session progress">
      {stages.map((s, i) => {
        const state = i < currentIndex ? 'done' : i === currentIndex ? 'active' : 'pending'
        return (
          <li key={s.key} className={`stage-dot ${state}`} aria-current={state === 'active' ? 'step' : undefined}>
            <span className="dot" />
            <span className="label">{s.label}</span>
          </li>
        )
      })}
    </ol>
  )
}
