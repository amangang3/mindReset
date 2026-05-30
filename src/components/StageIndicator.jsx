export default function StageIndicator({ phases, currentPhase, subLabel }) {
  return (
    <nav className="phase-indicator" aria-label="Session phases">
      <ol>
        {phases.map((p) => {
          const state =
            p.key < currentPhase ? 'done' : p.key === currentPhase ? 'active' : 'pending'
          return (
            <li key={p.key} className={`phase-chip ${state}`} aria-current={state === 'active' ? 'step' : undefined}>
              <span className="phase-label">{p.label}</span>
              {state === 'active' && subLabel && <span className="phase-sub">{subLabel}</span>}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
