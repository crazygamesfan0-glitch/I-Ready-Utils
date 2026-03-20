// ==UserScript==
// @name         i-Ready Pro Utils - Games
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Re-add i-Ready Games to i-ready pro.
// @author       You
// @match        https://login.i-ready.com/mspro/dashboard/home
// @match        https://login.i-ready.com/*
// @match        https://www.i-ready.com/*
// @icon         https://www.google.com/s2/favicons?domain=i-ready.com
// @grant        GM_addStyle
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    if (window._ireadyCoinSystemLoaded) return;
    window._ireadyCoinSystemLoaded = true;

    const CONFIG = {
        STORAGE_KEY: 'iready_coins_v2',
        HISTORY_KEY: 'iready_history_v2',
        MIN_SCORE: 80,
        BASE_REWARD: 20,
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
    `);

    class CoinGameSystem {
        constructor() {
            this.coins = this.loadCoins();
            this.history = this.loadHistory();
            this.seenResponses = new Set();
            this.widget = null;
            this.isDragging = false;
            this.dragOffset = { x: 0, y: 0 };
            this.init();
        }

        loadCoins() {
            try {
                return parseInt(localStorage.getItem(CONFIG.STORAGE_KEY)) || 0;
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

        saveCoins() {
            try {
                localStorage.setItem(CONFIG.STORAGE_KEY, this.coins);
                this.updateWidgetCoins();
            } catch (e) {}
        }

        saveHistory() {
            try {
                localStorage.setItem(CONFIG.HISTORY_KEY, JSON.stringify(this.history.slice(-50)));
            } catch (e) {}
        }

        addCoins(amount, reason) {
            this.coins += amount;
            this.history.push({ amount, reason, timestamp: Date.now() });
            this.saveCoins();
            this.saveHistory();
            this.showNotification(`+${amount} COINS`, '#10b981');
            this.animateCoinGain(amount);
        }

        spendCoins(amount, gameName, gameUrl, gameIcon) {
            if (this.coins < amount) {
                this.showNotification(`NEED ${amount - this.coins} MORE`, '#f59e0b');
                return false;
            }
            this.coins -= amount;
            this.history.push({ amount: -amount, reason: gameName, timestamp: Date.now() });
            this.saveCoins();
            this.saveHistory();
            this.showNotification(`-${amount} COINS`, '#7c3aed');
            this.launchGame(gameName, gameUrl, gameIcon);
            return true;
        }

        processLessonResponse(data) {
            if (!data || data.entityType !== 'StudentLesson' || data.status !== 'PASSED') return;
            const score = data.lessonScore;
            if (score >= CONFIG.MIN_SCORE) {
                const bonus = Math.max(0, score - CONFIG.MIN_SCORE);
                const total = CONFIG.BASE_REWARD + bonus;
                this.addCoins(total, `Lesson ${score}%`);
            }
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
                if (e.target.tagName === 'BUTTON') return;
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

        showGameCenter() {
            const modal = document.createElement('div');
            modal.className = 'iready-modal-container';
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
            modal.innerHTML = `
                <div class="iready-modal-backdrop" onclick="this.parentElement.remove()"></div>
                <div class="iready-modal">
                    <div style="padding: 24px 32px; background: linear-gradient(135deg, #1a1a1a, #0a0a0a); border-bottom: 1px solid #333; display: flex; justify-content: space-between; align-items: center;">
                        <h2 style="margin:0; font-size:36px; color:#fff; font-family:'Sofia Pro Condensed',sans-serif; font-weight:700; display:flex; align-items:center; gap:20px;">
                            GAME CENTER
                            <span style="background:#2a2a2a; padding:10px 24px; border-radius:40px; font-size:28px; border:1px solid #7c3aed;">🪙 ${this.coins}</span>
                        </h2>
                        <button style="background:#2a2a2a; border:1px solid #444; color:#fff; width:48px; height:48px; border-radius:12px; font-size:24px; cursor:pointer;" onclick="this.closest('.iready-modal-container').remove()">✕</button>
                    </div>
                    <div style="padding: 24px; display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; overflow-y: auto; background: #111;">
                        ${gamesHtml}
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            modal.querySelectorAll('.play-game-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const gameData = JSON.parse(btn.dataset.game.replace(/&apos;/g, "'"));
                    if (this.spendCoins(gameData.cost, gameData.name, gameData.url, gameData.icon)) {
                        modal.remove();
                    }
                });
                if (!btn.disabled) {
                    btn.onmouseenter = () => {
                        btn.style.background = '#8b5cf6';
                        btn.style.transform = 'scale(1.05)';
                        btn.style.boxShadow = '0 6px 15px rgba(124,58,237,0.4)';
                    };
                    btn.onmouseleave = () => {
                        btn.style.background = '#7c3aed';
                        btn.style.transform = 'scale(1)';
                        btn.style.boxShadow = 'none';
                    };
                }
            });
        }

        showHistory() {
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
            const modal = document.createElement('div');
            modal.innerHTML = `
                <div class="iready-modal-backdrop" onclick="this.parentElement.remove()"></div>
                <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 400px; max-height: 500px; background: #111; border: 1px solid #333; border-radius: 16px; z-index: 50010; overflow: hidden; animation: modalPop 0.3s;">
                    <div style="padding: 20px; background: linear-gradient(135deg, #1a1a1a, #0a0a0a); border-bottom: 1px solid #333; display: flex; justify-content: space-between; align-items: center;">
                        <h3 style="margin:0; color:#fff; font-size:24px; font-family:'Sofia Pro Condensed',sans-serif;">📊 HISTORY</h3>
                        <button style="background:#2a2a2a; border:1px solid #444; color:#fff; width:36px; height:36px; border-radius:8px; cursor:pointer;" onclick="this.closest('div[style*=\\'fixed\\']').parentElement.remove()">✕</button>
                    </div>
                    <div style="padding: 16px; overflow-y: auto; max-height: 400px;">
                        ${historyList}
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        launchGame(name, url, icon) {
            const gameModal = document.createElement('div');
            gameModal.innerHTML = `
                <div class="iready-modal-backdrop" onclick="this.parentElement.remove()"></div>
                <div class="iready-game-container">
                    <div style="padding: 16px 24px; background: #0a0a0a; border-bottom: 1px solid #333; display: flex; justify-content: space-between; align-items: center;">
                        <span style="color: #fff; font-size: 24px; font-family: 'Sofia Pro Condensed', sans-serif; font-weight: 700;">${icon} ${name}</span>
                        <button style="background: #2a2a2a; border: 1px solid #444; color: #fff; width: 36px; height: 36px; border-radius: 8px; cursor: pointer; font-size: 20px;" onclick="this.closest('div[style*=\\'fixed\\']').parentElement.remove()">✕</button>
                    </div>
                    <iframe src="${url}" style="flex: 1; border: 0; width: 100%; background: #000;"></iframe>
                </div>
            `;
            document.body.appendChild(gameModal);
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
                    if (response.url.includes('/api/') || response.url.includes('lesson')) {
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
            window.ireadyCoinSystem = this;
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => new CoinGameSystem());
    } else {
        new CoinGameSystem();
    }
})();
