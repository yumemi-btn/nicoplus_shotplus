// ==UserScript==
// @name         nicoplus_shotplus
// @namespace    https://github.com/yumemi-btn/nicoplus_shotplus
// @version      0.2
// @description  ニコニコチャンネルプラスでスクリーンショットを撮影するためのUserJSです
// @author       @infinite_chain
// @match        https://nicochannel.jp/*
// @grant        GM_download
// ==/UserScript==

(function() {
    'use strict';

    // ファイル名のフォーマット設定
    const fileNameFormat = 'nicoplus_${currentDate}_${pageTitle}_${currentTime}.png';

    class ScreenshotTool {
        constructor() {
            this.button = this.createButton();
            this.notification = this.createNotification();
            this.addListeners();
        }

        createButton() {
            const button = document.createElement('div');
            button.className = 'nicoplus-screenshot-button';
            button.title = 'nicoplus_shotplus: クリック または F2キーでスクリーンショットを保存します。';
            button.onclick = () => this.takeScreenshot();
            document.body.appendChild(button);
            return button;
        }

        createNotification() {
            const notification = document.createElement('div');
            notification.className = 'nicoplus-screenshot-notification';
            this.button.appendChild(notification);
            return notification;
        }

        addListeners() {
            document.addEventListener('fullscreenchange', () => {
                const container = document.fullscreenElement || document.body;
                container.appendChild(this.button);
                this.button.classList.toggle('fullscreen', !!document.fullscreenElement);
            });

            document.addEventListener('keydown', (e) => {
                if (e.key === 'F2') {
                    e.preventDefault();
                    this.takeScreenshot();
                }
            });
        }

        showButton() {
            this.button.classList.add('visible');
            clearTimeout(this.hideTimeout);
            this.hideTimeout = setTimeout(() => {
                this.button.classList.remove('visible');
            }, 1200);
        }

        showNotification(message) {
            this.notification.textContent = message;
            this.notification.classList.add('visible');
            clearTimeout(this.notificationTimeout);
            this.notificationTimeout = setTimeout(() => {
                this.notification.classList.remove('visible');
            }, 1000);
        }

        async takeScreenshot() {
            this.button.classList.add('active');
            this.showButton();

            const video = document.querySelector('video');
            if (!video) {
                this.showNotification('エラー！動画プレイヤーが見つかりません。');
                this.button.classList.remove('active');
                return;
            }

            try {
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);

                const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
                const pageTitle = document.title;
                const fileName = fileNameFormat
                    .replace('${currentDate}', this.getCurrentDate())
                    .replace('${pageTitle}', pageTitle)
                    .replace('${currentTime}', this.formatTime(video.currentTime));

                await GM_download({
                    url: URL.createObjectURL(blob),
                    name: fileName,
                    saveAs: false
                });

                this.showNotification('撮影しました！');
            } catch (error) {
                console.error('Screenshot failed:', error);
                this.showNotification('エラー！スクリーンショットの撮影に失敗しました。');
            } finally {
                this.button.classList.remove('active');
            }
        }

        getCurrentDate() {
            const date = new Date();
            const yyyy = date.getFullYear();
            const mm = String(date.getMonth() + 1).padStart(2, '0');
            const dd = String(date.getDate()).padStart(2, '0');
            return `${yyyy}-${mm}-${dd}`;
        }

        formatTime(seconds) {
            const h = Math.floor(seconds / 3600);
            const m = Math.floor((seconds % 3600) / 60);
            const s = Math.floor(seconds % 60);
            const ms = Math.floor((seconds % 1) * 1000);
            return `${h}.${m.toString().padStart(2, '0')}.${s.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
        }
    }

    new ScreenshotTool();

    const style = document.createElement('style');
    style.textContent = `
        .nicoplus-screenshot-button {
            position: fixed;
            font-size: 3rem;
            left: 1rem;
            bottom: 1.5rem;
            line-height: 1;
            display: flex;
            align-items: center;
            cursor: pointer;
            z-index: 9999;
            transition: opacity 0.15s;
            text-shadow: 1px 1px 2px black;
            opacity: 0.2;
        }
        .nicoplus-screenshot-button::before {
            content: '📷️';
            transition: transform 0.1s;
        }
        .nicoplus-screenshot-button.active::before {
            content: '📸';
            transform: scale(0.85);
        }
        .nicoplus-screenshot-button:hover,
        .nicoplus-screenshot-button.visible {
            opacity: 1;
        }
        .nicoplus-screenshot-button.fullscreen {
            bottom: 4.5rem;
        }
        .nicoplus-screenshot-notification {
            position: absolute;
            bottom: 0.2rem;
            left: 100%;
            margin-left: 0.4rem;
            background-color: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 0.4rem 0.4rem 0.4rem 0.6rem;
            border-radius: 0.4rem;
            white-space: nowrap;
            transition: opacity 0.5s;
            opacity: 0;
            pointer-events: none;
            font-size: 0.8rem;
            font-weight: bold;
        }
        .nicoplus-screenshot-notification.visible {
            opacity: 1;
        }
        .nicoplus-screenshot-notification::before {
            content: '';
            position: absolute;
            top: 50%;
            right: 100%;
            margin-top: -0.3rem;
            border-width: 0.3rem;
            border-style: solid;
            border-color: transparent rgba(0, 0, 0, 0.8) transparent transparent;
        }
    `;
    document.head.appendChild(style);
})();
