import type { GameSession } from '../game/GameSession';
import { CLEAR_KILLS, COMBAT_CONFIG, PLAYER_CONFIG } from '../config/balance';

interface Actions {
  start: () => void;
  pause: () => void;
  resume: () => void;
  title: () => void;
  toggleSound: () => void;
}

export interface PerformanceStats {
  fps: number;
  drawCalls: number;
  triangles: number;
  geometries: number;
}

const controls = `<span><kbd>W A S D</kbd><kbd>↑ ↓ ← →</kbd> 移動</span><span><kbd>J</kbd> 長押し連撃</span><span><kbd>K</kbd> 強攻撃</span><span><kbd>L</kbd> 仏技</span><span><kbd>Space</kbd> 回避</span>`;

function clock(seconds: number): string {
  return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`;
}

export class GameUI {
  private readonly abort = new AbortController();
  private readonly elements = new Map<string, HTMLElement>();
  private lastState = '';
  private debugVisible = false;
  private oldCombo = 0;
  private feedbackTimer: ReturnType<typeof setTimeout> | undefined;
  private feedbackAnimation: Animation | undefined;
  private flashAnimation: Animation | undefined;
  private readonly reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  constructor(private readonly root: HTMLElement, actions: Actions) {
    root.innerHTML = `
      <div class="screen-vignette" aria-hidden="true"></div>
      <section id="title-screen" class="screen title-screen" aria-labelledby="game-title">
        <header class="brand"><span class="brand-mark" aria-hidden="true">仏</span><span>BUDDHA MUSOU<small>一騎当千・仏像アクション</small></span></header>
        <div class="title-copy">
          <p class="eyebrow">一振りで、千の魂を解き放て。</p>
          <h1 id="game-title">仏像<span>無双</span><small>BUDDHA MUSOU / 仮題</small></h1>
          <div class="gold-rule"></div>
          <p class="title-description">押し寄せる落武者を、錫杖の一撃で薙ぎ払え。<br>千の魂を鎮める、仏の戦いが始まる。</p>
          <button id="start-button" class="primary-button" type="button">出 陣 <span>ENTER →</span></button>
          <p class="title-tip"><kbd>J</kbd> 連撃で溜める。<kbd>K</kbd> 一掃する。<kbd>L</kbd> 解き放つ。</p>
        </div>
        <footer class="title-footer"><div class="controls">${controls}</div><span class="prototype-label">PROTOTYPE · PC / KEYBOARD</span></footer>
        <p class="stage-name"><b>第一陣</b><span>荒廃した寺院</span><small>千体撃破</small></p>
      </section>

      <section id="hud" class="hud" aria-label="戦闘状況" hidden>
        <div class="vitals">
          <div class="hero-crest" aria-hidden="true"><svg viewBox="0 0 100 110"><circle cx="50" cy="38" r="30"/><circle cx="50" cy="38" r="24"/><path d="M29 101 25 87 31 70 40 65 41 57 36 49 34 34 40 23 47 20 47 12 53 12 55 21 62 27 65 36 63 50 58 57 59 64 72 72 79 91 74 101Z"/><path d="M38 74 50 87 63 74M42 42 47 43M54 43 59 42M48 52 54 52"/><path d="M13 105 13 33M9 22 9 32 17 32 17 22 9 22Z"/></svg><span>仏</span></div>
          <div class="vitals-title"><span>仏像戦士<small>不動の一撃 · 千魂を鎮めよ</small></span></div>
          <div class="meter-label"><span>体力</span><span id="hp-value"></span></div>
          <div id="hp-meter" class="meter hp-meter" role="progressbar" aria-label="体力" aria-valuemin="0" aria-valuemax="${PLAYER_CONFIG.maxHp}"><div id="hp-fill"></div></div>
          <div class="meter-label power-label"><span>仏力</span><span id="power-value">0 / 100</span></div>
          <div id="power-meter" class="meter power-meter" role="progressbar" aria-label="仏力" aria-valuemin="0" aria-valuemax="${PLAYER_CONFIG.buddhistPowerMax}"><div id="power-fill"></div></div>
          <p id="skill-label" class="skill-label"><kbd>L</kbd> 仏光陣</p>
        </div>
        <div class="objective"><span>撃破目標 <b>${CLEAR_KILLS}</b></span><strong><b id="kills-value">0</b><i> K.O.</i></strong><small>荒廃した寺院</small></div>
        <div id="combo-panel" class="combo-panel"><strong id="combo-value">0</strong><span>連撃 <b>COMBO</b></span><div class="combo-track"><div id="combo-fill"></div></div></div>
        <button id="pause-button" class="pause-button" type="button" aria-label="一時停止">Ⅱ <span>Esc</span></button>
        <button id="sound-button" class="sound-button" type="button" aria-label="効果音" aria-pressed="true" title="効果音の切り替え (M)">音 ON</button>
        <div class="battle-footer"><div class="controls">${controls}</div><span id="time-value">00:00</span></div>
        <div id="hurt-overlay" class="hurt-overlay" aria-hidden="true"></div>
        <div id="impact-flash" class="impact-flash" aria-hidden="true"></div>
        <div id="combat-feedback" class="combat-feedback" role="status" aria-live="polite" aria-atomic="true"><small id="feedback-kicker"></small><strong id="feedback-title"></strong><span id="feedback-hits"></span></div>
      </section>

      <section id="pause-screen" class="screen modal-screen" aria-labelledby="pause-title" hidden>
        <div class="modal-card"><p class="eyebrow">PAUSED</p><h2 id="pause-title">ひと息、整える。</h2><p>戦闘は一時停止しています。</p>
        <button id="resume-button" class="primary-button" type="button">戦いへ戻る <span>Esc →</span></button>
        <button id="pause-title-button" class="text-button" type="button">タイトルへ戻る</button></div>
      </section>

      <section id="result-screen" class="screen modal-screen" aria-labelledby="result-title" hidden>
        <div class="modal-card result-card"><p id="result-eyebrow" class="eyebrow">BATTLE COMPLETE</p><h2 id="result-title">成仏完了</h2><p id="result-description"></p>
        <dl class="result-stats"><div><dt>撃破数</dt><dd id="result-kills">0</dd></div><div><dt>最大 COMBO</dt><dd id="result-combo">0</dd></div><div><dt>戦闘時間</dt><dd id="result-time">00:00</dd></div></dl>
        <button id="retry-button" class="primary-button" type="button">もう一度、戦う <span>Enter →</span></button>
        <button id="result-title-button" class="text-button" type="button">タイトルへ戻る</button></div>
      </section>
      <pre id="debug-panel" class="debug-panel" hidden></pre>
    `;
    root.querySelectorAll<HTMLElement>('[id]').forEach((element) => this.elements.set(element.id, element));
    const bind = (id: string, action: () => void) => {
      this.el(id).addEventListener('click', action, { signal: this.abort.signal });
    };
    bind('start-button', actions.start);
    bind('retry-button', actions.start);
    bind('pause-button', actions.pause);
    bind('sound-button', actions.toggleSound);
    bind('resume-button', actions.resume);
    bind('pause-title-button', actions.title);
    bind('result-title-button', actions.title);
  }

  toggleDebug(): void {
    this.debugVisible = !this.debugVisible;
    this.el('debug-panel').hidden = !this.debugVisible;
  }

  setSoundEnabled(enabled: boolean): void {
    this.text('sound-button', enabled ? '音 ON' : '音 OFF');
    this.el('sound-button').setAttribute('aria-pressed', String(enabled));
  }

  /** Called only for a confirmed damage batch, so the display rewards actual hits. */
  combatFeedback(kind: 'normal' | 'strong' | 'skill', hits: number, restart = true): void {
    if (hits <= 0 || this.root.dataset.state !== 'playing') return;
    this.text('feedback-hits', `${hits} HIT${hits === 1 ? '' : 'S'}`);
    // Later targets belong to the same swing: update the total without replaying its impact.
    if (!restart) return;
    if (this.feedbackTimer !== undefined) clearTimeout(this.feedbackTimer);
    this.feedbackAnimation?.cancel();
    this.flashAnimation?.cancel();
    const banner = this.el('combat-feedback');
    banner.dataset.kind = kind;
    banner.classList.add('visible');
    this.text('feedback-kicker', kind === 'skill' ? '仏力解放' : kind === 'strong' ? '錫杖・強撃' : '錫杖・連撃');
    this.text('feedback-title', kind === 'skill' ? '仏光陣' : kind === 'strong' ? '一 掃' : '連 撃');
    if (!this.reducedMotion.matches) {
      this.feedbackAnimation = banner.animate([
        { opacity: 0, transform: `translateX(${kind === 'normal' ? 18 : -40}px) scale(${kind === 'skill' ? 1.16 : 1.08})` },
        { opacity: 1, transform: 'translateX(0) scale(1)' },
      ], { duration: kind === 'skill' ? 220 : 130, easing: 'cubic-bezier(.16,1,.3,1)' });
      if (kind !== 'normal') this.flashAnimation = this.el('impact-flash').animate([
        { opacity: kind === 'skill' ? 0.65 : 0.3 }, { opacity: 0 },
      ], { duration: kind === 'skill' ? 340 : 180, easing: 'ease-out' });
    }
    this.feedbackTimer = setTimeout(() => {
      banner.classList.remove('visible');
      this.feedbackTimer = undefined;
    }, kind === 'skill' ? 1350 : kind === 'strong' ? 720 : 450);
  }

  private resetFeedback(): void {
    if (this.feedbackTimer !== undefined) clearTimeout(this.feedbackTimer);
    this.feedbackTimer = undefined;
    this.feedbackAnimation?.cancel();
    this.flashAnimation?.cancel();
    this.el('combat-feedback').classList.remove('visible');
  }

  update(session: GameSession, stats: PerformanceStats): void {
    const { player, state } = session;
    if (this.lastState !== state) {
      this.resetFeedback();
      this.lastState = state;
      this.el('title-screen').hidden = state !== 'title';
      this.el('hud').hidden = state !== 'playing' && state !== 'paused';
      this.el('hud').inert = state !== 'playing';
      this.el('pause-screen').hidden = state !== 'paused';
      this.el('result-screen').hidden = state !== 'result';
      this.root.dataset.state = state;
      if (state === 'paused') this.el('resume-button').focus({ preventScroll: true });
      if (state === 'result') this.el('retry-button').focus({ preventScroll: true });
      if (state === 'title') this.el('start-button').focus({ preventScroll: true });
      if (state === 'playing' && document.activeElement instanceof HTMLElement) document.activeElement.blur();
    }
    this.text('hp-value', `${Math.ceil(player.hp)} / ${PLAYER_CONFIG.maxHp}`);
    this.text('power-value', `${player.power} / ${PLAYER_CONFIG.buddhistPowerMax}`);
    this.el('hp-fill').style.transform = `scaleX(${Math.max(0, player.hp / PLAYER_CONFIG.maxHp)})`;
    this.el('power-fill').style.transform = `scaleX(${player.power / PLAYER_CONFIG.buddhistPowerMax})`;
    this.el('hp-meter').setAttribute('aria-valuenow', String(player.hp));
    this.el('power-meter').setAttribute('aria-valuenow', String(player.power));
    this.el('skill-label').classList.toggle('ready', player.power >= PLAYER_CONFIG.buddhistPowerMax);
    this.text('skill-label', player.power >= PLAYER_CONFIG.buddhistPowerMax ? '[L] 仏光陣 発動可能' : '[L] 仏光陣');
    this.text('kills-value', String(session.kills));
    this.text('combo-value', String(session.combo));
    this.el('combo-panel').classList.toggle('active', session.combo > 0);
    this.el('combo-panel').classList.toggle('large', session.combo >= 20);
    this.el('combo-fill').style.transform = `scaleX(${session.comboRemaining / COMBAT_CONFIG.comboTimeout})`;
    if (session.combo !== this.oldCombo) {
      if (!this.reducedMotion.matches) this.el('combo-value').animate([{ transform: 'scale(1.2) rotate(-3deg)' }, { transform: 'scale(1)' }], { duration: 180 });
      this.oldCombo = session.combo;
    }
    this.el('hurt-overlay').classList.toggle('visible', player.hurt && state === 'playing');
    this.text('time-value', clock(session.elapsed));
    if (state === 'result') {
      const clear = session.result === 'clear';
      this.text('result-eyebrow', clear ? 'ALL SOULS RELEASED' : 'BATTLE ENDED');
      this.text('result-title', clear ? '成仏完了' : '力尽きた……');
      this.text('result-description', clear ? '千の魂に、安らぎを。' : '回避で間合いを取り、強攻撃で群れを崩そう。');
      this.text('result-kills', String(session.kills));
      this.text('result-combo', String(session.maxCombo));
      this.text('result-time', clock(session.elapsed));
    }
    if (this.debugVisible) {
      const enemies = session.enemies.filter((enemy) => enemy.state !== 'inactive' && enemy.state !== 'dead').length;
      this.text('debug-panel', `F3 · DEBUG\nFPS           ${stats.fps}\nActive Enemies ${enemies}\nKills         ${session.kills}\nDraw Calls    ${stats.drawCalls}\nTriangles     ${stats.triangles}\nGeometries    ${stats.geometries}`);
    }
  }

  dispose(): void { this.resetFeedback(); this.abort.abort(); this.root.replaceChildren(); }
  private el(id: string): HTMLElement { return this.elements.get(id)!; }
  private text(id: string, value: string): void {
    const element = this.el(id);
    if (element.textContent !== value) element.textContent = value;
  }
}
