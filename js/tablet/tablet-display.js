import { createVisitorBtn } from "./tablet-btn.js";

let display = null;

function getDisplay() {
    if (!display) {
        const panel = document.getElementById("visitor-btn-panel");
        if (!panel) return null;
        display = createTabletDisplay(panel);
    }
    return display;
}

export function createTabletDisplay(panel) {
    function renderEmpty() {
        panel.hidden = true;
        panel.replaceChildren();
    }

    function renderSingle(visitor) {
        panel.hidden = false;
        const button = createVisitorBtn(visitor);
        panel.replaceChildren(button);
    }

    function renderStack(list) {
        console.log("renderStack")
        panel.hidden = false;
        const root = document.createElement("div");
        root.className = "visitor-stack";

        list.forEach((visitor) => {
            root.appendChild(createVisitorBtn(visitor));
        });

        panel.replaceChildren(root);
    }

    function update_btn(newVisitors) {
        const list = Array.isArray(newVisitors) ? newVisitors : [];
        console.log("list is:", newVisitors)
        console.log("list length", list.length)

        if (list.length === 0) {
            renderEmpty();
            return;
        }

        if (list.length === 1) {
            renderSingle(list[0]);
            return;
        }

        renderStack(list);
    }

    return { update_btn };
}

export function updateVisitorBtnPanel(visitors = []) {
    const activeDisplay = getDisplay();
    if (activeDisplay) {
        activeDisplay.update_btn(visitors);
    }
}