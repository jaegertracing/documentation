// Copyright 2019 The Jaeger Authors
// Copyright 2019 Istio Authors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Adopted from https://github.com/istio/istio.io/blob/master/src/ts/tabset.ts
//  - converted to JavaScript using http://www.typescriptlang.org/play
//  - minor fix-ups to avoid using functions from Istio's src/ts/utils.ts
//  - disable cookies functionality
//  - remove keyboard navigation

"use strict";

const ariaSelected = "aria-selected";
const ariaControls = "aria-controls";
const tabIndex = "tabindex";

function selectTabsets(cookieName, cookieValue) {
    document.querySelectorAll(".tabset").forEach(tabset => {
        tabset.querySelectorAll(".tab-strip").forEach(o => {
            const strip = o;
            if (strip.dataset.cookieName === cookieName) {
                strip.querySelectorAll("[role=tab]").forEach(tab => {
                    const attr = tab.getAttribute(ariaControls);
                    if (!attr) {
                        return;
                    }
                    const panel = document.getElementById(attr);
                    if (!panel) {
                        return;
                    }
                    if (tab.dataset.cookieValue === cookieValue) {
                        tab.setAttribute(ariaSelected, "true");
                        tab.removeAttribute(tabIndex);
                        panel.removeAttribute("hidden");
                    }
                    else {
                        tab.removeAttribute(ariaSelected);
                        tab.setAttribute(tabIndex, "-1");
                        panel.setAttribute("hidden", "");
                    }
                });
            }
        });
    });
}
function handleTabs() {
    document.querySelectorAll(".tabset").forEach(tabset => {
        const strip = tabset.querySelector(".tab-strip");
        if (!strip) {
            return;
        }
        const cookieName = strip.dataset.cookieName;
        const panels = tabset.querySelectorAll("[role=tabpanel]");
        const tabs = [];
        strip.querySelectorAll("[role=tab]").forEach(tab => {
            tabs.push(tab);
        });
        function activateTab(tab) {
            deactivateAllTabs();
            tab.removeAttribute(tabIndex);
            tab.setAttribute(ariaSelected, "true");
            const ac = tab.getAttribute(ariaControls);
            if (ac) {
                const other = document.getElementById(ac);
                if (other) {
                    other.removeAttribute("hidden");
                }
            }
        }
        function deactivateAllTabs() {
            tabs.forEach(tab => {
                tab.setAttribute(tabIndex, "-1");
                tab.setAttribute(ariaSelected, "false");
            });
            panels.forEach(panel => {
                panel.setAttribute("hidden", "");
            });
        }
        // attach the event handlers to support tab sets
        strip.querySelectorAll("button").forEach(tab => {
            tab.addEventListener("focus", () => {
                activateTab(tab);
                if (cookieName) {
                    const cookieValue = tab.dataset.cookieValue;
                    if (cookieValue) {
                        selectTabsets(cookieName, cookieValue);
                    }
                }
            });
            tab.addEventListener("click", () => {
                activateTab(tab);
                if (cookieName) {
                    const cookieValue = tab.dataset.cookieValue;
                    if (cookieValue) {
                        selectTabsets(cookieName, cookieValue);
                    }
                }
            });
        });
    });
}
handleTabs();
