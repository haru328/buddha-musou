import type { GameSession } from '../game/GameSession';
import { CLEAR_KILLS, COMBAT_CONFIG, PLAYER_CONFIG } from '../config/balance';

interface Actions {
  start: () => void;
  pause: () => void;
  resume: () => void;
  title: () => void;
}

export interface PerformanceStats {
  fps: number;
  drawCalls: number;
  triangles: number;
  geometries: number;
}

const controls = `<span><kbd>W A S D</kbd><kbd>↑ ↓ ← →</kbd> 移動</span><span><kbd>J</kbd> 通常攻撃</span><span><kbd>K</kbd> 強攻撃</span><span><kbd>L</kbd> 仏技</span><span><kbd>Space</kbd> 回避</span>`;

function clock(seconds: number): string {
  return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`;
}

export class GameUI {
  private readonly abort = new AbortController();
  private readonly elements = new Map<string, HTMLElement>();
  private lastState = '';
  private debugVisible = false;
  private oldCombo = 0;

  constructor(private readonly root: HTMLElement, actions: Actions) {
    root.innerHTML = `
      <div class="screen-vignette" aria-hidden="true"></div>
      <section id="title-screen" class="screen title-screen" aria-labelledby="game-title">
        <header class="brand"><span class="brand-mark" aria-hidden="true">仏</span><span>BUDDHA MUSOU<small>ブラウザ・アクションプロトタイプ</small></span></header>
        <div class="title-copy">
          <p class="eyebrow">一振りで、百の魂を解き放て。</p>
          <h1 id="game-title">仏像<span>無双</span><small>（仮）</small></h1>
          <div class="gold-rule"></div>
          <p class="title-description">荒廃した寺院に、落武者たちが集う。<br>錫杖を振るい、仏の光で百体を鎮めよ。</p>
          <button id="start-button" class="primary-button" type="button">戦いを始める <span>Enter →</span></button>
          <p class="title-tip">通常攻撃で仏力を溜め、<kbd>L</kbd> で「仏光陣」。</p>
        </div>
        <footer class="title-footer"><div class="controls">${controls}</div><span class="prototype-label">PROTOTYPE · PC / KEYBOARD</span></footer>
        <p class="stage-name">壱<span>荒廃した寺院</span></p>
      </section>

      <section id="hud" class="hud" aria-label="戦闘状況" hidden>
        <div class="vitals">
          <div class="vitals-title"><span class="small-seal">仏</span><span>仏像戦士<small>守りを崩さず、群れを薙ぎ払え</small></span></div>
          <div class="meter-label"><span>体力</span><span id="hp-value"></span></div>
          <div id="hp-meter" class="meter hp-meter" role="progressbar" aria-label="体力" aria-valuemin="0" aria-valuemax="${PLAYER_CONFIG.maxHp}"><div id="hp-fill"></div></div>
          <div class="meter-label power-label"><span>仏力</span><span id="power-value">0 / 100</span></div>
          <div id="power-meter" class="meter power-meter" role="progressbar" aria-label="仏力" aria-valuemin="0" aria-valuemax="${PLAYER_CONFIG.buddhistPowerMax}"><div id="power-fill"></div></div>
          <p id="skill-label" class="skill-label"><kbd>L</kbd> 仏光陣</p>
        </div>
        <div class="objective"><span>魂を鎮めよ</span><strong><b id="kills-value">0</b><i> / ${CLEAR_KILLS}</i></strong><small>撃破</small></div>
        <div id="combo-panel" class="combo-panel"><strong id="combo-value">0</strong><span>COMBO</span><div class="combo-track"><div id="combo-fill"></div></div></div>
        <button id="pause-button" class="pause-button" type="button" aria-label="一時停止">Ⅱ <span>Esc</span></button>
        <div class="battle-footer"><div class="controls">${controls}</div><span id="time-value">00:00</span></div>
        <div id="hurt-overlay" class="hurt-overlay" aria-hidden="true"></div>
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
    bind('resume-button', actions.resume);
    bind('pause-title-button', actions.title);
    bind('result-title-button', actions.title);
  }

  toggleDebug(): void {
    this.debugVisible = !this.debugVisible;
    this.el('debug-panel').hidden = !this.debugVisible;
  }

  update(session: GameSession, stats: PerformanceStats): void {
    const { player, state } = session;
    if (this.lastState !== state) {
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
      this.el('combo-value').animate([{ transform: 'scale(1.16)' }, { transform: 'scale(1)' }], { duration: 160 });
      this.oldCombo = session.combo;
    }
    this.el('hurt-overlay').classList.toggle('visible', player.hurt && state === 'playing');
    this.text('time-value', clock(session.elapsed));
    if (state === 'result') {
      const clear = session.result === 'clear';
      this.text('result-eyebrow', clear ? 'ALL SOULS RELEASED' : 'BATTLE ENDED');
      this.text('result-title', clear ? '成仏完了' : '力尽きた……');
      this.text('result-description', clear ? '百の魂に、安らぎを。' : '回避で間合いを取り、強攻撃で群れを崩そう。');
      this.text('result-kills', String(session.kills));
      this.text('result-combo', String(session.maxCombo));
      this.text('result-time', clock(session.elapsed));
    }
    if (this.debugVisible) {
      const enemies = session.enemies.filter((enemy) => enemy.state !== 'inactive' && enemy.state !== 'dead').length;
      this.text('debug-panel', `F3 · DEBUG\nFPS           ${stats.fps}\nActive Enemies ${enemies}\nKills         ${session.kills}\nDraw Calls    ${stats.drawCalls}\nTriangles     ${stats.triangles}\nGeometries    ${stats.geometries}`);
    }
  }

  dispose(): void { this.abort.abort(); this.root.replaceChildren(); }
  private el(id: string): HTMLElement { return this.elements.get(id)!; }
  private text(id: string, value: string): void {
    const element = this.el(id);
    if (element.textContent !== value) element.textContent = value;
  }
}
