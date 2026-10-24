import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import './App.css'
import { MusicEngine, TRACK_SLOTS, type TrackKey } from './music/engine'
import { loadTracks, saveTrack, deleteTrack } from './music/storage'

type CIA = 'C' | 'I' | 'A'
type GameMode = 'story' | 'infinite'
type PowerupKind = 'triple' | 'rapid' | 'shield' | 'life' | 'emp' | 'plasma' | 'burst'
type Powerup = { id: number; kind: PowerupKind; x: number; y: number; drift: number }
type Brick = { x: number; y: number; hp: number; max: number }
type Meteor = { x: number; y: number; vx: number; vy: number; radius: number; rotation: number; kind: 'meteor' | 'mine' }
const POWERUP_COLORS: Record<PowerupKind, string> = { triple: '#ffe071', rapid: '#ac89ff', shield: '#62e8ff', life: '#ff6e9a', emp: '#fbbf24', plasma: '#ba86ff', burst: '#ff93cf' }
const POWERUP_SYMBOLS: Record<PowerupKind, string> = { triple: '3', rapid: 'R', shield: 'S', life: '+', emp: 'E', plasma: 'P', burst: '5' }
const POWERUP_NAMES: Record<PowerupKind, string> = { triple: 'TRIPLE DISPARO', rapid: 'CADENCIA TURBO', shield: 'ESCUDO RESTAURADO', life: 'VIDA EXTRA', emp: 'EMP RECARGADO', plasma: 'CAÑÓN PLASMA', burst: 'ARMAMENTO 5X' }

