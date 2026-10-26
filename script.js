/**
 * ============================================================================
 * CODE ALPHA — FUTURISTIC HOLOGRAPHIC CALCULATION SYSTEM (2077 EDITION)
 * Core Architecture:
 * 1. Safe Math Engine (Shunting-Yard / Token Evaluator - No unrestricted eval)
 * 2. Real-Time Live Preview & Chained Operation Engine
 * 3. 3D Tilt Physics & Ambient Hologram Engine
 * 4. Interactive Cyber Particle Canvas
 * 5. Web Audio Synthesized Sound Generator
 * 6. Telemetry Chrono-History & Persistence
 * ============================================================================
 */

(() => {
  'use strict';

  /* --------------------------------------------------------------------------
     DOM Element References
     -------------------------------------------------------------------------- */
  const el = {
    calcCard: document.getElementById('calc-card'),
    calcStage: document.getElementById('calc-stage'),
    displayMain: document.getElementById('display-main'),
    displayExpression: document.getElementById('display-expression'),
    displayPreview: document.getElementById('display-preview'),
    previewEqual: document.getElementById('preview-equal'),
    previewWrap: document.querySelector('.display-preview-wrap'),
    calcStateTag: document.getElementById('calc-state-tag'),
    keypad: document.getElementById('calc-keypad'),
    cyberCanvas: document.getElementById('cyber-canvas'),
    
    // Controls & Modals
    btnSoundToggle: document.getElementById('btn-sound-toggle'),
    iconSoundOff: document.querySelector('.icon-sound-off'),
    iconSoundOn: document.querySelector('.icon-sound-on'),
    btnThemeToggle: document.getElementById('btn-theme-toggle'),
    themeModal: document.getElementById('theme-modal'),
    btnCloseTheme: document.getElementById('btn-close-theme'),
    btnHistoryToggle: document.getElementById('btn-history-toggle'),
    historyDrawer: document.getElementById('history-drawer'),
    btnCloseHistory: document.getElementById('btn-close-history'),
    btnClearHistory: document.getElementById('btn-clear-history'),
    historyList: document.getElementById('history-list'),
    btnCopyResult: document.getElementById('btn-copy-result'),
    cyberToast: document.getElementById('cyber-toast'),
    toastText: document.getElementById('toast-text')
  };

  /* --------------------------------------------------------------------------
     State Management
     -------------------------------------------------------------------------- */
  const state = {
    currentInput: '0',        // Main entry line
    expression: '',           // Pending arithmetic expression
    lastOperator: null,       // Track active operator
    justEvaluated: false,     // True after pressing '='
    lastOperation: null,      // For repeated '=' calculations { op, operand }
    memory: 0,                // Sci memory register
    isMuted: true,            // Synthesizer mute state (default safe)
    history: [],              // Calculation chronologs
    activeTheme: 'cyan'
  };

  /* --------------------------------------------------------------------------
     1. Web Audio Synthesizer (Zero External Dependencies)
     -------------------------------------------------------------------------- */
  class CyberAudioSynthesizer {
    constructor() {
      this.ctx = null;
    }

    init() {
      if (!this.ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          this.ctx = new AudioContext();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    playClick(freq = 700, duration = 0.04) {
      if (state.isMuted) return;
      this.init();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.5, this.ctx.currentTime + duration);

      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    }

    playOperator() {
      if (state.isMuted) return;
      this.playClick(950, 0.06);
    }

    playEquals() {
      if (state.isMuted) return;
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      // High-tech sci-fi double harmonic chime
      [523.25, 1046.5].forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.04);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + i * 0.04 + 0.16);

        gain.gain.setValueAtTime(0.15, now + i * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.04 + 0.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + i * 0.04);
        osc.stop(now + i * 0.04 + 0.2);
      });
    }

    playError() {
      if (state.isMuted) return;
      this.init();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(90, this.ctx.currentTime + 0.25);

      gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    }
  }

  const audio = new CyberAudioSynthesizer();

  /* --------------------------------------------------------------------------
     2. Safe Mathematical Evaluator (Shunting-Yard & Precision Guard)
     -------------------------------------------------------------------------- */
  const MathEngine = {
    // Normalizes IEEE-754 precision quirks (e.g. 0.1 + 0.2 = 0.30000000000000004)
    formatResult(num) {
      if (!isFinite(num)) {
        return 'ERR: SINGULARITY';
      }
      if (isNaN(num)) {
        return 'ERR: INVALID';
      }

      // Check magnitude for exponential threshold
      const absVal = Math.abs(num);
      if (absVal !== 0 && (absVal >= 1e14 || absVal < 1e-7)) {
        return num.toExponential(6).replace('e+', 'e');
      }

      // High-precision rounding to 10 decimal digits
      const cleaned = Math.round((num + Number.EPSILON) * 1e10) / 1e10;
      return cleaned.toString();
    },

    tokenize(exprStr) {
      // Tokenize numbers, decimals, and operators
      const tokens = [];
      let i = 0;
      const s = exprStr.replace(/\s+/g, '');

      while (i < s.length) {
        const c = s[i];

        // Check for unary minus: at start or right after an operator
        if (c === '-' && (tokens.length === 0 || ['+', '-', '*', '/'].includes(tokens[tokens.length - 1]))) {
          let numStr = '-';
          i++;
          while (i < s.length && (/\d|\./.test(s[i]))) {
            numStr += s[i];
            i++;
          }
          if (numStr === '-') {
            tokens.push('-');
          } else {
            tokens.push(parseFloat(numStr));
          }
          continue;
        }

        if (/\d/.test(c)) {
          let numStr = '';
          while (i < s.length && (/\d|\./.test(s[i]))) {
            numStr += s[i];
            i++;
          }
          tokens.push(parseFloat(numStr));
          continue;
        }

        if (['+', '-', '*', '/'].includes(c)) {
          tokens.push(c);
          i++;
          continue;
        }

        i++;
      }
      return tokens;
    },

    // Infix to RPN (Reverse Polish Notation) via Dijkstra's Shunting-Yard
    shuntingYard(tokens) {
      const outputQueue = [];
      const opStack = [];
      const precedence = { '+': 1, '-': 1, '*': 2, '/': 2 };

      for (let token of tokens) {
        if (typeof token === 'number') {
          outputQueue.push(token);
        } else if (['+', '-', '*', '/'].includes(token)) {
          while (
            opStack.length > 0 &&
            precedence[opStack[opStack.length - 1]] >= precedence[token]
          ) {
            outputQueue.push(opStack.pop());
          }
          opStack.push(token);
        }
      }

      while (opStack.length > 0) {
        outputQueue.push(opStack.pop());
      }

      return outputQueue;
    },

    // Evaluates RPN safely
    evaluateRPN(rpn) {
      const stack = [];
      for (let token of rpn) {
        if (typeof token === 'number') {
          stack.push(token);
        } else {
          if (stack.length < 2) return null;
          const b = stack.pop();
          const a = stack.pop();
          let res;
          switch (token) {
            case '+': res = a + b; break;
            case '-': res = a - b; break;
            case '*': res = a * b; break;
            case '/':
              if (b === 0) return Infinity; // Zero division
              res = a / b;
              break;
            default: return null;
          }
          stack.push(res);
        }
      }
      return stack.length === 1 ? stack[0] : null;
    },

    // Safe master evaluation
    evaluate(expressionString) {
      try {
        const tokens = this.tokenize(expressionString);
        if (tokens.length === 0) return null;
        // Verify valid operator placement
        const lastToken = tokens[tokens.length - 1];
        if (['+', '-', '*', '/'].includes(lastToken)) {
          return null;
        }
        const rpn = this.shuntingYard(tokens);
        const rawRes = this.evaluateRPN(rpn);
        if (rawRes === null) return null;
        return rawRes;
      } catch (err) {
        return null;
      }
    }
  };

  /* --------------------------------------------------------------------------
     3. Calculator UI & Interaction Controller
     -------------------------------------------------------------------------- */
  function updateDisplay() {
    // Format Display Main
    if (state.currentInput.startsWith('ERR')) {
      el.displayMain.textContent = state.currentInput;
      el.displayMain.classList.add('error-state');
    } else {
      el.displayMain.classList.remove('error-state');
      // Format with localized grouping if reasonable length
      const parts = state.currentInput.split('.');
      if (parts[0].length <= 14 && !isNaN(parts[0])) {
        const formattedInt = Number(parts[0]).toLocaleString('en-US');
        el.displayMain.textContent = parts.length > 1 ? `${formattedInt}.${parts[1]}` : formattedInt;
      } else {
        el.displayMain.textContent = state.currentInput;
      }
    }

    // Auto-adjust font size for large numbers
    const len = el.displayMain.textContent.length;
    if (len > 14) {
      el.displayMain.style.fontSize = '1.5rem';
    } else if (len > 9) {
      el.displayMain.style.fontSize = '2.0rem';
    } else {
      el.displayMain.style.fontSize = '2.6rem';
    }

    // Update Expression Display
    const displayExpr = state.expression
      .replace(/\*/g, ' × ')
      .replace(/\//g, ' ÷ ')
      .replace(/\+/g, ' + ')
      .replace(/-/g, ' − ');
    el.displayExpression.textContent = displayExpr;

    // Update System Status Tag
    if (state.currentInput.startsWith('ERR')) {
      el.calcStateTag.textContent = 'FAULT';
      el.calcStateTag.style.color = 'var(--danger-magenta)';
    } else if (state.expression) {
      el.calcStateTag.textContent = 'BUSY';
      el.calcStateTag.style.color = 'var(--accent-purple)';
    } else {
      el.calcStateTag.textContent = 'READY';
      el.calcStateTag.style.color = 'var(--primary-neon)';
    }

    // Trigger Intelligent Live Preview
    calculateLivePreview();
  }

  function calculateLivePreview() {
    if (!state.expression) {
      el.displayPreview.textContent = '';
      el.previewWrap.classList.remove('active');
      return;
    }

    // Assemble proposed full expression
    let fullExpr = `${state.expression} ${state.currentInput}`.trim();
    const result = MathEngine.evaluate(fullExpr);

    if (result !== null && isFinite(result)) {
      const formatted = MathEngine.formatResult(result);
      if (formatted !== state.currentInput) {
        el.displayPreview.textContent = formatted;
        el.previewWrap.classList.add('active');
        return;
      }
    }

    el.displayPreview.textContent = '';
    el.previewWrap.classList.remove('active');
  }

  /* --------------------------------------------------------------------------
     Calculator Input Handlers
     -------------------------------------------------------------------------- */
  function handleNumber(num) {
    audio.playClick(600 + parseInt(num, 10) * 35);

    if (state.justEvaluated || state.currentInput.startsWith('ERR')) {
      state.currentInput = num;
      state.expression = '';
      state.justEvaluated = false;
      state.lastOperation = null;
    } else if (state.currentInput === '0') {
      state.currentInput = num;
    } else {
      if (state.currentInput.length < 18) {
        state.currentInput += num;
      }
    }
    updateDisplay();
  }

  function handleDecimal() {
    audio.playClick(800);

    if (state.justEvaluated || state.currentInput.startsWith('ERR')) {
      state.currentInput = '0.';
      state.expression = '';
      state.justEvaluated = false;
    } else if (!state.currentInput.includes('.')) {
      state.currentInput += '.';
    }
    updateDisplay();
  }

  function handleOperator(op) {
    audio.playOperator();

    if (state.currentInput.startsWith('ERR')) {
      handleClear();
      return;
    }

    if (state.justEvaluated) {
      state.expression = `${state.currentInput} ${op}`;
      state.currentInput = '0';
      state.justEvaluated = false;
      state.lastOperation = null;
    } else if (state.expression && state.currentInput === '0' && state.lastOperator) {
      // Consecutive operator change (replace last operator)
      state.expression = state.expression.replace(/[\+\-\*\/]$/, op);
    } else {
      // Evaluate intermediate chain if already has expression
      if (state.expression) {
        const full = `${state.expression} ${state.currentInput}`;
        const intermediate = MathEngine.evaluate(full);
        if (intermediate !== null) {
          if (!isFinite(intermediate)) {
            state.currentInput = 'ERR: DIV BY ZERO';
            state.expression = '';
            audio.playError();
            updateDisplay();
            return;
          }
          const formatted = MathEngine.formatResult(intermediate);
          state.expression = `${formatted} ${op}`;
          state.currentInput = '0';
        } else {
          state.expression = `${state.currentInput} ${op}`;
          state.currentInput = '0';
        }
      } else {
        state.expression = `${state.currentInput} ${op}`;
        state.currentInput = '0';
      }
    }

    state.lastOperator = op;
    highlightOperator(op);
    updateDisplay();
  }

  function highlightOperator(op) {
    document.querySelectorAll('.key-operator').forEach(btn => {
      if (btn.getAttribute('data-val') === op) {
        btn.classList.add('active-op');
      } else {
        btn.classList.remove('active-op');
      }
    });
  }

  function clearActiveOperator() {
    document.querySelectorAll('.key-operator').forEach(btn => {
      btn.classList.remove('active-op');
    });
  }

  function handleCalculate() {
    clearActiveOperator();

    if (state.currentInput.startsWith('ERR')) {
      handleClear();
      return;
    }

    // Repeated equals handling
    if (state.justEvaluated && state.lastOperation) {
      const full = `${state.currentInput} ${state.lastOperation.op} ${state.lastOperation.val}`;
      const result = MathEngine.evaluate(full);
      if (result !== null) {
        processCalculationResult(full, result);
      }
      return;
    }

    if (!state.expression) {
      // No expression pending, pulse card
      triggerHoloFlash();
      audio.playEquals();
      return;
    }

    const fullExpr = `${state.expression} ${state.currentInput}`;
    const result = MathEngine.evaluate(fullExpr);

    if (result === null || !isFinite(result)) {
      audio.playError();
      state.currentInput = 'ERR: DIV BY ZERO';
      state.expression = '';
      updateDisplay();
      return;
    }

    // Save for repeated equals
    const tokens = MathEngine.tokenize(fullExpr);
    if (tokens.length >= 3) {
      state.lastOperation = {
        op: tokens[tokens.length - 2],
        val: tokens[tokens.length - 1]
      };
    }

    processCalculationResult(fullExpr, result);
  }

  function processCalculationResult(fullExpr, result) {
    audio.playEquals();
    triggerHoloFlash();

    const formattedResult = MathEngine.formatResult(result);
    
    // Log to Chrono History
    addHistoryRecord(fullExpr, formattedResult);

    state.currentInput = formattedResult;
    state.expression = '';
    state.justEvaluated = true;
    updateDisplay();
  }

  function handleClear() {
    audio.playClick(400);
    state.currentInput = '0';
    state.expression = '';
    state.lastOperator = null;
    state.justEvaluated = false;
    state.lastOperation = null;
    clearActiveOperator();
    updateDisplay();
  }

  function handleDelete() {
    audio.playClick(450);
    if (state.justEvaluated || state.currentInput.startsWith('ERR')) {
      handleClear();
      return;
    }

    if (state.currentInput.length > 1) {
      state.currentInput = state.currentInput.slice(0, -1);
      // Clean trailing minus
      if (state.currentInput === '-') {
        state.currentInput = '0';
      }
    } else {
      state.currentInput = '0';
    }
    updateDisplay();
  }

  function handleNegate() {
    audio.playClick(750);
    if (state.currentInput.startsWith('ERR') || state.currentInput === '0') return;

    if (state.currentInput.startsWith('-')) {
      state.currentInput = state.currentInput.slice(1);
    } else {
      state.currentInput = `-${state.currentInput}`;
    }
    updateDisplay();
  }

  function handlePercent() {
    audio.playClick(850);
    if (state.currentInput.startsWith('ERR')) return;

    const val = parseFloat(state.currentInput);
    if (!isNaN(val)) {
      // If there's an ongoing addition/subtraction, percent is percentage of the first operand
      if (state.expression && (state.expression.endsWith('+') || state.expression.endsWith('-'))) {
        const firstNum = parseFloat(state.expression);
        if (!isNaN(firstNum)) {
          state.currentInput = MathEngine.formatResult((firstNum * val) / 100);
          updateDisplay();
          return;
        }
      }
      state.currentInput = MathEngine.formatResult(val / 100);
      updateDisplay();
    }
  }

  /* --------------------------------------------------------------------------
     4. Scientific Quick Actions (√, x², 1/x, π, Memory)
     -------------------------------------------------------------------------- */
  function handleSciAction(action) {
    if (state.currentInput.startsWith('ERR')) return;
    const currentVal = parseFloat(state.currentInput);
    audio.playClick(920);

    switch (action) {
      case 'sqrt':
        if (currentVal < 0) {
          state.currentInput = 'ERR: NEG SQRT';
          audio.playError();
        } else {
          state.currentInput = MathEngine.formatResult(Math.sqrt(currentVal));
        }
        break;

      case 'sq':
        state.currentInput = MathEngine.formatResult(currentVal * currentVal);
        break;

      case 'reciprocal':
        if (currentVal === 0) {
          state.currentInput = 'ERR: DIV BY ZERO';
          audio.playError();
        } else {
          state.currentInput = MathEngine.formatResult(1 / currentVal);
        }
        break;

      case 'pi':
        state.currentInput = MathEngine.formatResult(Math.PI);
        break;

      case 'mplus':
        state.memory += isNaN(currentVal) ? 0 : currentVal;
        showToast(`MEMORY SYNCED: ${state.memory}`);
        break;

      case 'mr':
        state.currentInput = MathEngine.formatResult(state.memory);
        showToast(`MEMORY RECALLED: ${state.memory}`);
        break;

      case 'mc':
        state.memory = 0;
        showToast('MEMORY PURGED (0)');
        break;
    }
    updateDisplay();
  }

  /* --------------------------------------------------------------------------
     5. 3D Tilt Physics Engine & Holographic Flash
     -------------------------------------------------------------------------- */
  let targetRotateX = 0;
  let targetRotateY = 0;
  let currentRotateX = 0;
  let currentRotateY = 0;
  let isMouseActive = false;

  function init3DTilt() {
    const stage = el.calcStage;

    window.addEventListener('mousemove', (e) => {
      isMouseActive = true;
      const { innerWidth, innerHeight } = window;
      const x = (e.clientX / innerWidth - 0.5) * 2; // -1 to 1
      const y = (e.clientY / innerHeight - 0.5) * 2; // -1 to 1

      // Controlled tilt angles
      targetRotateY = x * 14;  // Max 14deg horizontal tilt
      targetRotateX = -y * 14; // Max 14deg vertical tilt
    });

    window.addEventListener('mouseleave', () => {
      targetRotateX = 0;
      targetRotateY = 0;
    });

    // Device orientation for mobile gyroscopes
    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', (e) => {
        if (e.gamma !== null && e.beta !== null) {
          targetRotateY = Math.min(Math.max(e.gamma * 0.4, -15), 15);
          targetRotateX = Math.min(Math.max((e.beta - 45) * 0.4, -15), 15);
        }
      });
    }

    // Smooth Lerp Animation Loop
    function renderTilt() {
      // Smooth interpolation (lerp factor 0.08)
      currentRotateX += (targetRotateX - currentRotateX) * 0.08;
      currentRotateY += (targetRotateY - currentRotateY) * 0.08;

      if (el.calcCard) {
        el.calcCard.style.setProperty('--calc-rotate-x', `${currentRotateX.toFixed(2)}deg`);
        el.calcCard.style.setProperty('--calc-rotate-y', `${currentRotateY.toFixed(2)}deg`);
      }

      requestAnimationFrame(renderTilt);
    }
    renderTilt();
  }

  function triggerHoloFlash() {
    if (!el.calcCard) return;
    el.calcCard.classList.remove('holo-flash');
    void el.calcCard.offsetWidth; // Trigger reflow
    el.calcCard.classList.add('holo-flash');
  }

  /* --------------------------------------------------------------------------
     6. Background Cyber Particle Canvas
     -------------------------------------------------------------------------- */
  function initCyberParticles() {
    const canvas = el.cyberCanvas;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width, height;
    let particles = [];
    const particleCount = 45;

    function resize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    class Particle {
      constructor() {
        this.reset();
      }

      reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.45;
        this.vy = (Math.random() - 0.5) * 0.45;
        this.radius = Math.random() * 1.8 + 0.6;
        this.alpha = Math.random() * 0.5 + 0.2;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 240, 255, ${this.alpha})`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#00f0ff';
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    function animate() {
      ctx.clearRect(0, 0, width, height);

      // Connect close particles with subtle holographic laser threads
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 110) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(0, 240, 255, ${(1 - dist / 110) * 0.15})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      particles.forEach(p => {
        p.update();
        p.draw();
      });

      requestAnimationFrame(animate);
    }
    animate();
  }

  /* --------------------------------------------------------------------------
     7. Keyboard Interaction Engine
     -------------------------------------------------------------------------- */
  function initKeyboard() {
    window.addEventListener('keydown', (e) => {
      // Avoid intercepting if focus is on an input or textarea
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

      const key = e.key;

      // Number keys 0-9
      if (/^[0-9]$/.test(key)) {
        e.preventDefault();
        triggerButtonVisual(key);
        handleNumber(key);
        return;
      }

      // Operators (+, -, *, /)
      if (['+', '-', '*', '/'].includes(key)) {
        e.preventDefault();
        triggerButtonVisual(key);
        handleOperator(key);
        return;
      }

      // Calculate (Enter or '=')
      if (key === 'Enter' || key === '=') {
        e.preventDefault();
        triggerButtonVisual('Enter');
        handleCalculate();
        return;
      }

      // Delete (Backspace)
      if (key === 'Backspace') {
        e.preventDefault();
        triggerButtonVisual('Backspace');
        handleDelete();
        return;
      }

      // Clear (Escape or Delete key)
      if (key === 'Escape' || key === 'Delete') {
        e.preventDefault();
        triggerButtonVisual('Escape');
        handleClear();
        return;
      }

      // Decimal point (.)
      if (key === '.' || key === ',') {
        e.preventDefault();
        triggerButtonVisual('.');
        handleDecimal();
        return;
      }

      // Percent (%)
      if (key === '%') {
        e.preventDefault();
        triggerButtonVisual('%');
        handlePercent();
        return;
      }
    });
  }

  function triggerButtonVisual(keyVal) {
    const btn = document.querySelector(`[data-key="${keyVal}"]`);
    if (btn) {
      btn.classList.add('key-pressed');
      setTimeout(() => btn.classList.remove('key-pressed'), 140);
    }
  }

  /* --------------------------------------------------------------------------
     8. Chrono History & Persistence
     -------------------------------------------------------------------------- */
  function addHistoryRecord(expr, res) {
    const record = {
      id: Date.now(),
      expr: expr.replace(/\*/g, '×').replace(/\//g, '÷'),
      res: res,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };

    state.history.unshift(record);
    if (state.history.length > 50) state.history.pop();

    saveHistoryToStorage();
    renderHistory();
  }

  function renderHistory() {
    if (!el.historyList) return;

    if (state.history.length === 0) {
      el.historyList.innerHTML = `
        <div class="history-empty">
          <div class="empty-icon">⏣</div>
          <p>NO TELEMETRY LOGGED</p>
          <span class="empty-hint">Perform operations to register chronological records</span>
        </div>
      `;
      return;
    }

    el.historyList.innerHTML = state.history.map(item => `
      <div class="history-item" data-res="${item.res}" role="button" tabindex="0" title="Click to recall result">
        <span class="history-timestamp">[${item.timestamp}]</span>
        <div class="history-expr">${item.expr} =</div>
        <div class="history-res">${item.res}</div>
      </div>
    `).join('');

    // Attach click events to recall result
    el.historyList.querySelectorAll('.history-item').forEach(item => {
      item.addEventListener('click', () => {
        const recalled = item.getAttribute('data-res');
        if (recalled) {
          state.currentInput = recalled;
          state.justEvaluated = true;
          state.expression = '';
          updateDisplay();
          showToast(`RECALLED VALUE: ${recalled}`);
          audio.playClick(800);
        }
      });
    });
  }

  function saveHistoryToStorage() {
    try {
      localStorage.setItem('codealpha_history', JSON.stringify(state.history));
    } catch (e) {}
  }

  function loadHistoryFromStorage() {
    try {
      const stored = localStorage.getItem('codealpha_history');
      if (stored) {
        state.history = JSON.parse(stored);
        renderHistory();
      }
    } catch (e) {}
  }

  function clearHistory() {
    audio.playClick(400);
    state.history = [];
    saveHistoryToStorage();
    renderHistory();
    showToast('CHRONO LOGS PURGED');
  }

  /* --------------------------------------------------------------------------
     9. UI Events & Controls (Theme, Copy, Sound, Drawers)
     -------------------------------------------------------------------------- */
  function showToast(message) {
    if (!el.cyberToast || !el.toastText) return;
    el.toastText.textContent = message;
    el.cyberToast.classList.add('show');
    clearTimeout(el.cyberToast._timeout);
    el.cyberToast._timeout = setTimeout(() => {
      el.cyberToast.classList.remove('show');
    }, 2400);
  }

  function copyCurrentResult() {
    const textToCopy = state.currentInput;
    if (!textToCopy || textToCopy.startsWith('ERR')) return;

    audio.playClick(900);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        showToast(`COPIED // ${textToCopy}`);
      }).catch(() => {
        fallbackCopy(textToCopy);
      });
    } else {
      fallbackCopy(textToCopy);
    }
  }

  function fallbackCopy(text) {
    const input = document.createElement('input');
    input.value = text;
    document.body.appendChild(input);
    input.select();
    try {
      document.execCommand('copy');
      showToast(`COPIED // ${text}`);
    } catch (e) {
      showToast('COPY FAILED');
    }
    document.body.removeChild(input);
  }

  function toggleSound() {
    state.isMuted = !state.isMuted;
    localStorage.setItem('codealpha_muted', state.isMuted);

    if (state.isMuted) {
      el.iconSoundOff.classList.remove('hidden');
      el.iconSoundOn.classList.add('hidden');
      el.btnSoundToggle.title = 'Audio Synthesizer (Muted)';
      showToast('AUDIO SYNTHESIZER: MUTED');
    } else {
      el.iconSoundOff.classList.add('hidden');
      el.iconSoundOn.classList.remove('hidden');
      el.btnSoundToggle.title = 'Audio Synthesizer (Online)';
      audio.init();
      audio.playClick(880, 0.08);
      showToast('AUDIO SYNTHESIZER: ONLINE');
    }
  }

  function setTheme(theme) {
    state.activeTheme = theme;
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('codealpha_theme', theme);

    document.querySelectorAll('.palette-chip').forEach(chip => {
      if (chip.getAttribute('data-set-theme') === theme) {
        chip.classList.add('active');
      } else {
        chip.classList.remove('active');
      }
    });

    showToast(`SPECTRUM SET: ${theme.toUpperCase()}`);
    audio.playClick(1000);
  }

  function initUIEventListeners() {
    // Keypad Click Delegation
    el.keypad.addEventListener('click', (e) => {
      const btn = e.target.closest('.key-btn');
      if (!btn) return;

      const num = btn.getAttribute('data-num');
      const action = btn.getAttribute('data-action');
      const op = btn.getAttribute('data-val');

      if (num !== null) {
        handleNumber(num);
      } else if (action === 'operator' && op) {
        handleOperator(op);
      } else if (action === 'calculate') {
        handleCalculate();
      } else if (action === 'clear') {
        handleClear();
      } else if (action === 'delete') {
        handleDelete();
      } else if (action === 'decimal') {
        handleDecimal();
      } else if (action === 'negate') {
        handleNegate();
      } else if (action === 'percent') {
        handlePercent();
      }
    });

    // Scientific Quick Bar Delegation
    document.querySelectorAll('.sci-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.getAttribute('data-action');
        if (action) handleSciAction(action);
      });
    });

    // Copy Result Button
    el.btnCopyResult.addEventListener('click', copyCurrentResult);

    // Sound Toggle Button
    el.btnSoundToggle.addEventListener('click', toggleSound);

    // Theme Modal Toggle
    el.btnThemeToggle.addEventListener('click', () => {
      el.themeModal.classList.toggle('open');
      audio.playClick(750);
    });

    el.btnCloseTheme.addEventListener('click', () => {
      el.themeModal.classList.remove('open');
    });

    document.querySelectorAll('.palette-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const theme = chip.getAttribute('data-set-theme');
        if (theme) setTheme(theme);
        el.themeModal.classList.remove('open');
      });
    });

    // History Drawer Toggle
    el.btnHistoryToggle.addEventListener('click', () => {
      el.historyDrawer.classList.toggle('open');
      audio.playClick(750);
    });

    el.btnCloseHistory.addEventListener('click', () => {
      el.historyDrawer.classList.remove('open');
    });

    el.btnClearHistory.addEventListener('click', clearHistory);

    // Close drawers on outside click
    document.addEventListener('click', (e) => {
      if (!el.themeModal.contains(e.target) && !el.btnThemeToggle.contains(e.target)) {
        el.themeModal.classList.remove('open');
      }
      if (!el.historyDrawer.contains(e.target) && !el.btnHistoryToggle.contains(e.target)) {
        el.historyDrawer.classList.remove('open');
      }
    });
  }

  /* --------------------------------------------------------------------------
     Initialization
     -------------------------------------------------------------------------- */
  function init() {
    // Load saved preferences
    const savedTheme = localStorage.getItem('codealpha_theme');
    if (savedTheme) {
      setTheme(savedTheme);
    }

    const savedMuted = localStorage.getItem('codealpha_muted');
    if (savedMuted === 'false') {
      state.isMuted = false;
      el.iconSoundOff.classList.add('hidden');
      el.iconSoundOn.classList.remove('hidden');
      el.btnSoundToggle.title = 'Audio Synthesizer (Online)';
    }

    loadHistoryFromStorage();
    init3DTilt();
    initCyberParticles();
    initKeyboard();
    initUIEventListeners();
    updateDisplay();

    // Visual greeting on console for creative hackers
    console.log(
      '%c [CODE ALPHA] %c HOLOGRAPHIC SYSTEM ONLINE %c KERNEL v9.8.4 INITIALIZED ',
      'background: #00f0ff; color: #000; font-weight: bold; border-radius: 4px;',
      'background: #9d4edd; color: #fff; font-weight: bold; border-radius: 4px;',
      'background: #060b18; color: #00f0ff; border: 1px solid #00f0ff;'
    );
  }

  // Launch when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
