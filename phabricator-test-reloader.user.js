// ==UserScript==
// @name         Phabricator Test Reloader
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Reload the Phabricator Differential page periodically while tests run.
// @author       Payton Swick <payton@foolord.com>
// @match        https://code.a8c.com/D*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=a8c.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const refreshInterval = 1000 * 15;
    const successMark = '✅ ';
    const failMark = '❌ ';
    const topOfPageOffsetForRefresh = 300;
    const lastAutoRefreshKeyPrefix = 'phabricator-test-reloader-last-auto-refresh-';

    function isVisible(elm) {
        const rect = elm.getBoundingClientRect();
        const viewHeight = Math.max(document.documentElement.clientHeight, window.innerHeight);
        return !(rect.bottom < 0 || rect.top - viewHeight >= 0);
    }
    function isBuildAreaVisible() {
        const buildArea = Array.from(document.querySelectorAll('.phui-property-list-key')).find(el => el.textContent.includes('Build Status'));
        if (!buildArea) {
            return false;
        }
        return isVisible(buildArea);
    }
    function areTestsRunning() {
        return document.querySelectorAll('.phui-status-list-view .phui-icon-view.fa-chevron-circle-right.blue').length > 0;
    }
    function didTestsFail() {
        return document.querySelectorAll('.phui-status-list-view .phui-icon-view.fa-times-circle.red').length > 0;
    }
    function didTestsPass() {
        if (didTestsFail() || areTestsRunning()) {
            return false;
        }
        return document.querySelectorAll('.phui-status-list-view .phui-icon-view.fa-check-circle.green').length > 0;
    }
    function areWeAtPageTop() {
        return window.scrollY < topOfPageOffsetForRefresh;
    }
    function refreshPage() {
        window.location.reload();
    }
    function refreshIfNeeded() {
        if (!areTestsRunning()) {
            markTitleForTestStatus();
            return;
        }
        if (didTestsFail()) {
            markTitleForTestStatus();
            return;
        }
        if (areWeAtPageTop() || isBuildAreaVisible()) {
            refreshPage();
            return;
        }
        startRefreshTimer();
    }
    function watchRefocus(callback) {
        window.addEventListener('visibilitychange', callback);
        window.addEventListener('focus', callback);
    }
    function getRefreshKey() {
        return lastAutoRefreshKeyPrefix + document.querySelector('.phui-crumb-view.phabricator-last-crumb').innerText;
    }
    function getLastAutoRefreshTime() {
        return window.localStorage.getItem(getRefreshKey());
    }
    function setLastAutoRefreshTime() {
        window.localStorage.setItem(getRefreshKey(), Date.now());
    }
    function shouldAutoRefreshOnFocus() {
        const lastAutoRefreshTime = getLastAutoRefreshTime();
        if (! lastAutoRefreshTime) {
            return true;
        }
        const now = Date.now();
        const msSinceRefresh = now - lastAutoRefreshTime;
        const oneMinuteInMs = 60000;
        const minMsBeforeRefresh = oneMinuteInMs * 2;
        if (msSinceRefresh > minMsBeforeRefresh) {
            return true;
        }
        return false;
    }
    function isOffline() {
        return ! window.navigator.onLine;
    }
    function addTestMarkToTitle(isSuccess) {
        let link = document.querySelector("link[rel~='icon']");
        if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.getElementsByTagName('head')[0].appendChild(link);
        }
        const mark = isSuccess ? successMark : failMark;
        link.setAttribute('href', `data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>${mark}</text></svg>`);
    }
    function markTitleForTestStatus() {
        if (didTestsFail()) {
            addTestMarkToTitle(false);
            return;
        }
        if (didTestsPass()) {
            addTestMarkToTitle(true);
            return;
        }
    }
    function startRefreshTimer() {
        setTimeout(refreshIfNeeded, refreshInterval);
    }
    function begin() {
        if (areTestsRunning()) {
            startRefreshTimer();
        }
        markTitleForTestStatus();
        watchRefocus(() => {
            if (shouldAutoRefreshOnFocus() && ! isOffline() && (areWeAtPageTop() || isBuildAreaVisible())) {
                setLastAutoRefreshTime();
                refreshPage();
            }
        });
    }
    begin();
})();
