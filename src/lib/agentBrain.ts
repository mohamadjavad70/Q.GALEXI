// ─── Agent Brain — رفتار هوشمند ۳D داخل سیاره ─────────────────────────────
// منطق خالص (بدون وابستگی به Node.js) — قابل استفاده در frontend

export interface AgentPos {
  x: number;
  z: number;
}

export type BehaviorState = 'wandering' | 'interacting' | 'working' | 'idle';

export interface AgentBrainState {
  pos: AgentPos;
  state: BehaviorState;
  targetPos: AgentPos | null;
  idleTimer: number;  // ثانیه تا تغییر هدف بعدی
}

/** ایجاد وضعیت اولیه brain برای یک agent */
export function createBrainState(initialPos: AgentPos): AgentBrainState {
  return {
    pos: { ...initialPos },
    state: 'idle',
    targetPos: null,
    idleTimer: 0,
  };
}

/** یک قدم رفتار: دریافت deltaTime (ثانیه) و موقعیت player */
export function stepBrain(
  brain: AgentBrainState,
  playerPos: AgentPos,
  delta: number,
  boundary = 22,
): AgentBrainState {
  const dx = playerPos.x - brain.pos.x;
  const dz = playerPos.z - brain.pos.z;
  const distToPlayer = Math.sqrt(dx * dx + dz * dz);

  // ─── حالت تعامل: اگر player نزدیک بود
  if (distToPlayer < 3.5) {
    return { ...brain, state: 'interacting', targetPos: null };
  }

  // ─── حالت کار: اگر روی work node باشد
  if (brain.state === 'working') {
    return { ...brain, idleTimer: Math.max(0, brain.idleTimer - delta) };
  }

  // ─── انتخاب هدف جدید بعد از idle
  let newIdleTimer = brain.idleTimer - delta;
  let newTargetPos = brain.targetPos;
  let newState: BehaviorState = 'wandering';
  let newPos = { ...brain.pos };

  if (!newTargetPos || newIdleTimer <= 0) {
    newTargetPos = randomTarget(brain.pos, boundary);
    newIdleTimer = 4 + Math.random() * 6; // ۴–۱۰ ثانیه هدف ثابت
  }

  // ─── حرکت به سمت هدف با steering
  if (newTargetPos) {
    const tdx = newTargetPos.x - brain.pos.x;
    const tdz = newTargetPos.z - brain.pos.z;
    const dist = Math.sqrt(tdx * tdx + tdz * tdz);

    if (dist < 0.4) {
      // رسید → idle کوتاه
      newTargetPos = null;
      newState = 'idle';
    } else {
      const speed = 1.4 * delta;
      newPos = {
        x: brain.pos.x + (tdx / dist) * speed,
        z: brain.pos.z + (tdz / dist) * speed,
      };
    }
  }

  return { ...brain, pos: newPos, state: newState, targetPos: newTargetPos, idleTimer: newIdleTimer };
}

function randomTarget(current: AgentPos, boundary: number): AgentPos {
  const angle = Math.random() * Math.PI * 2;
  const radius = 4 + Math.random() * 8;
  return {
    x: Math.max(-boundary, Math.min(boundary, current.x + Math.cos(angle) * radius)),
    z: Math.max(-boundary, Math.min(boundary, current.z + Math.sin(angle) * radius)),
  };
}