type Phase = 'ready' | 'playing' | 'paused' | 'victory' | 'defeat'
type Enemy = { id: number; x: number; y: number; type: CIA; hp: number; maxHp: number; alive: boolean; variant: number }
type Shot = { x: number; y: number; vx: number; vy: number; enemy: boolean; power: number; size: number; color: string }
type Particle = { x: number; y: number; vx: number; vy: number; life: number; max: number; color: string; radius: number }
type Floater = { x: number; y: number; label: string; life: number; color: string }
type Boss = { x: number; y: number; hp: number; max: number; dir: number; mode: number; nextVolley: number; intro: number; poseUntil: number }
type Game = {
  phase: Phase; wave: number; score: number; lives: number; combo: number; comboEnd: number; kills: number;
  playerX: number; playerY: number; invulnerable: number; shield: number; pulse: number; dashReady: number;
  shots: Shot[]; enemies: Enemy[]; particles: Particle[]; floaters: Floater[]; boss: Boss | null;
  enemyDir: number; enemyMove: number; lastShot: number; enemyFire: number; lastTime: number; elapsed: number;
  flash: number; shake: number; announcement: string; announceUntil: number; logs: string[];
  mode: GameMode; tier: number; bricks: Brick[]; powerups: Powerup[]; pickups: number; nextPowerupId: number;
  tripleUntil: number; rapidUntil: number; plasmaUntil: number; burstUntil: number; meteors: Meteor[]; nextMeteor: number; nextBeatAttack: number;
  musicEnergy: number; beatFlash: number; beatCount: number; beatHue: number;

  statuses: Record<CIA, number>; keys: Set<string>; totalShots: number; hits: number;
}
type Snapshot = Pick<Game, 'phase' | 'wave' | 'score' | 'lives' | 'combo' | 'kills' | 'shield' | 'pulse' | 'dashReady' | 'announcement' | 'logs' | 'statuses' | 'totalShots' | 'hits' | 'elapsed' | 'mode' | 'tier' | 'pickups'> & { bossHp: number | null; bossMax: number; alive: number; bossMode: number; bossAttacking: boolean; bricks: number; powerups: number; tripleActive: boolean; rapidActive: boolean; plasmaActive: boolean; burstActive: boolean; meteors: number; musicEnergy: number; beatFlash: number; beatCount: number; beatHue: number }
const W = 900
const H = 548
const PLAYER_Y = 465
const COLORS: Record<CIA, string> = { C: '#39d8ff', I: '#ffc05f', A: '#ff5f94' }
const CIA_NAMES: Record<CIA, string> = { C: 'CONFIDENCIALIDAD', I: 'INTEGRIDAD', A: 'DISPONIBILIDAD' }
const CIA_DESC: Record<CIA, string> = { C: 'Exposición de datos ficticios', I: 'Alteración de registros ficticios', A: 'Interrupción de servicios simulados' }
const pickType = (r: number): CIA => (['C', 'I', 'A'] as CIA[])[r % 3]
const random = (min: number, max: number) => min + Math.random() * (max - min)
const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n))
const timeText = (seconds: number) => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`
const makeBricks = (): Brick[] => {
  const bricks: Brick[] = []
  for (const center of [126, 340, 560, 774]) {
    for (let row = 0; row < 4; row++) for (let col = 0; col < 11; col++) {
      // Arch-like bunker: one shot removes one block. A notched entrance stays open.
      if (row >= 2 && col >= 4 && col <= 6) continue
      if (row === 3 && (col === 0 || col === 10)) continue
      bricks.push({ x: center - 55 + col * 10, y: 385 + row * 10, hp: 1, max: 1 })
    }
  }
  return bricks
}
const spawnPowerup = (g: Game, x: number, y: number) => {
  if (g.powerups.length >= 5 || Math.random() > (g.mode === 'infinite' ? .16 : .2)) return
  const kinds: PowerupKind[] = g.mode === 'infinite' ? ['triple', 'rapid', 'shield', 'life', 'emp', 'plasma', 'burst'] : ['triple', 'rapid', 'shield', 'life', 'emp']
  const kind = kinds[Math.floor(Math.random() * kinds.length)]
  g.powerups.push({ id: ++g.nextPowerupId, x, y, kind, drift: random(-.35, .35) })
  label(g, x, y - 23, 'DROP!', POWERUP_COLORS[kind])
}
const spawnWave = (wave: number, mode: GameMode, tier = 0): Enemy[] => {
  const infinite = mode === 'infinite'
  const columns = infinite ? Math.min(13, 8 + Math.floor((wave - 1) / 2)) : (wave === 1 ? 8 : 9)
  const rows = infinite ? Math.min(5, 3 + Math.floor((wave - 1) / 3)) : (wave === 1 ? 3 : 4)
  const spacing = infinite ? Math.min(81, 802 / Math.max(1, columns - 1)) : (wave === 1 ? 88 : 79)
  const offset = W / 2 - (columns - 1) * spacing / 2
  return Array.from({ length: rows * columns }, (_, id) => {
    const row = Math.floor(id / columns)
    const type = pickType(row + wave)
    const hp = infinite ? (1 + ((id + row) % 3 === 0 ? Math.min(4, Math.floor(tier / 2)) : 0)) : (wave === 2 && row % 2 === 0 ? 2 : 1)
    return { id, x: offset + id % columns * spacing, y: (infinite ? 92 : 106) + row * (infinite ? 42 : 48), type, hp, maxHp: hp, alive: true, variant: row }
  })
}
const freshGame = (mode: GameMode = 'story'): Game => ({
  phase: 'ready', wave: 1, score: 0, lives: mode === 'infinite' ? 3 : 4, combo: 0, comboEnd: 0, kills: 0,
  playerX: W / 2, playerY: PLAYER_Y, invulnerable: 0, shield: 0, pulse: 0, dashReady: 0,
  shots: [], enemies: spawnWave(1, mode), particles: [], floaters: [], boss: null,
  enemyDir: 1, enemyMove: 0, lastShot: 0, enemyFire: 0, lastTime: 0, elapsed: 0,
  flash: 0, shake: 0, announcement: 'SECTOR 01: BRECHA INICIAL', announceUntil: 0,
  mode, tier: 0, bricks: makeBricks(), powerups: [], pickups: 0, nextPowerupId: 0,
  tripleUntil: 0, rapidUntil: 0, plasmaUntil: 0, burstUntil: 0,
  meteors: [], nextMeteor: 7, nextBeatAttack: 0, musicEnergy: 0, beatFlash: 0, beatCount: 0, beatHue: 265,
  logs: ['[SYS] SIMULACIÓN LISTA', '[CIA] LOS TRES PILARES PROTEGIDOS', '[TUX] GUARDIÁN DEL KERNEL EN ESPERA'],
  statuses: { C: 100, I: 100, A: 100 }, keys: new Set(), totalShots: 0, hits: 0,
})

const snapshot = (g: Game): Snapshot => ({
  phase: g.phase, wave: g.wave, score: g.score, lives: g.lives, combo: g.combo, kills: g.kills,
  shield: g.shield, pulse: g.pulse, dashReady: g.dashReady, announcement: g.announcement,
  logs: [...g.logs], statuses: { ...g.statuses }, totalShots: g.totalShots, hits: g.hits, elapsed: g.elapsed,
  bossHp: g.boss?.hp ?? null, bossMax: g.boss?.max ?? 1, bossMode: g.boss?.mode ?? 0,
  mode: g.mode, tier: g.tier, pickups: g.pickups, bossAttacking: !!g.boss && g.boss.poseUntil > g.elapsed, bricks: g.bricks.filter(b => b.hp > 0).length,
  powerups: g.powerups.length, meteors: g.meteors.length, musicEnergy: g.musicEnergy, beatFlash: g.beatFlash, beatCount: g.beatCount, beatHue: g.beatHue,
  tripleActive: g.tripleUntil > g.elapsed, rapidActive: g.rapidUntil > g.elapsed, plasmaActive: g.plasmaUntil > g.elapsed, burstActive: g.burstUntil > g.elapsed,
  alive: g.enemies.filter(e => e.alive).length,
})
const logEvent = (g: Game, category: string, message: string) => { g.logs = [`[${category}] ${message}`, ...g.logs].slice(0, 8) }
const explode = (g: Game, x: number, y: number, color: string, amount = 16) => {
  for (let i = 0; i < amount; i++) {
    const angle = random(0, Math.PI * 2), speed = random(1.2, amount > 20 ? 7.8 : 4.4)
    g.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: random(16, 42), max: 42, color, radius: random(1.3, 3.5) })
  }
  if (g.particles.length > 250) g.particles.splice(0, g.particles.length - 250)
}
const label = (g: Game, x: number, y: number, text: string, color: string) => { g.floaters.push({ x, y, label: text, life: 45, color }) }
const increaseThreat = (g: Game) => {
  if (g.mode !== 'infinite') return
  const nextTier = Math.floor(g.kills / 20)
  if (nextTier <= g.tier) return
  g.tier = nextTier
  g.announcement = `⚠ NIVEL DE AMENAZA ${g.tier + 1} / ${g.kills} BAJAS`
  g.announceUntil = g.elapsed + 3.4
  g.flash = 1.7; g.shake = 6
  logEvent(g, 'INFINITO', `HITO ${g.kills}: MÁS ENEMIGOS, METEOROS Y ARMAMENTO ENEMIGO`)
  label(g, g.playerX, g.playerY - 55, `AMENAZA +1 · NIVEL ${g.tier + 1}`, '#fbbf24')
}
const spawnMeteor = (g: Game) => {
  if (g.meteors.length >= 6) return
  const radius = random(13, 20)
  const x = random(45, W - 45)
  const kind = g.mode === 'infinite' && g.tier >= 3 && Math.random() < .36 ? 'mine' : 'meteor'
  g.meteors.push({ x, y: -radius * 2, vx: kind === 'mine' ? random(-2.3, 2.3) : random(-1.1, 1.1), vy: random(3.6, 5.4) * (g.boss ? 1.3 : 1) * (1 + Math.min(g.tier, 12) * .055), radius, rotation: random(0, Math.PI), kind })
  label(g, x, 48, kind === 'mine' ? 'MINA!' : 'METEORO!', kind === 'mine' ? '#e879f9' : '#ffb86d')
}
const getAccuracy = (g: Pick<Game, 'totalShots' | 'hits'>) => g.totalShots ? Math.min(100, Math.round(100 * g.hits / g.totalShots)) : 0

function drawTux(ctx: CanvasRenderingContext2D, b: Boss, t: number, attack = false) {
  const rage = b.mode === 2
  const bob = Math.sin(t / 190) * 5
  const wingLift = attack ? -28 : rage ? -12 : 0
  ctx.save()
  ctx.translate(b.x, b.y + bob)
  ctx.shadowBlur = rage ? 32 : 19
  ctx.shadowColor = rage ? '#ff517c' : '#58e7fa'
  ctx.fillStyle = rage ? '#ff396940' : '#a78bfa33'
  ctx.beginPath(); ctx.ellipse(0, 8, 80, 94, 0, 0, Math.PI * 2); ctx.fill()
  ctx.shadowBlur = 0
  // Pixel-styled wings / armored penguin body
  ctx.fillStyle = '#18273c'
  ctx.beginPath(); ctx.moveTo(-43, -35); ctx.lineTo(-72, 15 + wingLift); ctx.lineTo(-61, 59 + wingLift); ctx.lineTo(-38, 35); ctx.closePath(); ctx.fill()
  ctx.beginPath(); ctx.moveTo(43, -35); ctx.lineTo(72, 15 + wingLift); ctx.lineTo(61, 59 + wingLift); ctx.lineTo(38, 35); ctx.closePath(); ctx.fill()
  ctx.fillStyle = '#060a12'; ctx.beginPath(); ctx.ellipse(0, 1, 50, 66, 0, 0, Math.PI * 2); ctx.fill()
  ctx.strokeStyle = rage ? '#fa5c85' : '#37b1d5'; ctx.lineWidth = 3; ctx.stroke()
  ctx.fillStyle = '#f2f6ff'; ctx.beginPath(); ctx.ellipse(0, 21, 35, 38, 0, 0, Math.PI * 2); ctx.fill()
  for (const side of [-1, 1]) {
    ctx.fillStyle = '#f8fbff'; ctx.beginPath(); ctx.ellipse(side * 16, -25, 12, 18, 0, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = rage ? '#ff4f7b' : '#0b1223'; ctx.beginPath(); ctx.ellipse(side * 17 + 2, -22, 5, 8, 0, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#ffd04c'; ctx.beginPath(); ctx.ellipse(side * 38, 60, 25, 13, side * .2, 0, Math.PI * 2); ctx.fill()
  }
  ctx.fillStyle = '#ffbb32'; ctx.beginPath(); ctx.moveTo(-19, -9); ctx.lineTo(0, 6); ctx.lineTo(20, -9); ctx.lineTo(0, -20); ctx.closePath(); ctx.fill()
  if (attack) { ctx.fillStyle = '#ff6288'; ctx.fillRect(-24, -57, 48, 5) }
  ctx.strokeStyle = rage ? '#ff5c92' : '#68d6eb'; ctx.lineWidth = 2
  ctx.strokeRect(-52, -72, 104, 141)
  ctx.fillStyle = rage ? '#ff517b' : '#36d9ee'
  for (const side of [-1, 1]) { ctx.fillRect(side * 54 - 3, -44, 6, 15); ctx.fillRect(side * 54 - 3, 33, 6, 15) }
  ctx.restore()
}

function drawGame(ctx: CanvasRenderingContext2D, g: Game, now: number) {
  const t = g.elapsed
  ctx.clearRect(0, 0, W, H)
  ctx.fillStyle = '#080817'; ctx.fillRect(0, 0, W, H)
  const beatHue = g.beatHue
  const pulse = Math.min(1, g.musicEnergy * 1.2 + g.beatFlash * .8)
  const gradient = ctx.createRadialGradient(W / 2, H / 3, 35, W / 2, H / 2, 650)
  gradient.addColorStop(0, `hsl(${beatHue} 75% ${g.boss ? 20 + pulse * 18 : 15 + pulse * 18}%)`)
  gradient.addColorStop(.55, `hsl(${(beatHue + 36) % 360} 62% ${9 + pulse * 6}%)`)
  gradient.addColorStop(1, '#070712')
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, W, H)
  if (g.musicEnergy > .01) {
    const light = Math.min(.26, g.musicEnergy * .17 + g.beatFlash * .13)
    ctx.fillStyle = `hsla(${beatHue} 95% 58% / ${light})`
    ctx.fillRect(0, 0, W, H)
    ctx.strokeStyle = `hsla(${(beatHue + 45) % 360} 100% 73% / ${Math.min(.95, .18 + g.musicEnergy * .65 + g.beatFlash * .57)})`
    ctx.lineWidth = 2 + g.beatFlash * 7
    ctx.strokeRect(5, 5, W - 10, H - 10)
  }
  ctx.save()
  ctx.translate(random(-g.shake, g.shake), random(-g.shake, g.shake))
  // Parallax starfield and perspective-grid cyber stage
  for (let i = 0; i < 104; i++) {
    const x = (i * 131 + 37) % W
    const y = ((i * 227 + t * (4 + i % 4) * 5) % H + H) % H
    ctx.fillStyle = i % 11 === 0 ? '#f0abfc' : '#7473a9'
    ctx.globalAlpha = .25 + (i % 4) * .16
    ctx.fillRect(x, y, i % 7 === 0 ? 3 : 1.4, i % 7 === 0 ? 3 : 1.4)
  }
  ctx.globalAlpha = 1
  ctx.strokeStyle = `hsla(${beatHue} 85% 70% / ${.12 + pulse * .48})`; ctx.lineWidth = 1 + g.beatFlash * 1.4
  const horizon = 381
  ctx.beginPath(); ctx.moveTo(0, horizon); ctx.lineTo(W, horizon); ctx.stroke()
  ctx.save(); ctx.globalAlpha = .31
  for (let i = 0; i < 17; i++) { const x = W / 2 + (i - 8) * 84; ctx.beginPath(); ctx.moveTo(W / 2, horizon); ctx.lineTo(x * 2 - W / 2, H); ctx.stroke() }
  for (let i = 0; i < 7; i++) { const y = horizon + Math.pow(i / 6, 1.8) * (H - horizon); ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke() }
  ctx.restore()
  ctx.fillStyle = '#f0abfc'; ctx.font = 'bold 12px monospace'; ctx.textAlign = 'left'; ctx.globalAlpha = .8
  ctx.fillText(`SECTOR ${g.wave.toString().padStart(2, '0')} // ${g.boss ? 'KERNEL CORE' : 'NETWORK GRID'}`, 22, 28)
  ctx.textAlign = 'right'; ctx.fillText(`SIM / ${timeText(g.elapsed)}`, W - 22, 28)
  ctx.globalAlpha = 1
  if (g.enemies.some(e => e.alive)) {
    for (const e of g.enemies) {
      if (!e.alive) continue
      const c = COLORS[e.type]
      ctx.save(); ctx.translate(e.x, e.y + Math.sin(now / 260 + e.id) * 1.5)
      ctx.shadowColor = c; ctx.shadowBlur = 14
      ctx.fillStyle = c
      ctx.fillRect(-17, -10, 34, 20); ctx.fillRect(-23, -4, 46, 9)
      ctx.fillRect(-12, 10, 7, 6); ctx.fillRect(5, 10, 7, 6)
      ctx.shadowBlur = 0
      ctx.fillStyle = '#080e1c'; ctx.fillRect(-11, -3, 6, 7); ctx.fillRect(5, -3, 6, 7)
      ctx.font = 'bold 12px monospace'; ctx.textAlign = 'center'; ctx.fillText(e.type, 0, 5)
      if (e.maxHp > 1) { ctx.fillStyle = '#eafaff'; ctx.fillRect(-23, -16, Math.max(0, 46 * e.hp / e.maxHp), 3) }
      ctx.restore()
    }
  }
  if (g.boss) {
    const b = g.boss
    drawTux(ctx, b, now, b.poseUntil > g.elapsed)
    if (g.musicEnergy > .03) {
      ctx.strokeStyle = `hsla(${beatHue} 100% 74% / ${Math.min(.9, g.musicEnergy * .8 + g.beatFlash * .6)})`
      ctx.lineWidth = 2 + g.beatFlash * 4
      ctx.beginPath(); ctx.ellipse(b.x, b.y, 76 + g.musicEnergy * 22 + g.beatFlash * 13, 94 + g.musicEnergy * 25, 0, 0, Math.PI * 2); ctx.stroke()
    }
    ctx.fillStyle = '#f4f6ff'; ctx.textAlign = 'center'; ctx.font = 'bold 13px monospace'
    ctx.fillText(b.mode === 2 ? '⚠ TUX.KERNEL / RAGE' : 'TUX / KERNEL GUARDIAN', W / 2, 56)
    ctx.fillStyle = '#283348'; ctx.fillRect(W / 2 - 175, 67, 350, 10)
    ctx.fillStyle = b.mode === 2 ? '#ff4478' : '#41d9ed'; ctx.fillRect(W / 2 - 175, 67, 350 * Math.max(0, b.hp / b.max), 10)
    ctx.strokeStyle = '#b4c4d8'; ctx.strokeRect(W / 2 - 175, 67, 350, 10)
    if (b.mode === 2) { ctx.fillStyle = '#ff7195'; ctx.font = 'bold 12px monospace'; ctx.fillText('PHASE II: OVERDRIVE', W / 2, 96) }
  }
  // Barreras físicas destructibles: cada casilla muestra el daño recibido.
  for (const brick of g.bricks) {
    if (brick.hp <= 0) continue
    const color = brick.hp === brick.max ? '#af96ff' : '#fbbf24'
    ctx.shadowColor = color; ctx.shadowBlur = brick.hp === brick.max ? 8 : 2
    ctx.fillStyle = color; ctx.fillRect(brick.x + 1, brick.y + 1, 8, 8)
    ctx.shadowBlur = 0
    ctx.fillStyle = '#0a2030'; ctx.fillRect(brick.x + 3, brick.y + 3, brick.hp === brick.max ? 2 : 4, 2)
  }
  for (const item of g.powerups) {
    const glow = POWERUP_COLORS[item.kind]
    ctx.save(); ctx.translate(item.x, item.y)
    ctx.rotate(Math.sin(now / 450 + item.id) * .12)
    ctx.shadowBlur = 18; ctx.shadowColor = glow; ctx.fillStyle = '#14263b'
    ctx.fillRect(-15, -15, 30, 30); ctx.strokeStyle = glow; ctx.lineWidth = 2; ctx.strokeRect(-15, -15, 30, 30)
    ctx.shadowBlur = 0; ctx.fillStyle = glow; ctx.font = 'bold 18px monospace'; ctx.textAlign = 'center'
    ctx.fillText(POWERUP_SYMBOLS[item.kind], 0, 7); ctx.restore()
  }
  if (g.shield > 0 || g.invulnerable > 0) {
    ctx.strokeStyle = g.invulnerable > 0 ? '#ffffff' : '#51ebf9'; ctx.lineWidth = 2
    ctx.globalAlpha = .33 + Math.sin(now / 80) * .18
    ctx.beginPath(); ctx.ellipse(g.playerX, g.playerY, 34, 29, 0, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1
  }
  // Fighter spaceship with thrust, wing lighting, engine core
  ctx.save(); ctx.translate(g.playerX, g.playerY)
  ctx.shadowColor = '#f2a5ff'; ctx.shadowBlur = 15 + g.musicEnergy * 15
  ctx.fillStyle = '#b68cff'
  ctx.beginPath(); ctx.moveTo(0, -26); ctx.lineTo(10, -6); ctx.lineTo(27, 8); ctx.lineTo(24, 18); ctx.lineTo(-24, 18); ctx.lineTo(-27, 8); ctx.lineTo(-10, -6); ctx.closePath(); ctx.fill()
  ctx.shadowBlur = 0; ctx.fillStyle = '#06232a'; ctx.fillRect(-7, -5, 14, 17)
  ctx.fillStyle = '#e8fff9'; ctx.fillRect(-3, -17, 6, 15)
  ctx.fillStyle = '#56dcff'; ctx.fillRect(-20, 11, 10, 3); ctx.fillRect(10, 11, 10, 3)
  ctx.fillStyle = '#f9a8d4'; const flame = 9 + Math.sin(now / 75) * 5
  ctx.fillRect(-15, 18, 8, flame); ctx.fillRect(7, 18, 8, flame)
  ctx.restore()
  if (g.tripleUntil > g.elapsed || g.rapidUntil > g.elapsed || g.plasmaUntil > g.elapsed || g.burstUntil > g.elapsed) {
    ctx.textAlign = 'center'; ctx.font = 'bold 11px monospace'
    ctx.fillStyle = '#ffe183'; ctx.fillText(g.plasmaUntil > g.elapsed ? 'PLASMA' : g.burstUntil > g.elapsed ? 'BURST x5' : g.tripleUntil > g.elapsed ? 'TRIPLE x3' : 'RAPID', g.playerX, g.playerY + 45)
  }
  for (const m of g.meteors) {
    ctx.save(); ctx.translate(m.x, m.y); ctx.rotate(m.rotation)
    ctx.shadowBlur = 23; ctx.shadowColor = m.kind === 'mine' ? '#d946ef' : '#ff7f4d'
    ctx.fillStyle = m.kind === 'mine' ? '#e879f9' : '#ffb46c'; ctx.beginPath(); ctx.arc(0, 0, m.radius, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = m.kind === 'mine' ? '#70226d' : '#b94c46'; ctx.beginPath(); ctx.arc(-4, 3, m.radius * .67, 0, Math.PI * 2); ctx.fill()
    ctx.strokeStyle = '#ffc78c'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-m.radius, -m.radius * 2.6); ctx.lineTo(0, -m.radius * .8); ctx.stroke()
    ctx.restore()
  }
  for (const s of g.shots) {
    ctx.shadowColor = s.color; ctx.shadowBlur = 13; ctx.fillStyle = s.color
    if (s.enemy) { ctx.beginPath(); ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2); ctx.fill() }
    else ctx.fillRect(s.x - s.size / 2, s.y - 14, s.size, 20)
  }
  ctx.shadowBlur = 0
  for (const p of g.particles) { ctx.fillStyle = p.color; ctx.globalAlpha = clamp(p.life / p.max, 0, 1); ctx.fillRect(p.x, p.y, p.radius, p.radius) }
  ctx.globalAlpha = 1
  for (const f of g.floaters) { ctx.fillStyle = f.color; ctx.globalAlpha = f.life / 45; ctx.font = 'bold 14px monospace'; ctx.textAlign = 'center'; ctx.fillText(f.label, f.x, f.y) }
  ctx.globalAlpha = 1
  if (g.flash > 0) { ctx.globalAlpha = g.flash * .2; ctx.fillStyle = g.boss ? '#ff416c' : '#c4b5fd'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1 }
  ctx.restore()
  if (g.phase === 'playing' && g.announceUntil > g.elapsed) {
    ctx.fillStyle = '#060d20db'; ctx.fillRect(190, 282, 520, 56)
    ctx.strokeStyle = '#d8b4fe'; ctx.strokeRect(190, 282, 520, 56)
    ctx.font = 'bold 19px monospace'; ctx.fillStyle = '#f5d0fe'; ctx.textAlign = 'center'; ctx.fillText(g.announcement, W / 2, 317)
  }
  // CRT scan lines are decorative only
  ctx.globalAlpha = .055; ctx.fillStyle = '#e3ffff'
  for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 1)
  ctx.globalAlpha = 1
}

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const shellRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<Game>(freshGame())
  const [view, setView] = useState<Snapshot>(() => snapshot(gameRef.current))
  const [soundOn, setSoundOn] = useState(false)
  const engineRef = useRef<MusicEngine | null>(null)
  if (!engineRef.current) engineRef.current = new MusicEngine()
  const [musicNames, setMusicNames] = useState<Partial<Record<TrackKey, string>>>({})
  const [musicPlaying, setMusicPlaying] = useState(false)
  const [musicVolume, setMusicVolume] = useState(.45)
  const [musicNotice, setMusicNotice] = useState('Importa canciones desde tu PC y asígnalas a cada fase.')
  const [syncEnabled, setSyncEnabled] = useState(true)
  const [sensitivity, setSensitivity] = useState(1)
  const sensitivityRef = useRef(1)
  const syncRef = useRef(true)
  const [reducedEffects, setReducedEffects] = useState(false)
  const reducedEffectsRef = useRef(false)
  const activeSceneRef = useRef<TrackKey | null>(null)
  const userStoppedMusicRef = useRef(false)
  const [activeMusic, setActiveMusic] = useState<TrackKey | null>(null)
  const [showReport, setShowReport] = useState(false)
  const soundRef = useRef(false)
  const audioRef = useRef<AudioContext | null>(null)
  const [apiConnected, setApiConnected] = useState(false)
  useEffect(() => {
    let cancelled = false
    void loadTracks().then(rows => {
      if (cancelled) return
      const found: Partial<Record<TrackKey, string>> = {}
      for (const {key, file} of rows) {
        // Compatibilidad con Hero configurado en oleada 1 de la versión anterior.
        const target = (key as string) === 'wave1' ? 'waves' : key
        if (!TRACK_SLOTS.some(slot => slot.key === target) || found[target as TrackKey]) continue
        engineRef.current?.addTrack(target as TrackKey, file)
        found[target as TrackKey] = file.name
      }
      setMusicNames(found)
      if (rows.length) setMusicNotice(`${rows.length} pista(s) recuperada(s) de este navegador. Pulsa PLAY o inicia una partida.`)
    }).catch(() => setMusicNotice('La música se puede importar, pero el navegador no permite guardarla permanentemente.'))
    const onUnload = () => engineRef.current?.dispose()
    window.addEventListener('pagehide', onUnload)
    return () => { cancelled = true; window.removeEventListener('pagehide', onUnload); engineRef.current?.pause() }
  }, [])
  const sceneFor = (g: Game): TrackKey => {
    if (g.phase === 'ready' || g.phase === 'victory' || g.phase === 'defeat') return 'menu'
    if (g.boss) return 'boss'
    return 'waves'
  }
  const playScene = (requested: TrackKey) => {
    const engine = engineRef.current!
    activeSceneRef.current = requested
    if (!engine.has(requested)) { engine.pause(); setMusicPlaying(false); setActiveMusic(null); return }
    setActiveMusic(requested)
    if (userStoppedMusicRef.current) { engine.pause(); setMusicPlaying(false); return }
    void engine.play(requested).then(ok => { setMusicPlaying(ok); if (!ok) setMusicNotice('Importa una canción para esta fase.') }).catch(() => {
      setMusicPlaying(false)
      setMusicNotice('El navegador bloqueó el audio automático: pulsa PLAY o inicia una partida.')
    })
  }
  const importMusic = (key: TrackKey, file?: File) => {
    if (!file) return
    if (!file.type.startsWith('audio/') && !/\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(file.name)) {
      setMusicNotice('Elige un archivo de audio compatible (.mp3, .wav, .ogg...).')
      return
    }
    engineRef.current!.addTrack(key, file)
    setMusicNames(old => ({ ...old, [key]: file.name }))
    setMusicNotice(`Pista asignada a ${TRACK_SLOTS.find(slot => slot.key === key)?.label}. Se guarda solo en este navegador.`)
    void saveTrack(key, file).catch(() => setMusicNotice('Se puede reproducir, pero no se pudo guardar (espacio insuficiente o almacenamiento bloqueado).'))
    if (gameRef.current.phase !== 'paused' && activeSceneRef.current === key) {
      userStoppedMusicRef.current = false
      playScene(activeSceneRef.current)
    }
  }
  const removeMusic = (key: TrackKey) => {
    engineRef.current!.removeTrack(key)
    setMusicNames(old => { const next = { ...old }; delete next[key]; return next })
    void deleteTrack(key).catch(() => setMusicNotice('No se pudo eliminar la pista guardada en este navegador.'))
    if (activeSceneRef.current) playScene(activeSceneRef.current)
  }
  const toggleMusic = () => {
    const engine = engineRef.current!
    if (engine.playing) { userStoppedMusicRef.current = true; engine.pause(); setMusicPlaying(false); return }
    userStoppedMusicRef.current = false
    playScene(activeSceneRef.current ?? sceneFor(gameRef.current))
  }
  const setVolume = (volume: number) => { setMusicVolume(volume); engineRef.current!.setVolume(volume) }
  const setMusicSensitivity = (value: number) => { setSensitivity(value); sensitivityRef.current = value }
  const changeSync = (value: boolean) => { setSyncEnabled(value); syncRef.current = value }
  const changeReduced = (value: boolean) => { setReducedEffects(value); reducedEffectsRef.current = value }

  const apiConnectedRef = useRef(false)
  const publish = useCallback(() => setView(snapshot(gameRef.current)), [])
  const note = useCallback((freq: number, duration = .065, wave: OscillatorType = 'square') => {
    if (!soundRef.current) return
    try {
      const audio = audioRef.current ?? new AudioContext()
      audioRef.current = audio
      if (audio.state === 'suspended') void audio.resume()
      const osc = audio.createOscillator(), gain = audio.createGain()
      osc.type = wave; osc.frequency.setValueAtTime(freq, audio.currentTime)
      osc.frequency.exponentialRampToValueAtTime(Math.max(65, freq / 2), audio.currentTime + duration)
      gain.gain.setValueAtTime(.045, audio.currentTime)
      gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + duration)
      osc.connect(gain); gain.connect(audio.destination)
      osc.start(); osc.stop(audio.currentTime + duration)
    } catch { /* sound is an optional enhancement */ }
  }, [])
  const reportEvent = useCallback((type: CIA | 'BOSS') => {
    if (!apiConnectedRef.current) return
    void fetch(type === 'BOSS' ? 'http://127.0.0.1:3001/api/boss-defeated' : 'http://127.0.0.1:3001/api/event', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: type === 'BOSS' ? '{}' : JSON.stringify({ type }),
    }).catch(() => { apiConnectedRef.current = false; setApiConnected(false) })
  }, [])
  const checkApi = () => {
    void fetch('http://127.0.0.1:3001/api/health').then(r => {
      if (!r.ok) throw new Error('API offline')
      apiConnectedRef.current = true; setApiConnected(true)
    }).catch(() => {
      apiConnectedRef.current = false; setApiConnected(false)
      setMusicNotice('API opcional desconectada. El videojuego funciona normalmente en modo local.')
    })
  }
  const start = (skipToBoss = false, mode: GameMode = 'story') => {
    const g = freshGame(mode)
    g.phase = 'playing'; g.elapsed = 0; g.lastTime = 0; g.announceUntil = 2.8
    if (skipToBoss) {
      g.wave = 3; g.enemies = []; g.boss = { x: W / 2, y: 174, hp: 45, max: 45, dir: 1, mode: 1, nextVolley: 2.7, intro: 2.3, poseUntil: 0 }
      g.pulse = 100; g.shield = 70; g.announcement = 'BOSS RUSH: TUX KERNEL GUARDIAN'
      logEvent(g, 'DEMO', 'BOSS RUSH: ENFRENTAMIENTO DIRECTO')
    } else logEvent(g, 'SYS', mode === 'infinite' ? 'INFINITO: LA AMENAZA AUMENTA CADA 20 BAJAS' : 'HISTORIA INICIADA · SIMULACIÓN SEGURA')
    gameRef.current = g; setShowReport(false); publish(); userStoppedMusicRef.current = false; playScene(sceneFor(g))
    if (apiConnectedRef.current) void fetch('http://127.0.0.1:3001/api/reset', { method: 'POST' }).catch(() => { apiConnectedRef.current = false; setApiConnected(false) })
    note(620, .17)
  }

  const pause = () => {
    const g = gameRef.current
    if (g.phase === 'playing') { g.phase = 'paused'; engineRef.current?.pause(); setMusicPlaying(false) }
    else if (g.phase === 'paused') { g.phase = 'playing'; g.lastTime = 0; if (!userStoppedMusicRef.current) playScene(sceneFor(g)) }
    publish()
  }
  const usePulse = useCallback(() => {
    const g = gameRef.current
    if (g.phase !== 'playing' || g.pulse < 100) return
    g.pulse = 0; g.flash = 2; g.shake = 9
    g.shots = g.shots.filter(s => !s.enemy)
    explode(g, g.playerX, g.playerY, '#a78bfa', 42)
    for (const e of g.enemies) {
      if (e.alive && e.y > 105) { e.hp -= 1; if (e.hp <= 0) { e.alive = false; g.kills++; increaseThreat(g); g.score += 75; g.statuses[e.type] = clamp(g.statuses[e.type] - (g.wave === 1 ? 12.5 : 8), 0, 100); explode(g, e.x, e.y, COLORS[e.type], 10); reportEvent(e.type) } }
    }
    if (g.boss) { g.boss.hp = Math.max(0, g.boss.hp - 3); explode(g, g.boss.x, g.boss.y, '#c4b5fd', 24) }
    logEvent(g, 'SKILL', 'PULSO EMP: PROYECTILES NEUTRALIZADOS')
    note(180, .42, 'sawtooth'); publish()
  }, [note, publish, reportEvent])
  useEffect(() => {
    const onDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      if (['arrowleft', 'arrowright', 'arrowup', ' ', 'shift'].includes(key) && ['playing', 'paused'].includes(gameRef.current.phase)) event.preventDefault()
      if ((key === 'p' || key === 'escape') && !event.repeat) pause()
      if (key === 'enter' && !event.repeat && ['ready', 'victory', 'defeat'].includes(gameRef.current.phase)) start()
      if (key === 'e' && !event.repeat) usePulse()
      gameRef.current.keys.add(key)
    }
    const onUp = (event: KeyboardEvent) => gameRef.current.keys.delete(event.key.toLowerCase())
    const onBlur = () => { gameRef.current.keys.clear(); if (gameRef.current.phase === 'playing') { gameRef.current.phase = 'paused'; engineRef.current?.pause(); setMusicPlaying(false); publish() } }
    window.addEventListener('keydown', onDown); window.addEventListener('keyup', onUp); window.addEventListener('blur', onBlur)
    return () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp); window.removeEventListener('blur', onBlur) }
  }, [publish, usePulse])
  useEffect(() => {
    const cvs = canvasRef.current; const ctx = cvs?.getContext('2d')
    if (!ctx) return
    let raf = 0; let lastPublished = 0
    const loop = (now: number) => {
      const g = gameRef.current
      const delta = g.lastTime ? Math.min((now - g.lastTime) / 16.667, 2) : 0
      g.lastTime = now
      const audioPulse = engineRef.current?.sample(sensitivityRef.current, now / 1000)
      g.musicEnergy = syncRef.current ? (audioPulse?.energy ?? 0) * (reducedEffectsRef.current ? .35 : 1) : 0
      g.beatFlash = Math.max(0, g.beatFlash - delta * .075)
      if (audioPulse?.beat && syncRef.current) {
        g.beatCount++
        g.beatHue = [267, 316, 203, 34, 288, 349][g.beatCount % 6]
        if (!reducedEffectsRef.current) g.beatFlash = Math.min(1, .85 + g.musicEnergy)
      }
      if (shellRef.current) {
        shellRef.current.style.setProperty('--beat-hue', String(g.beatHue))
        const strength = reducedEffectsRef.current ? g.musicEnergy * .2 : Math.min(1, g.musicEnergy * .85 + g.beatFlash * .9)
        shellRef.current.style.setProperty('--beat-strength', String(strength))
        shellRef.current.style.setProperty('--beat-opacity', String(.09 + strength * .63))
        shellRef.current.style.setProperty('--beat-glow', `${(7 + strength * 25).toFixed(1)}px`)
      }
      if (g.phase === 'playing') {
        const dt = delta
        g.elapsed += dt / 60
        if (audioPulse?.beat && syncRef.current && g.boss && g.mode === 'infinite' && g.boss.mode === 2 && g.boss.intro === 0 && g.elapsed > g.nextBeatAttack) {
          // Gameplay reaction limited by cooldown so loud music cannot create unfair bullet spam.
          g.nextBeatAttack = g.elapsed + 3.3
          if (Math.random() < .65) spawnMeteor(g)
          else for (const vx of [-2.6, 0, 2.6]) g.shots.push({ x: g.boss.x, y: g.boss.y + 72, vx, vy: 5.6, enemy: true, power: 1, size: 7, color: '#ffab77' })
        }
        g.invulnerable = Math.max(0, g.invulnerable - dt / 60)
        g.dashReady = Math.max(0, g.dashReady - dt / 60)
        g.shake = Math.max(0, g.shake - dt * .5)
        g.flash = Math.max(0, g.flash - dt * .13)
        g.shield = clamp(g.shield + dt * (g.mode === 'infinite' ? .006 : .012), 0, 100)
        if (g.combo > 0 && g.elapsed > g.comboEnd) g.combo = 0
        const k = g.keys
        const dir = (k.has('arrowright') || k.has('d') ? 1 : 0) - (k.has('arrowleft') || k.has('a') ? 1 : 0)
        const dashing = k.has('shift') && g.dashReady <= 0 && dir !== 0
        if (dashing) { g.dashReady = 5; g.invulnerable = .35; explode(g, g.playerX, g.playerY, '#d8b4fe', 12); note(250, .11, 'sawtooth') }
        g.playerX = clamp(g.playerX + dir * (dashing ? 46 : 6.2) * dt, 35, W - 35)
        const rapid = g.rapidUntil > g.elapsed
        if ((k.has(' ') || k.has('arrowup')) && g.elapsed - g.lastShot > (rapid ? .075 : .17)) {
          const plasma = g.plasmaUntil > g.elapsed
          const burst = g.burstUntil > g.elapsed
          const triple = g.tripleUntil > g.elapsed
          for (const vx of burst ? [-4, -2, 0, 2, 4] : triple ? [-2.5, 0, 2.5] : [0]) {
            g.shots.push({ x: g.playerX, y: g.playerY - 26, vx, vy: -12, enemy: false, power: plasma ? 2 : 1, size: plasma ? 9 : 5, color: plasma ? '#c084fc' : burst ? '#ff93cf' : triple ? '#ffe47d' : '#a78bfa' })
          }
          g.lastShot = g.elapsed; g.totalShots++; note(triple ? 810 : 720, .04)
        }
        for (const item of g.powerups) {
          item.y += (g.mode === 'infinite' ? 3.7 : 3) * dt
          item.x += item.drift * dt
          if (Math.abs(item.x - g.playerX) < 31 && Math.abs(item.y - g.playerY) < 31) {
            g.pickups++; item.y = H + 100; g.score += 125
            switch (item.kind) {
              case 'triple': g.tripleUntil = g.elapsed + 14; break
              case 'rapid': g.rapidUntil = g.elapsed + 11; break
              case 'shield': g.shield = clamp(g.shield + 70, 0, 100); break
              case 'life': g.lives = Math.min(5, g.lives + 1); break
              case 'emp': g.pulse = 100; break
              case 'plasma': g.plasmaUntil = g.elapsed + 13; break
              case 'burst': g.burstUntil = g.elapsed + 11; break
            }
            label(g, g.playerX, g.playerY - 48, POWERUP_NAMES[item.kind], POWERUP_COLORS[item.kind])
            explode(g, g.playerX, g.playerY, POWERUP_COLORS[item.kind], 18)
            logEvent(g, 'LOOT', `${POWERUP_NAMES[item.kind]} · POTENCIADOR RECOGIDO`)
            note(1050, .18, 'sine')
          }
        }
        g.powerups = g.powerups.filter(item => item.y < H + 20)
        if (g.boss) {
          const b = g.boss
          b.intro = Math.max(0, b.intro - dt / 60)
          b.x += b.dir * (b.mode === 2 ? 3.4 : 2.3) * (g.mode === 'infinite' ? 1.2 + Math.min(g.tier, 10) * .045 : 1) * dt
          if (b.x > W - 102) { b.x = W - 102; b.dir = -1 }
          if (b.x < 102) { b.x = 102; b.dir = 1 }
          if (b.mode === 1 && b.hp <= b.max / 2) {
            b.mode = 2; g.announcement = '⚠ TUX: KERNEL OVERDRIVE'; g.announceUntil = g.elapsed + 2.5
            g.flash = 3; g.shake = 12; logEvent(g, 'BOSS', 'FASE 2 · KERNEL OVERDRIVE ACTIVADO'); note(110, .47, 'sawtooth')
          }
          if (b.intro === 0 && g.elapsed >= b.nextVolley) {
            b.poseUntil = g.elapsed + .33
            const spread = b.mode === 2 ? (g.mode === 'infinite' ? [-4, -2.7, -1.4, 0, 1.4, 2.7, 4] : [-2.7, -1.4, 0, 1.4, 2.7]) : [-1.4, 0, 1.4]
            for (const vx of spread) g.shots.push({ x: b.x, y: b.y + 79, vx, vy: (b.mode === 2 ? 5.3 : 4.4) * (g.mode === 'infinite' ? 1.13 + Math.min(g.tier, 12) * .035 : 1), enemy: true, power: 1, size: b.mode === 2 ? 7 : 6, color: b.mode === 2 ? '#ff5984' : '#ffc174' })
            b.nextVolley = g.elapsed + (b.mode === 2 ? .71 : 1.06) * (g.mode === 'infinite' ? Math.max(.52, .82 - g.tier * .025) : 1)
          }
        } else {
          g.enemyMove += dt
          const live = g.enemies.filter(e => e.alive)
          const moveDelay = Math.max(g.mode === 'infinite' ? 3.2 : 7, (23 - (g.wave - 1) * 1.3 - Math.floor((g.enemies.length - live.length) / 5)) * (g.mode === 'infinite' ? Math.max(.43, 1 - g.tier * .065) : 1))
          if (g.enemyMove > moveDelay && live.length) {
            g.enemyMove = 0
            if (live.some(e => (g.enemyDir > 0 && e.x > W - 58) || (g.enemyDir < 0 && e.x < 58))) { g.enemyDir *= -1; live.forEach(e => e.y += 18) }
            live.forEach(e => e.x += g.enemyDir * (13 + Math.min(g.wave, 12) * 2))
            if (live.some(e => e.y > 414)) { g.phase = 'defeat'; logEvent(g, 'FAIL', 'LOS INVASORES SUPERARON EL PERÍMETRO') }
          }
          if (g.elapsed > g.enemyFire && live.length) {
            const source = live[Math.floor(Math.random() * live.length)]
            g.shots.push({ x: source.x, y: source.y + 18, vx: random(-.75, .75), vy: (3.2 + Math.min(g.wave, 8) * .6) * (g.mode === 'infinite' ? 1.1 + Math.min(g.tier, 12) * .055 : 1), enemy: true, power: 1, size: 5, color: COLORS[source.type] })
            if (g.mode === 'infinite' && g.tier >= 2 && Math.random() < .16 + Math.min(.25, g.tier * .014)) {
              g.shots.push({ x: source.x, y: source.y + 18, vx: -2.3, vy: 4.5 + Math.min(g.tier, 10) * .2, enemy: true, power: 1, size: 6, color: '#f472b6' })
              g.shots.push({ x: source.x, y: source.y + 18, vx: 2.3, vy: 4.5 + Math.min(g.tier, 10) * .2, enemy: true, power: 1, size: 6, color: '#f472b6' })
            }
            g.enemyFire = g.elapsed + (g.wave === 1 ? random(.7, 1.2) : random(.45, .85)) * (g.mode === 'infinite' ? Math.max(.4, .84 - g.tier * .048) : 1)
          }
        }
        if (g.mode === 'infinite' && g.elapsed >= g.nextMeteor) {
          spawnMeteor(g)
          if (g.tier >= 5 && Math.random() < .3) spawnMeteor(g)
          const rate = Math.max(1.35, 5.6 - g.tier * .36)
          g.nextMeteor = g.elapsed + random(rate * .7, rate * 1.2)
        }
        for (const meteor of g.meteors) {
          meteor.x += (meteor.vx + (meteor.kind === 'mine' ? Math.sin(g.elapsed * 5 + meteor.rotation) * 1.6 : 0)) * dt; meteor.y += meteor.vy * dt; meteor.rotation += .05 * dt
          const bricked = g.bricks.filter(br => br.hp > 0 && Math.abs(br.x + 5 - meteor.x) < meteor.radius && Math.abs(br.y + 5 - meteor.y) < meteor.radius)
          if (bricked.length) {
            for (const block of bricked) block.hp = 0
            explode(g, meteor.x, meteor.y, '#ffb06c', 12); meteor.y = H + 100
            continue
          }
          if (g.invulnerable <= 0 && Math.abs(meteor.x - g.playerX) < 18 + meteor.radius && Math.abs(meteor.y - g.playerY) < 18 + meteor.radius) {
            meteor.y = H + 100; explode(g, meteor.x, g.playerY, '#ff9d5d', 18)
            if (g.shield >= 35) { g.shield -= 35; label(g, g.playerX, g.playerY - 35, 'METEOR -35 SHIELD', '#ffc18b') }
            else {
              g.lives--; g.invulnerable = 1.25; g.combo = 0; g.shake = 7; logEvent(g, 'METEOR', 'IMPACTO SOBRE LA NAVE')
              if (g.lives <= 0) { g.phase = 'defeat'; logEvent(g, 'FAIL', 'MISIÓN FALLIDA: SIN VIDAS') }
            }
          }
        }
        g.meteors = g.meteors.filter(m => m.y < H + 50 && m.x > -50 && m.x < W + 50)
        for (const shot of g.shots) {
          const oldX = shot.x, oldY = shot.y
          shot.x += shot.vx * dt; shot.y += shot.vy * dt
          // Barreras: los proyectiles de ambos bandos desgastan los ladrillos.
          // Comprobación del trayecto para que los disparos rápidos no atraviesen un muro.
          let struck: Brick | undefined
          const steps = Math.max(1, Math.ceil(Math.max(Math.abs(shot.x - oldX), Math.abs(shot.y - oldY)) / 5))
          for (let step = 1; step <= steps && !struck; step++) {
            const sx = oldX + (shot.x - oldX) * step / steps
            const sy = oldY + (shot.y - oldY) * step / steps
            struck = g.bricks.find(brick => brick.hp > 0 && sx >= brick.x - shot.size / 2 && sx <= brick.x + 10 + shot.size / 2 && sy >= brick.y - shot.size / 2 && sy <= brick.y + 10 + shot.size / 2)
          }
          if (struck) {
            struck.hp--
            explode(g, struck.x + 5, struck.y + 5, struck.hp ? '#ffd17a' : '#4affba', 5)
            shot.y = shot.enemy ? H + 120 : -120
            continue
          }
          if (shot.enemy) {
            if (Math.abs(shot.x - g.playerX) < 25 && Math.abs(shot.y - g.playerY) < 22) {
              shot.y = H + 100
              if (g.invulnerable > 0) continue
              if (g.shield >= 25) { g.shield -= 25; label(g, g.playerX, g.playerY - 26, 'SHIELD -25', '#64f8ff'); note(340, .085) }
              else { g.lives--; g.invulnerable = 1.25; g.combo = 0; g.flash = 2; g.shake = 8; explode(g, g.playerX, g.playerY, '#ff5e95', 17); logEvent(g, 'ALERT', 'LA NAVE RECIBIÓ UN IMPACTO'); note(125, .2, 'sawtooth'); if (g.lives <= 0) { g.phase = 'defeat'; logEvent(g, 'FAIL', 'MISIÓN FALLIDA: SIN VIDAS') } }
            }
          } else if (g.boss) {
            const b = g.boss
            if (Math.abs(shot.x - b.x) < 56 && Math.abs(shot.y - b.y) < 72) {
              shot.y = -100; b.hp = Math.max(0, b.hp - shot.power); g.hits++; g.score += 35
              if (Math.random() > .35) explode(g, shot.x, shot.y + 10, b.mode === 2 ? '#ff608e' : '#4cdaff', 5)
              note(210, .045)
            }
          } else {
            const hit = g.enemies.find(e => e.alive && Math.abs(shot.x - e.x) < 25 && Math.abs(shot.y - e.y) < 19)
            if (hit) {
              shot.y = -100; hit.hp -= shot.power; g.hits++
              if (hit.hp <= 0) {
                hit.alive = false; g.kills++; increaseThreat(g); g.combo = g.elapsed < g.comboEnd ? Math.min(g.combo + 1, 20) : 1; g.comboEnd = g.elapsed + 3.2
                const amount = 100 + Math.min(10, g.combo) * 25; g.score += amount; g.pulse = clamp(g.pulse + 6, 0, 100)
                g.statuses[hit.type] = clamp(g.statuses[hit.type] - (g.wave === 1 ? 12.5 : 8), 0, 100)
                explode(g, hit.x, hit.y, COLORS[hit.type]); label(g, hit.x, hit.y - 14, `+${amount}`, COLORS[hit.type])
                logEvent(g, hit.type, `${CIA_NAMES[hit.type]} · ${CIA_DESC[hit.type]}`)
                spawnPowerup(g, hit.x, hit.y)
                reportEvent(hit.type); note(310 + g.combo * 25, .07)
              } else { explode(g, hit.x, hit.y, COLORS[hit.type], 6); label(g, hit.x, hit.y - 15, 'ARMOR -1', '#ffffff') }
            }
          }
        }
        g.shots = g.shots.filter(s => s.y > -35 && s.y < H + 25 && s.x > -20 && s.x < W + 20)
        for (const p of g.particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += .035 * dt; p.life -= dt }
        g.particles = g.particles.filter(p => p.life > 0)
        for (const f of g.floaters) { f.y -= .8 * dt; f.life -= dt }
        g.floaters = g.floaters.filter(f => f.life > 0)
        if (g.boss && g.boss.hp <= 0) {
          explode(g, g.boss.x, g.boss.y, '#f472b6', 65); g.boss = null; g.shake = 15; g.flash = 4
          g.score += 2500; reportEvent('BOSS'); note(90, .7, 'sawtooth')
          if (g.mode === 'story') {
            g.phase = 'victory'; g.statuses = { C: 0, I: 0, A: 0 }
            g.announcement = 'KERNEL PANIC SIMULADO'; logEvent(g, 'CRITICAL', 'TUX DERROTADO · KERNEL PANIC SIMULADO')
          } else {
            logEvent(g, 'BOSS', 'TUX DERROTADO EN INFINITO · LA INVASIÓN CONTINÚA')
            g.wave++; g.enemies = spawnWave(g.wave, g.mode, g.tier); g.shots = []
            g.bricks = makeBricks(); g.enemyMove = 0; g.enemyFire = g.elapsed + 1.4
            g.announcement = `INFINITO / OLEADA ${g.wave} · SIGUE SOBREVIVIENDO`
            g.announceUntil = g.elapsed + 2.9
          }
        }
        if (!g.boss && g.phase === 'playing' && g.enemies.length > 0 && g.enemies.every(e => !e.alive)) {
          g.wave++; g.bricks = makeBricks(); g.enemyDir = 1; g.enemyMove = 0; g.enemyFire = g.elapsed + 1.5
          g.shots = g.shots.filter(s => !s.enemy)
          g.shield = Math.min(100, g.shield + 25); g.pulse = Math.min(100, g.pulse + 20)
          const bossIncoming = g.mode === 'story' ? g.wave === 3 : g.wave % 4 === 0
          if (bossIncoming) {
            const hp = g.mode === 'infinite' ? 50 + g.tier * 10 + Math.floor(g.wave / 4) * 12 : 45
            g.enemies = []; g.boss = { x: W / 2, y: 173, hp, max: hp, dir: 1, mode: 1, nextVolley: g.elapsed + 3, intro: 2.7, poseUntil: 0 }
            g.announcement = g.mode === 'infinite' ? `INFINITO / TUX REGRESA · NIVEL ${g.tier + 1}` : 'JEFE FINAL · TUX KERNEL GUARDIAN'
            g.announceUntil = g.elapsed + 3
            logEvent(g, 'BOSS', 'TUX / GUARDIÁN DEL KERNEL DESPLEGADO'); note(155, .4, 'sawtooth')
          } else {
            g.enemies = spawnWave(g.wave, g.mode, g.tier)
            g.announcement = g.mode === 'infinite' ? `INFINITO / OLEADA ${g.wave} · AMENAZA ${g.tier + 1}` : 'OLEADA 02 · SISTEMA BAJO PRESIÓN'
            g.announceUntil = g.elapsed + 2.8
            logEvent(g, 'WAVE', `OLEADA ${g.wave} ACTIVADA`); note(390, .22)
          }
        }
      }
      drawGame(ctx, g, now)
      if (now - lastPublished > 110) { lastPublished = now; publish() }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [note, publish, reportEvent])
  useEffect(() => {
    if (view.phase === 'paused') return
    const scene = sceneFor(gameRef.current)
    if (activeSceneRef.current !== scene) playScene(scene)
    // Scene follows game phase / wave / boss transformations. Track selection stays local.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view.phase, view.wave, view.bossMode, view.mode])
  const phaseOver = view.phase === 'ready' || view.phase === 'paused' || view.phase === 'victory' || view.phase === 'defeat'
  const result = view.phase === 'victory'
  const toggleSound = () => setSoundOn(old => { soundRef.current = !old; return !old })
  const report = [
    { key: 'C' as const, name: 'Confidencialidad', amount: view.statuses.C, desc: 'Acceso o divulgación de información simulada.' },
    { key: 'I' as const, name: 'Integridad', amount: view.statuses.I, desc: 'Modificaciones ficticias que ilustran pérdida de exactitud.' },
    { key: 'A' as const, name: 'Disponibilidad', amount: view.statuses.A, desc: 'Servicios imaginarios dejan de estar disponibles.' },
  ]
  return <div className="app-shell" ref={shellRef} style={{'--beat-hue': '265', '--beat-strength': '0', '--beat-opacity': '.09', '--beat-glow': '7px'} as CSSProperties}>
    <header className="topbar"><div className="topbar-content"><div className="brand"><span className="brand-icon">◆</span><span>CYBER<span>INVADERS</span><small>OPERATION: INFINITE PULSE · v0.5</small></span></div><div className="top-right"><span className="pill pill-green"><i className="status-dot"/> SAFE SIMULATION</span><button className={`pill pill-server api-toggle ${apiConnected ? 'connected' : ''}`} onClick={checkApi} title="API opcional. Haz clic para comprobar conexión con Express en el puerto 3001."><i className="status-dot"/> {apiConnected ? 'API CONECTADA' : 'MODO LOCAL · CONECTAR API'}</button></div></div></header>
    <main className="main-container"><section className="hero"><div><div className="breadcrumb"><span className="small-square"/> SEGURIDAD INFORMÁTICA <span className="slash">/</span> OPERACIÓN CIA</div><h1>THE SYSTEM <span>IS UNDER ATTACK<span className="blink-dot">_</span></span></h1><p>Un arcade de combate que convierte la tríada CIA en una experiencia épica. Derriba las defensas del sistema y enfréntate a <b>TUX</b>.</p></div><div className="mission-id"><span>CLASIFICACIÓN</span><strong>TOP SECRET</strong><small>LAB // 2026</small></div></section>
    <div className="layout"><section className="game-panel"><div className="panel-heading"><span><i className="status-dot"/> LIVE COMBAT FEED <span className="faint">/ 900×548</span></span><div className="mission-tag">{view.bossHp !== null ? '⚠ TUX / BOSS' : `SECTOR ${view.wave.toString().padStart(2,'0')}`}</div></div>
    <div className="hud"><div><span>SCORE</span><strong className="hud-score">{view.score.toLocaleString('en-US').padStart(6, '0')}</strong></div><div><span>VIDAS</span><strong className="hearts">{'♥'.repeat(view.lives)}<em>{'♡'.repeat(Math.max(0, 5 - view.lives))}</em></strong></div><div><span>COMBO</span><strong className={view.combo > 1 ? 'combo-active' : ''}>x{view.combo || 1}</strong></div><div><span>TIEMPO</span><strong>{timeText(view.elapsed)}</strong></div></div>
    <div className="game-meta"><span className={view.mode === 'infinite' ? 'difficulty-danger' : ''}>{view.mode === 'infinite' ? `♾ INFINITO / AMENAZA ${view.tier + 1} · ${20 - view.kills % 20} BAJAS PARA SUBIR` : '◇ MODO HISTORIA'}</span><span>🧱 {view.bricks} BLOQUES · 🎁 {view.pickups} RECOGIDOS</span></div>
    <div className="chroma-strip" aria-hidden="true"/><div className="canvas-shell"><canvas width={W} height={H} ref={canvasRef} aria-label="Cyber Invaders: juego de disparos espaciales con enemigos que representan la tríada CIA"/>
      {phaseOver && <div className="game-overlay"><div className="overlay-content"><span className="overlay-kicker">{view.phase === 'ready' ? '◈ INICIANDO OPERACIÓN' : view.phase === 'paused' ? '◈ SIMULACIÓN DETENIDA' : result ? '◈ OPERACIÓN COMPLETADA' : '◈ SESIÓN FINALIZADA'}</span>
        <h2 className={result ? 'panic' : ''}>{view.phase === 'ready' ? <>CYBER <span>INVADERS</span></> : view.phase === 'paused' ? 'PAUSA TÁCTICA' : result ? 'KERNEL PANIC' : 'GAME OVER'}</h2>
        <p>{view.phase === 'ready' ? 'Historia: dos oleadas y Tux. Infinito: cada 20 enemigos aumenta el peligro; Tux vuelve cada 4 oleadas.' : view.phase === 'paused' ? 'El campo de batalla está en pausa.' : result ? 'TUX ha sido derrotado. Colapso del sistema SIMULADO: ningún recurso real fue alterado.' : 'Tu nave fue eliminada. El laboratorio sigue seguro.'}</p>
        <div className="overlay-buttons"><button className="cta" onClick={() => view.phase === 'paused' ? pause() : start()}>{view.phase === 'paused' ? '▶ CONTINUAR' : view.phase === 'ready' ? '▶ INICIAR MISIÓN' : '↻ JUGAR DE NUEVO'}</button>{view.phase === 'ready' && <button className="ghost" onClick={() => start(true)}>🐧 DEMO: JEFE FINAL</button>}<button className="infinite-btn" onClick={() => start(false, 'infinite')}>♾ MODO INFINITO</button>{['victory','defeat'].includes(view.phase) && <button className="ghost" onClick={() => setShowReport(true)}>▤ VER INFORME CIA</button>}</div>
        <small>{view.phase === 'ready' ? 'ENTER PARA COMENZAR · P PARA PAUSAR' : result ? 'SIMULACIÓN DIDÁCTICA • SIN DAÑO REAL · PRUEBA MODO INFINITO' : 'CYBER INVADERS / SECURITY LAB'}</small>
      </div></div>}
    </div>
    <div className="skillbar"><div className="skill"><div className="skill-title"><span>◈ PULSO EMP</span><b>{Math.floor(view.pulse)}%</b></div><div className="skill-track"><div className="skill-charge" style={{ width: `${view.pulse}%` }}/></div><small>{view.pulse >= 100 ? 'LISTO • PRESIONA E' : 'ELIMINA ENEMIGOS PARA CARGAR'}</small></div><div className="skill"><div className="skill-title"><span>◇ ESCUDO</span><b>{Math.floor(view.shield)}%</b></div><div className="skill-track"><div className="shield-charge" style={{ width: `${view.shield}%` }}/></div><small>ABSORBE IMPACTOS AUTOMÁTICAMENTE</small></div><div className="skill dash-skill"><div className="skill-title"><span>↗ DASH</span><b>{view.dashReady === 0 ? 'LISTO' : `${view.dashReady.toFixed(1)}s`}</b></div><small>SHIFT + MOVIMIENTO</small></div></div>
    <div className="power-status"><span>🎁 POWERUPS ALEATORIOS:</span><span className={view.tripleActive ? 'power-active' : ''}>TRIPLE {view.tripleActive ? '● ACTIVO' : '○'}</span><span className={view.rapidActive ? 'power-active' : ''}>TURBO {view.rapidActive ? '● ACTIVO' : '○'}</span><span className={view.plasmaActive ? 'power-active' : ''}>PLASMA {view.plasmaActive ? '●' : '○'}</span><span className={view.burstActive ? 'power-active' : ''}>BURST x5 {view.burstActive ? '●' : '○'}</span><span>🧱 MUROS DESTRUCTIBLES</span></div>
    <div className="button-row"><button className="button-primary" onClick={() => start()}>↻ NUEVA PARTIDA</button><button onClick={pause} disabled={view.phase !== 'playing' && view.phase !== 'paused'}>{view.phase === 'paused' ? '▶ REANUDAR' : 'Ⅱ PAUSAR'}</button><button onClick={toggleSound}>{soundOn ? '♫ SONIDO ON' : '♪ SONIDO OFF'}</button><button onClick={() => setShowReport(true)}>▤ INFORME</button><button className="infinite-btn" onClick={() => start(false, 'infinite')}>♾ INFINITO</button></div>
    <section className="music-studio" aria-label="DJ Cyber: música local sincronizada">
      <div className="music-studio-header"><div><strong>♫ DJ CYBER / CHROMA BEAT</strong><small>Importa canciones desde tu PC. Cambian por fase y se repiten en bucle. No se envían al servidor.</small></div><span className={`music-state ${musicPlaying ? 'on' : ''}`}>{musicPlaying ? '● PLAYING' : '○ EN ESPERA'}</span></div>
      <div className="music-live"><div className="music-live-info"><span>PISTA ACTIVA</span><b>{activeMusic ? (musicNames[activeMusic] ?? 'SIN PISTA') : 'SIN PISTA PARA ESTA FASE'}</b></div><div className="music-beat"><div className="music-meter"><span style={{width:`${Math.min(100,view.musicEnergy*140)}%`}}/></div><small>{syncEnabled ? `♪ ${view.beatCount} golpes · CHROMA COLOR ACTIVO` : 'SINCRONIZACIÓN DESACTIVADA'}</small></div><button type="button" onClick={toggleMusic} disabled={!Object.keys(musicNames).length}>{musicPlaying ? 'Ⅱ PAUSA' : '▶ PLAY'}</button><label className="music-volume">VOL <input aria-label="Volumen musical" type="range" min="0" max="1" step="0.05" value={musicVolume} onChange={event=>setVolume(Number(event.target.value))}/></label></div>
      <div className="music-settings"><label><input type="checkbox" checked={syncEnabled} onChange={e=>changeSync(e.target.checked)}/> Sincronizar colores, luces y ataques del jefe con el ritmo</label><label className="sensitivity">SENSIBILIDAD <input aria-label="Sensibilidad rítmica" type="range" min="0.7" max="1.6" step="0.1" value={sensitivity} onChange={e=>setMusicSensitivity(Number(e.target.value))}/> {sensitivity.toFixed(1)}x</label><label><input type="checkbox" checked={reducedEffects} onChange={e=>changeReduced(e.target.checked)}/> Reducir destellos</label></div>
      <div className="music-tracks">{TRACK_SLOTS.map(slot => <div className="music-track" key={slot.key}><div><b>{slot.label}</b><small title={musicNames[slot.key] ?? ''}>{musicNames[slot.key] ?? `Sugerencia: ${slot.suggested} · importa tu archivo`}</small></div><label className="file-music" tabIndex={0}>+ IMPORTAR<input type="file" accept="audio/*,.mp3,.wav,.ogg,.m4a,.flac" onChange={e=>{importMusic(slot.key,e.target.files?.[0]); e.target.value=''}}/></label>{musicNames[slot.key] && <button type="button" title="Escuchar esta pista" onClick={()=>{ userStoppedMusicRef.current=false; void engineRef.current?.play(slot.key).then(ok=>{setMusicPlaying(!!ok);setActiveMusic(slot.key)}).catch(()=>setMusicNotice('Pulsa PLAY para activar el audio.'))}}>▶</button>}{musicNames[slot.key] && <button type="button" title="Quitar la pista" onClick={()=>removeMusic(slot.key)}>✕</button>}</div>)}</div>
      <small className="music-notice">{musicNotice} Los archivos se guardan en este navegador mediante IndexedDB cuando esté disponible.</small>
    </section>
    <div className="control-guide"><span>MOVER <kbd>A</kbd><kbd>D</kbd> / <kbd>←</kbd><kbd>→</kbd></span><span>DISPARAR <kbd>ESPACIO</kbd></span><span>ESCUDO <kbd>AUTO</kbd></span><span>PULSO <kbd>E</kbd></span><span>DASH <kbd>SHIFT</kbd></span><span>PAUSA <kbd>P</kbd></span><span>LOOT <kbd>RECOGER</kbd></span></div>
    <div className="touch-pad"><button aria-label="Mover a la izquierda" onPointerDown={e => { e.preventDefault(); gameRef.current.keys.add('a') }} onPointerUp={() => gameRef.current.keys.delete('a')} onPointerLeave={() => gameRef.current.keys.delete('a')} onPointerCancel={() => gameRef.current.keys.delete('a')}>◀</button><button aria-label="Mover a la derecha" onPointerDown={e => { e.preventDefault(); gameRef.current.keys.add('d') }} onPointerUp={() => gameRef.current.keys.delete('d')} onPointerLeave={() => gameRef.current.keys.delete('d')} onPointerCancel={() => gameRef.current.keys.delete('d')}>▶</button><button className="fire" onPointerDown={e => { e.preventDefault(); gameRef.current.keys.add(' ') }} onPointerUp={() => gameRef.current.keys.delete(' ')} onPointerLeave={() => gameRef.current.keys.delete(' ')} onPointerCancel={() => gameRef.current.keys.delete(' ')}>◎ FUEGO</button><button onClick={usePulse}>◈ EMP</button></div>
    </section>
    <aside className="sidebar"><section className="side-card threat-card"><div className="card-heading"><span>◈ ANÁLISIS DE AMENAZAS</span><span className="realtime"><i className="status-dot"/> LIVE</span></div><p>Impacto de los ataques sobre los tres pilares de la seguridad.</p>
    {report.map(item => <div className="cia" key={item.key}><div className="cia-row"><span className={`cia-symbol symbol-${item.key}`}>{item.key}</span><div><strong>{item.name}</strong><small>{item.desc}</small></div><b>{Math.round(item.amount)}%</b></div><div className="cia-track"><span className={`cia-bar bar-${item.key}`} style={{ width: `${item.amount}%` }}/></div><div className="cia-meta"><span>{item.amount === 100 ? '● ÍNTEGRO' : item.amount > 0 ? '⚠ COMPROMETIDO' : '✕ COLAPSADO'}</span><span>SIMULADO</span></div></div>)}
    <div className="threat-summary"><span>ÍNDICE DE SEGURIDAD</span><strong>{Math.round((view.statuses.C + view.statuses.I + view.statuses.A) / 3)}<small>/ 100</small></strong></div></section>
    <section className="side-card boss-panel"><div className="card-heading"><span>☠ OBJETIVO PRIORITARIO</span><span className={view.bossHp !== null ? 'boss-unlocked' : 'boss-locked'}>{view.bossHp !== null ? 'ACTIVO' : 'BLOQUEADO'}</span></div><div className="boss-info"><div className="boss-avatar">🐧</div><div><span className="target-label">FINAL BOSS</span><h3>TUX <span>/ KERNEL</span></h3><p>{view.bossHp !== null ? 'El guardián del sistema está en combate.' : view.mode === 'infinite' ? 'Tux regresará en cada cuarta oleada.' : 'Supera las dos oleadas para desbloquear el núcleo.'}</p></div></div><div className="boss-progress"><div><span>INTEGRIDAD DEL NÚCLEO</span><b>{view.bossHp === null ? '???' : `${Math.round(view.bossHp / view.bossMax * 100)}%`}</b></div><div className="boss-meter"><span style={{ width: `${view.bossHp === null ? 100 : view.bossHp / view.bossMax * 100}%` }}/></div></div>{view.bossHp !== null && <div className="rage-state">{view.bossAttacking ? '⚡ TUX: POSE DE ATAQUE' : view.bossMode === 2 ? '⚠ FASE II: KERNEL OVERDRIVE' : '● FASE I: GUARDIAN ACTIVE'}</div>}</section>
    <section className="side-card terminal-panel"><div className="card-heading"><span>›_ EVENTOS DE SEGURIDAD</span><span className="terminal-live">TERMINAL</span></div><div className="terminal-window"><div className="terminal-dots"><i/><i/><i/><span>cyber@simulator:~</span></div><div className="log-area">{view.logs.map((line, index) => <div className={index === 0 ? 'recent' : ''} key={`${line}-${index}`}><span>›</span> {line}</div>)}</div><div className="cursor-line">cyber@lab:~$ <span>▌</span></div></div></section>
    <section className="tip-card"><span>ⓘ MODO SEGURO</span><p>Todos los incidentes, el colapso de Linux y el Kernel Panic son <b>representaciones ficticias</b>. No se ejecutan comandos del sistema operativo.</p></section></aside></div>
    <footer><span>◈ CYBER INVADERS</span><span>PROYECTO EDUCATIVO · TRÍADA CIA · REACT + NODE</span><span>SIMULATION BUILD 0.5 · INFINITE PULSE</span></footer></main>
    {showReport && <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setShowReport(false) }}><section className="report-modal" role="dialog" aria-modal="true" aria-label="Informe de seguridad CIA"><div className="report-heading"><div><small>REPORTE POST MISIÓN // LABORATORIO</small><h2>INFORME DE SEGURIDAD</h2></div><button onClick={() => setShowReport(false)} aria-label="Cerrar informe">✕</button></div><p>Resumen de efectos <strong>simulados</strong> en el entorno ficticio. No representa análisis ni alteración de tu sistema operativo real.</p><div className="report-kpis"><div><small>PUNTUACIÓN</small><strong>{view.score.toLocaleString('en-US')}</strong></div><div><small>OBJETIVOS DESTRUIDOS</small><strong>{view.kills}</strong></div><div><small>PRECISIÓN</small><strong>{getAccuracy(view)}%</strong></div><div><small>TIEMPO</small><strong>{timeText(view.elapsed)}</strong></div><div><small>POWERUPS RECOGIDOS</small><strong>{view.pickups}</strong></div><div><small>MODO</small><strong>{view.mode === 'infinite' ? `INFINITO ${view.tier + 1}` : 'HISTORIA'}</strong></div><div><small>OLEADA</small><strong>{view.wave}</strong></div></div>{report.map(item => <div className="report-line" key={item.key}><div><span style={{ color: COLORS[item.key] }}>{item.key} — {item.name}</span><b>{Math.round(item.amount)}% protegido</b></div><small>{item.desc}</small></div>)}<div className="report-conclusion">{result ? 'RESULTADO: TUX DERROTADO / KERNEL PANIC SIMULADO / DISPONIBILIDAD 0%' : 'RESULTADO: ESTADO ACTUAL DEL LABORATORIO SIMULADO'}</div><button className="cta close-report" onClick={() => setShowReport(false)}>CERRAR INFORME</button></section></div>}
  </div>
}
export default App
