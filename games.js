// ==UserScript==
// @name         i-Ready Pro Utils - Games
// @namespace    http://tampermonkey.net/
// @version      2.2
// @description  Re-add i-Ready Games to i-ready pro (NEW UPDATE, ANTICHEAT ADDED!)
// @author       THEMPGUYAlt
// @match        https://login.i-ready.com/mspro/dashboard/home
// @match        https://login.i-ready.com/*
// @match        https://www.i-ready.com/*
// @icon         https://www.google.com/s2/favicons?domain=i-ready.com
// @grant        GM_addStyle
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    if (window._ireadyCoinSystemLoaded) return;
    window._ireadyCoinSystemLoaded = true;

    // Advanced anti-cheat system (focus on data integrity, not UI)
    const ANTI_CHEAT = {
        SECRET_KEY: 'i-ready-secure-key-2024-' + Math.random().toString(36),
        sessionId: null,
        startTime: Date.now(),
        integrityChecks: [],
        isActive: false,
        
        init() {
            this.sessionId = this.generateSessionId();
            this.startTime = Date.now();
            this.setupIntegrityChecks();
        },
        
        generateSessionId() {
            return Array.from(crypto.getRandomValues(new Uint8Array(32)))
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');
        },
        
        setupIntegrityChecks() {
            // Periodic memory signature checks (data tampering only)
            setInterval(() => {
                if (!this.isActive) this.performIntegrityCheck();
            }, 5000);
        },
        
        performIntegrityCheck() {
            const check = {
                timestamp: Date.now(),
                memorySignature: this.generateMemorySignature(),
                eventLog: this.checkEventLog()
            };
            this.integrityChecks.push(check);
            if (this.integrityChecks.length > 100) this.integrityChecks.shift();
            return this.signData(check);
        },
        
        generateMemorySignature() {
            const memory = [
                window._ireadyCoinSystem?.coins || 0,
                window._ireadyCoinSystem?.history?.length || 0,
                this.sessionId,
                this.startTime
            ].join('|');
            return this.hash(memory);
        },
        
        checkEventLog() {
            return this.hash(JSON.stringify(this.integrityChecks.slice(-5)));
        },
        
        hash(str) {
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                const char = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash;
            }
            return hash.toString(36);
        },
        
        signData(data) {
            const stringified = JSON.stringify(data) + this.SECRET_KEY + this.sessionId;
            return this.hash(stringified);
        },
        
        verifySignature(data, signature) {
            const expected = this.signData(data);
            return expected === signature;
        },
        
        validateTransaction(amount, reason, timestamp) {
            if (amount > 100) return false;      // can't earn more than 100 at once
            if (amount < -100) return false;     // can't spend more than 100 at once
            if (timestamp < this.startTime) return false; // can't be before session
            if (timestamp > Date.now() + 1000) return false; // can't be future
            return true;
        },
        
        triggerAntiCheat(reason) {
            if (this.isActive) return;
            this.isActive = true;
            
            console.error('🚨 ANTI-CHEAT TRIGGERED:', reason);
            
            if (window._ireadyCoinSystem) {
                window._ireadyCoinSystem.coins = 0;
                window._ireadyCoinSystem.history = [];
                window._ireadyCoinSystem.saveCoins();
                window._ireadyCoinSystem.saveHistory();
            }
            
            // Dramatic full‑page red overlay
            const overlay = document.createElement('div');
            overlay.id = 'iready-anticheat-overlay';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(255, 0, 0, 0.95);
                z-index: 9999999;
                display: flex;
                align-items: center;
                justify-content: center;
                animation: anticheatPulse 0.5s ease-in-out infinite alternate;
                pointer-events: all;
                cursor: not-allowed;
            `;
            
            const style = document.createElement('style');
            style.textContent = `
                @keyframes anticheatPulse {
                    0% { background: rgba(255, 0, 0, 0.95); transform: scale(1); }
                    100% { background: rgba(200, 0, 0, 0.98); transform: scale(1.02); }
                }
                @keyframes textPulse {
                    0% { transform: scale(1); text-shadow: 0 0 30px rgba(255,255,255,0.8); }
                    100% { transform: scale(1.2); text-shadow: 0 0 60px rgba(255,255,255,1); }
                }
                @keyframes glitch {
                    0% { transform: translate(0); }
                    20% { transform: translate(-5px, 5px); }
                    40% { transform: translate(-5px, -5px); }
                    60% { transform: translate(5px, 5px); }
                    80% { transform: translate(5px, -5px); }
                    100% { transform: translate(0); }
                }
            `;
            document.head.appendChild(style);
            
            const textContainer = document.createElement('div');
            textContainer.style.cssText = `
                text-align: center;
                font-family: 'Sofia Pro Condensed', 'Arial Black', sans-serif;
                font-weight: 900;
                animation: textPulse 0.3s ease-in-out infinite alternate;
            `;
            
            const mainText = document.createElement('div');
            mainText.style.cssText = `
                color: white;
                font-size: 72px;
                margin-bottom: 30px;
                letter-spacing: 5px;
                text-transform: uppercase;
                animation: glitch 0.3s ease-in-out infinite;
            `;
            mainText.textContent = '⚠️ CHEATING DETECTED ⚠️';
            
            const subText = document.createElement('div');
            subText.style.cssText = `
                color: white;
                font-size: 36px;
                opacity: 0.9;
                letter-spacing: 2px;
            `;
            subText.textContent = 'RELOAD THE PAGE TO REMOVE THIS!';
            
            const reasonText = document.createElement('div');
            reasonText.style.cssText = `
                color: rgba(255,255,255,0.7);
                font-size: 24px;
                margin-top: 30px;
                font-family: monospace;
                border-top: 2px solid rgba(255,255,255,0.3);
                padding-top: 20px;
            `;
            reasonText.textContent = `Reason: ${reason}`;
            
            textContainer.appendChild(mainText);
            textContainer.appendChild(subText);
            textContainer.appendChild(reasonText);
            overlay.appendChild(textContainer);
            
            overlay.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                return false;
            });
            
            overlay.addEventListener('mousedown', (e) => {
                e.preventDefault();
                e.stopPropagation();
                return false;
            });
            
            overlay.addEventListener('keydown', (e) => {
                e.preventDefault();
                e.stopPropagation();
                return false;
            });
            
            document.body.appendChild(overlay);
            document.body.style.pointerEvents = 'none';
            overlay.style.pointerEvents = 'all';
            
            // Re‑apply if someone tries to remove it
            setInterval(() => {
                if (!document.getElementById('iready-anticheat-overlay')) {
                    document.body.appendChild(overlay.cloneNode(true));
                }
            }, 100);
        }
    };

    const CONFIG = {
        STORAGE_KEY: 'iready_coins_v3',
        HISTORY_KEY: 'iready_history_v3',
        SIGNATURE_KEY: 'iready_signature_v3',
        MIN_SCORE: 70,
        BASE_REWARD: 10,
        MAX_REWARD: 70,
        Z_INDEX: 50000,
        GAMES: [
            { name: 'Cat Stacker', url: 'https://cdn.i-ready.com/instruction/game-catstacker/1.6.x/2', cost: 50, icon: '🐱', desc: 'Stack cats to reach the top!' },
            { name: 'Dig Site', url: 'https://cdn.i-ready.com/instruction/reward-games/v1.4.x/1/game-minedigger/', cost: 75, icon: '⛏️', desc: 'Dig for treasures, avoid black holes!' },
            { name: 'Galaxy Sprint', url: 'https://cdn.i-ready.com/instruction/reward-games/v1.4.x/1/game-lanerunner/', cost: 100, icon: '🚀', desc: '3-lane runner through space!' },
            { name: 'BeGooped', url: 'https://cdn.i-ready.com/instruction/game-begooped/1.3.x/2', cost: 60, icon: '🟢', desc: 'Match-3 style puzzle game!' },
            { name: 'Wizard Pinball', url: 'https://cdn.i-ready.com/instruction/reward-games/v1.4.x/1/game-bubbles/', cost: 80, icon: '🧙', desc: 'Magical pinball adventure!' },
            { name: 'Path Spinners', url: 'https://cdn.i-ready.com/instruction/game-hpr/1.4.x/2', cost: 70, icon: '🌀', desc: 'Rotate paths to reach the goal!' }
        ]
    };

    function addGlobalStyle(css) {
        if (typeof GM_addStyle !== 'undefined') {
            GM_addStyle(css);
        } else {
            const style = document.createElement('style');
            style.textContent = css;
            document.head.appendChild(style);
        }
    }

    addGlobalStyle(`
        @keyframes coinSlideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes coinFadeOut {
            to { opacity: 0; }
        }
        @keyframes modalPop {
            from { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
            to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes modalClose {
            0% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
        }
        @keyframes backdropFade {
            to { opacity: 0; backdrop-filter: blur(0); }
        }
        .iready-notification {
            position: fixed;
            bottom: 100px;
            right: 24px;
            color: white;
            padding: 16px 32px;
            border-radius: 40px;
            font-family: 'Sofia Pro Condensed', sans-serif;
            font-size: 24px;
            font-weight: 700;
            z-index: 50030;
            animation: coinSlideIn 0.3s ease, coinFadeOut 0.3s ease 2.2s forwards;
            box-shadow: 0 10px 25px rgba(0,0,0,0.5);
            pointer-events: none;
        }
        .iready-modal-backdrop {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.9);
            backdrop-filter: blur(8px);
            z-index: 50009;
            transition: all 0.3s ease;
        }
        .iready-modal-backdrop.closing {
            animation: backdropFade 0.3s ease forwards;
        }
        .iready-modal {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 90%;
            max-width: 1100px;
            max-height: 85vh;
            background: #111;
            border: 1px solid #333;
            border-radius: 16px;
            z-index: 50010;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            animation: modalPop 0.3s ease;
            box-shadow: 0 25px 50px -12px black;
        }
        .iready-modal.closing {
            animation: modalClose 0.3s ease forwards;
        }
        .iready-game-container {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 90%;
            height: 90%;
            max-width: 1200px;
            background: #0a0a0a;
            border: 1px solid #333;
            border-radius: 12px;
            z-index: 50010;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            box-shadow: 0 25px 50px black;
            animation: modalPop 0.3s ease;
        }
        .iready-game-container.closing {
            animation: modalClose 0.3s ease forwards;
        }
    `);

    // === ROBUST CLOSE FUNCTION ===
    function closeModalWithAnimation(element) {
        if (ANTI_CHEAT.isActive) return;

        const modalContainer = element.closest('.iready-modal-container') 
            || element.closest('.iready-game-container')
            || element.closest('[class*="modal"]');

        if (!modalContainer) return;

        const backdrop = modalContainer.querySelector('.iready-modal-backdrop');
        const modal = modalContainer.querySelector('.iready-modal, .iready-game-container');

        if (backdrop) backdrop.classList.add('closing');
        if (modal) modal.classList.add('closing');

        setTimeout(() => {
            if (modalContainer.parentNode) {
                modalContainer.remove();
            }
        }, 280);
    }

    class CoinGameSystem {
        constructor() {
            ANTI_CHEAT.init();
            this.coins = this.loadCoins();
            this.history = this.loadHistory();
            this.signature = this.loadSignature();
            this.seenResponses = new Set();
            this.widget = null;
            this.isDragging = false;          // used to avoid false style checks (if any)
            if (!ANTI_CHEAT.isActive) {
                this.verifyIntegrity();
                this.init();
            }
        }

        loadCoins() {
            try {
                const stored = localStorage.getItem(CONFIG.STORAGE_KEY);
                return stored ? parseInt(stored) : 0;
            } catch {
                return 0;
            }
        }

        loadHistory() {
            try {
                return JSON.parse(localStorage.getItem(CONFIG.HISTORY_KEY)) || [];
            } catch {
                return [];
            }
        }

        loadSignature() {
            try {
                return localStorage.getItem(CONFIG.SIGNATURE_KEY) || '';
            } catch {
                return '';
            }
        }

        saveCoins() {
            if (ANTI_CHEAT.isActive) return;
            try {
                localStorage.setItem(CONFIG.STORAGE_KEY, this.coins);
                this.updateWidgetCoins();
                this.signData();
            } catch (e) {}
        }

        saveHistory() {
            if (ANTI_CHEAT.isActive) return;
            try {
                localStorage.setItem(CONFIG.HISTORY_KEY, JSON.stringify(this.history.slice(-50)));
                this.signData();
            } catch (e) {}
        }

        signData() {
            if (ANTI_CHEAT.isActive) return;
            const data = {
                coins: this.coins,
                historyLength: this.history.length,
                timestamp: Date.now()
            };
            const signature = ANTI_CHEAT.signData(data);
            try {
                localStorage.setItem(CONFIG.SIGNATURE_KEY, signature);
            } catch (e) {}
        }

        verifyIntegrity() {
            if (ANTI_CHEAT.isActive) return;
            setInterval(() => {
                if (ANTI_CHEAT.isActive) return;
                const data = {
                    coins: this.coins,
                    historyLength: this.history.length
                };
                if (this.signature && !ANTI_CHEAT.verifySignature(data, this.signature)) {
                    ANTI_CHEAT.triggerAntiCheat('Data tampering detected');
                }
            }, 10000);
        }

        calculateReward(score) {
            if (score < CONFIG.MIN_SCORE) return 0;
            const timestamp = Date.now();
            const seed = (timestamp % 1000) / 1000;
            const baseMultiplier = (score - CONFIG.MIN_SCORE) / (100 - CONFIG.MIN_SCORE);
            const baseReward = CONFIG.BASE_REWARD + (baseMultiplier * (CONFIG.MAX_REWARD - CONFIG.BASE_REWARD));
            const randomFactor = 0.8 + (seed * 0.4);
            const scoreRandom = (score % 10) / 20;
            const total = Math.floor(baseReward * randomFactor) + Math.floor(scoreRandom * 10);
            return Math.min(CONFIG.MAX_REWARD, Math.max(CONFIG.BASE_REWARD, total));
        }

        addCoins(amount, reason, score) {
            if (ANTI_CHEAT.isActive) return;
            const timestamp = Date.now();
            if (!ANTI_CHEAT.validateTransaction(amount, reason, timestamp)) {
                ANTI_CHEAT.triggerAntiCheat('Invalid transaction');
                return;
            }
            if (score) {
                const expectedAmount = this.calculateReward(score);
                if (Math.abs(amount - expectedAmount) > 2) {
                    ANTI_CHEAT.triggerAntiCheat('Reward manipulation detected');
                    return;
                }
            }
            this.coins += amount;
            this.history.push({ 
                amount, 
                reason, 
                timestamp,
                signature: ANTI_CHEAT.signData({ amount, reason, timestamp })
            });
            this.saveCoins();
            this.saveHistory();
            this.showNotification(`+${amount} COINS`, '#10b981');
            this.animateCoinGain(amount);
        }

        spendCoins(amount, gameName, gameUrl, gameIcon) {
            if (ANTI_CHEAT.isActive) return false;
            if (this.coins < amount) {
                this.showNotification(`NEED ${amount - this.coins} MORE`, '#f59e0b');
                return false;
            }
            const timestamp = Date.now();
            this.coins -= amount;
            this.history.push({ 
                amount: -amount, 
                reason: gameName, 
                timestamp,
                signature: ANTI_CHEAT.signData({ amount: -amount, reason: gameName, timestamp })
            });
            this.saveCoins();
            this.saveHistory();
            this.showNotification(`-${amount} COINS`, '#7c3aed');
            this.launchGame(gameName, gameUrl, gameIcon);
            return true;
        }

        processLessonResponse(data) {
            if (ANTI_CHEAT.isActive || !data || data.entityType !== 'StudentLesson' || data.status !== 'PASSED') return;
            const score = data.lessonScore;
            if (score >= CONFIG.MIN_SCORE) {
                const reward = this.calculateReward(score);
                this.addCoins(reward, `Lesson ${score}%`, score);
            }
        }

        // === GAME CENTER MODAL ===
        showGameCenter() {
            if (ANTI_CHEAT.isActive) return;
            
            const container = document.createElement('div');
            container.className = 'iready-modal-container';
            
            const gamesHtml = CONFIG.GAMES.map(game => {
                const canAfford = this.coins >= game.cost;
                return `
                    <div style="background: #1e1e1e; border: 1px solid ${canAfford ? '#333' : '#2a2a2a'}; border-radius: 12px; padding: 20px; opacity: ${canAfford ? 1 : 0.4}; ${canAfford ? 'cursor: pointer;' : ''} transition: all 0.2s;" 
                        ${canAfford ? 'onmouseenter="this.style.borderColor=\'#7c3aed\'; this.style.transform=\'translateY(-2px)\'; this.style.boxShadow=\'0 10px 25px -5px rgba(124,58,237,0.3)\'" onmouseleave="this.style.borderColor=\'#333\'; this.style.transform=\'translateY(0)\'; this.style.boxShadow=\'none\'"' : ''}>
                        <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 16px;">
                            <span style="font-size: 48px;">${game.icon}</span>
                            <div>
                                <h3 style="margin: 0; font-size: 24px; color: #fff; font-family: 'Sofia Pro Condensed', sans-serif; font-weight: 700;">${game.name}</h3>
                                <p style="margin: 4px 0 0; color: #aaa; font-size: 14px;">${game.desc}</p>
                            </div>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-size: 24px; color: #7c3aed;">🪙 ${game.cost}</span>
                            <button class="play-game-btn" data-game='${JSON.stringify(game).replace(/'/g, "&apos;")}' style="background: ${canAfford ? '#7c3aed' : '#2a2a2a'}; border: 1px solid ${canAfford ? '#a78bfa' : '#444'}; border-radius: 30px; color: #fff; padding: 8px 28px; font-size: 20px; font-family: 'Sofia Pro Condensed', sans-serif; font-weight: 700; cursor: ${canAfford ? 'pointer' : 'not-allowed'}; transition: all 0.2s;" ${!canAfford ? 'disabled' : ''}>PLAY</button>
                        </div>
                    </div>
                `;
            }).join('');
            
            container.innerHTML = `
                <div class="iready-modal-backdrop"></div>
                <div class="iready-modal">
                    <div style="padding: 24px 32px; background: linear-gradient(135deg, #1a1a1a, #0a0a0a); border-bottom: 1px solid #333; display: flex; justify-content: space-between; align-items: center;">
                        <h2 style="margin:0; font-size:36px; color:#fff; font-family:'Sofia Pro Condensed',sans-serif; font-weight:700; display:flex; align-items:center; gap:20px;">
                            GAME CENTER
                            <span style="background:#2a2a2a; padding:10px 24px; border-radius:40px; font-size:28px; border:1px solid #7c3aed;">🪙 ${this.coins}</span>
                        </h2>
                        <button class="close-btn" style="background:#2a2a2a; border:1px solid #444; color:#fff; width:48px; height:48px; border-radius:12px; font-size:24px; cursor:pointer;">✕</button>
                    </div>
                    <div style="padding: 24px; display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; overflow-y: auto; background: #111;">
                        ${gamesHtml}
                    </div>
                </div>
            `;
            
            document.body.appendChild(container);
            
            const backdrop = container.querySelector('.iready-modal-backdrop');
            const closeBtn = container.querySelector('.close-btn');
            
            backdrop.addEventListener('click', () => closeModalWithAnimation(backdrop));
            closeBtn.addEventListener('click', () => closeModalWithAnimation(closeBtn));
            
            container.querySelectorAll('.play-game-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const gameData = JSON.parse(btn.dataset.game.replace(/&apos;/g, "'"));
                    if (this.spendCoins(gameData.cost, gameData.name, gameData.url, gameData.icon)) {
                        container.remove(); // remove immediately after spending
                    }
                });
            });
        }

        // === HISTORY MODAL ===
        showHistory() {
            if (ANTI_CHEAT.isActive) return;
            
            const container = document.createElement('div');
            container.className = 'iready-modal-container';
            
            const historyList = this.history.slice().reverse().map(h => {
                const date = new Date(h.timestamp).toLocaleTimeString();
                const color = h.amount > 0 ? '#10b981' : '#ef4444';
                const sign = h.amount > 0 ? '+' : '';
                return `
                    <div style="padding: 12px; border-bottom: 1px solid #333; display: flex; justify-content: space-between;">
                        <div>
                            <span style="font-weight: bold; color: ${color};">${sign}${h.amount} 🪙</span>
                            <span style="color: #aaa; margin-left: 8px;">${h.reason}</span>
                        </div>
                        <span style="color: #666; font-size: 12px;">${date}</span>
                    </div>
                `;
            }).join('') || '<div style="padding: 20px; text-align: center; color: #666;">No history yet. Complete lessons to earn coins!</div>';
            
            container.innerHTML = `
                <div class="iready-modal-backdrop"></div>
                <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 400px; max-height: 500px; background: #111; border: 1px solid #333; border-radius: 16px; z-index: 50010; overflow: hidden; animation: modalPop 0.3s;">
                    <div style="padding: 20px; background: linear-gradient(135deg, #1a1a1a, #0a0a0a); border-bottom: 1px solid #333; display: flex; justify-content: space-between; align-items: center;">
                        <h3 style="margin:0; color:#fff; font-size:24px; font-family:'Sofia Pro Condensed',sans-serif;">📊 HISTORY</h3>
                        <button class="close-btn" style="background:#2a2a2a; border:1px solid #444; color:#fff; width:36px; height:36px; border-radius:8px; cursor:pointer;">✕</button>
                    </div>
                    <div style="padding: 16px; overflow-y: auto; max-height: 400px;">
                        ${historyList}
                    </div>
                </div>
            `;
            
            document.body.appendChild(container);
            
            const backdrop = container.querySelector('.iready-modal-backdrop');
            const closeBtn = container.querySelector('.close-btn');
            
            backdrop.addEventListener('click', () => closeModalWithAnimation(backdrop));
            closeBtn.addEventListener('click', () => closeModalWithAnimation(closeBtn));
        }

        // === GAME LAUNCH MODAL ===
        launchGame(name, url, icon) {
            if (ANTI_CHEAT.isActive) return;
            
            const container = document.createElement('div');
            container.className = 'iready-modal-container';
            
            container.innerHTML = `
                <div class="iready-modal-backdrop"></div>
                <div class="iready-game-container">
                    <div style="padding: 16px 24px; background: #0a0a0a; border-bottom: 1px solid #333; display: flex; justify-content: space-between; align-items: center;">
                        <span style="color: #fff; font-size: 24px; font-family: 'Sofia Pro Condensed', sans-serif; font-weight: 700;">${icon} ${name}</span>
                        <button class="close-btn" style="background:#2a2a2a; border:1px solid #444; color:#fff; width:36px; height:36px; border-radius:8px; cursor:pointer; font-size:20px;">✕</button>
                    </div>
                    <iframe src="${url}" style="flex: 1; border: 0; width: 100%; background: #000;"></iframe>
                </div>
            `;
            
            document.body.appendChild(container);
            
            const backdrop = container.querySelector('.iready-modal-backdrop');
            const closeBtn = container.querySelector('.close-btn');
            
            backdrop.addEventListener('click', () => closeModalWithAnimation(backdrop));
            closeBtn.addEventListener('click', () => closeModalWithAnimation(closeBtn));
        }

        createWidget() {
            const widget = document.createElement('div');
            widget.id = 'iready-coin-widget';
            let pos = { x: 20, y: 20 };
            try {
                const saved = localStorage.getItem('iready_widget_pos');
                if (saved) pos = JSON.parse(saved);
            } catch {}
            widget.style.cssText = `
                position: fixed;
                left: ${pos.x}px;
                top: ${pos.y}px;
                background: linear-gradient(135deg, #7c3aed, #6d28d9);
                color: white;
                border: 1px solid #a78bfa;
                border-radius: 50px;
                padding: 12px 24px;
                font-family: 'Sofia Pro Condensed', sans-serif;
                font-size: 24px;
                font-weight: 700;
                cursor: move;
                box-shadow: 0 8px 20px rgba(124,58,237,0.3);
                display: flex;
                align-items: center;
                gap: 16px;
                z-index: ${CONFIG.Z_INDEX};
                user-select: none;
                transition: box-shadow 0.2s;
                backdrop-filter: blur(4px);
            `;
            
            const coinSpan = document.createElement('span');
            coinSpan.id = 'iready-coin-display';
            coinSpan.style.cssText = `
                background: #5b21b6;
                padding: 8px 16px;
                border-radius: 30px;
                display: flex;
                align-items: center;
                gap: 8px;
                border: 1px solid #8b5cf6;
            `;
            coinSpan.innerHTML = `🪙 <span id="iready-coin-count">${this.coins}</span>`;
            
            const gameBtn = document.createElement('button');
            gameBtn.textContent = '🎮 GAMES';
            gameBtn.style.cssText = `
                background: rgba(255,255,255,0.2);
                border: 1px solid rgba(255,255,255,0.3);
                border-radius: 30px;
                color: white;
                padding: 8px 20px;
                font-size: 20px;
                font-family: inherit;
                font-weight: 700;
                cursor: pointer;
                transition: all 0.2s;
            `;
            gameBtn.onmouseenter = () => {
                gameBtn.style.background = 'rgba(255,255,255,0.3)';
                gameBtn.style.transform = 'scale(1.05)';
            };
            gameBtn.onmouseleave = () => {
                gameBtn.style.background = 'rgba(255,255,255,0.2)';
                gameBtn.style.transform = 'scale(1)';
            };
            gameBtn.onclick = (e) => {
                e.stopPropagation();
                this.showGameCenter();
            };
            
            const historyBtn = document.createElement('button');
            historyBtn.textContent = '📊';
            historyBtn.title = 'View History';
            historyBtn.style.cssText = `
                background: rgba(255,255,255,0.2);
                border: 1px solid rgba(255,255,255,0.3);
                border-radius: 30px;
                color: white;
                width: 40px;
                height: 40px;
                font-size: 20px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
            `;
            historyBtn.onmouseenter = () => {
                historyBtn.style.background = 'rgba(255,255,255,0.3)';
                historyBtn.style.transform = 'scale(1.1)';
            };
            historyBtn.onmouseleave = () => {
                historyBtn.style.background = 'rgba(255,255,255,0.2)';
                historyBtn.style.transform = 'scale(1)';
            };
            historyBtn.onclick = (e) => {
                e.stopPropagation();
                this.showHistory();
            };
            
            widget.appendChild(coinSpan);
            widget.appendChild(gameBtn);
            widget.appendChild(historyBtn);
            this.makeDraggable(widget);
            return widget;
        }

        makeDraggable(element) {
            let startX, startY, startLeft, startTop;
            const dragStart = (e) => {
                if (e.target.tagName === 'BUTTON' || ANTI_CHEAT.isActive) return;
                e.preventDefault();
                this.isDragging = true;
                const rect = element.getBoundingClientRect();
                startX = e.clientX;
                startY = e.clientY;
                startLeft = rect.left;
                startTop = rect.top;
                element.style.cursor = 'grabbing';
                element.style.transition = 'none';
                element.style.opacity = '0.9';
                element.style.boxShadow = '0 12px 28px rgba(124,58,237,0.5)';
                document.addEventListener('mousemove', dragMove);
                document.addEventListener('mouseup', dragEnd);
            };
            const dragMove = (e) => {
                if (!this.isDragging) return;
                e.preventDefault();
                const dx = e.clientX - startX;
                const dy = e.clientY - startY;
                const newLeft = Math.max(0, Math.min(window.innerWidth - element.offsetWidth, startLeft + dx));
                const newTop = Math.max(0, Math.min(window.innerHeight - element.offsetHeight, startTop + dy));
                element.style.left = newLeft + 'px';
                element.style.right = 'auto';
                element.style.top = newTop + 'px';
            };
            const dragEnd = () => {
                this.isDragging = false;
                element.style.cursor = 'move';
                element.style.transition = 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
                element.style.opacity = '1';
                element.style.boxShadow = '0 8px 20px rgba(124,58,237,0.3)';
                try {
                    localStorage.setItem('iready_widget_pos', JSON.stringify({
                        x: parseInt(element.style.left),
                        y: parseInt(element.style.top)
                    }));
                } catch {}
                document.removeEventListener('mousemove', dragMove);
                document.removeEventListener('mouseup', dragEnd);
            };
            element.addEventListener('mousedown', dragStart);
        }

        showNotification(message, color) {
            const notif = document.createElement('div');
            notif.className = 'iready-notification';
            notif.style.background = color;
            notif.textContent = message;
            document.body.appendChild(notif);
            setTimeout(() => notif.remove(), 2500);
        }

        animateCoinGain(amount) {
            const widget = document.getElementById('iready-coin-widget');
            if (!widget) return;
            const rect = widget.getBoundingClientRect();
            for (let i = 0; i < 3; i++) {
                setTimeout(() => {
                    const coin = document.createElement('div');
                    coin.innerHTML = '🪙';
                    coin.style.cssText = `
                        position: fixed;
                        left: ${rect.left + 30 + (Math.random() * 40 - 20)}px;
                        top: ${rect.top}px;
                        font-size: ${30 + Math.random() * 20}px;
                        z-index: ${CONFIG.Z_INDEX + 20};
                        pointer-events: none;
                        filter: drop-shadow(0 0 15px #7c3aed);
                        animation: coinFloat${i} 1s forwards;
                    `;
                    const style = document.createElement('style');
                    style.textContent = `
                        @keyframes coinFloat${i} {
                            100% { transform: translate(${100 + Math.random() * 100}px, -${150 + Math.random() * 100}px) rotate(${360 * (i+1)}deg); opacity: 0; }
                        }
                    `;
                    document.head.appendChild(style);
                    document.body.appendChild(coin);
                    setTimeout(() => {
                        coin.remove();
                        style.remove();
                    }, 1000);
                }, i * 100);
            }
        }

        updateWidgetCoins() {
            const countSpan = document.getElementById('iready-coin-count');
            if (countSpan) countSpan.textContent = this.coins;
        }

        interceptNetwork() {
            const originalFetch = window.fetch;
            const self = this;
            window.fetch = function(...args) {
                return originalFetch.apply(this, args).then(response => {
                    const clone = response.clone();
                    if (response.url && (response.url.includes('/api/') || response.url.includes('lesson'))) {
                        clone.json().then(data => self.processLessonResponse(data)).catch(() => {});
                    }
                    return response;
                });
            };
            
            const XHR = XMLHttpRequest.prototype;
            const originalSend = XHR.send;
            XHR.send = function() {
                this.addEventListener('load', () => {
                    try {
                        if (this.responseText && (this._url?.includes('/api/') || this._url?.includes('lesson'))) {
                            const data = JSON.parse(this.responseText);
                            self.processLessonResponse(data);
                        }
                    } catch (e) {}
                });
                return originalSend.apply(this, arguments);
            };
            
            const originalOpen = XHR.open;
            XHR.open = function(method, url) {
                this._url = url;
                return originalOpen.apply(this, arguments);
            };
        }

        init() {
            if (ANTI_CHEAT.isActive) return;
            
            this.widget = this.createWidget();
            const addWidget = () => {
                if (!document.getElementById('iready-coin-widget')) {
                    document.body.appendChild(this.widget);
                }
            };
            
            if (document.body) {
                addWidget();
            } else {
                document.addEventListener('DOMContentLoaded', addWidget);
            }
            
            this.interceptNetwork();
            window._ireadyCoinSystem = this;
            window.ANTI_CHEAT = ANTI_CHEAT;
            window.closeModalWithAnimation = closeModalWithAnimation;
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            if (!window._ireadyCoinSystem && !ANTI_CHEAT.isActive) {
                new CoinGameSystem();
            }
        });
    } else {
        if (!window._ireadyCoinSystem && !ANTI_CHEAT.isActive) {
            new CoinGameSystem();
        }
    }
})();
