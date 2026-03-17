"use strict";
console.log(window.innerWidth);  // width in pixels
console.log(window.innerHeight); // height in pixels
// --- Global state ---
const icons = [];
let iconCount = 0; // keeps track for names and IDs
let editMode = true;
let trashExists = true;
let isFullScreen = false;

let xDashboardMin = 210;
let xDashboardMax = window.innerWidth - 90;
let yDashboardMin = 90;
let yDashboardMax = window.innerHeight - 90;

// --- Element references ---
const topBar =$("#topBar");
const SideBar = $("#dashboardSidebar");
const BgColorButton = $("#bgColorButton");
const BgColorPicker = $("#bgColor");
const preview = $("#colorPreview");
const dashboard = $("#dashboard");
const trashCan = $("#trashCan");
const fullScreenButton = $("#fullScreenBtn");
const addIconBtn = document.getElementById("addIcon");

$(document).ready(function() {

    // --- Initialize dashboard from localStorage ---
    function initializeDashboard() {
        // Background color
        const savedBackgroundColor = localStorage.getItem("dashboardBgColor");
        if (savedBackgroundColor) {
            dashboard.css("background-color", savedBackgroundColor);
            preview.css("background-color", savedBackgroundColor);
            BgColorPicker.val(savedBackgroundColor);
        } else {
            preview.css("background-color", BgColorPicker.val());
        }

        // Trash visibility
        const trashSaved = localStorage.getItem("trashExists");
        trashExists = trashSaved === null ? true : trashSaved === "true";
        if(trashExists){
            trashCan.show();
        } else {
            trashCan.hide();
        }

        // Edit mode
        const editSaved = localStorage.getItem("editMode");
        editMode = editSaved === null ? true : editSaved === "true";
        // Optional: update button styles to reflect mode
    }

    initializeDashboard();

    // --- Background picker ---
    BgColorButton.on("click", function() {
        BgColorPicker.click();
    });

    BgColorPicker.on("input", function() {
        const color = $(this).val();
        dashboard.css("background-color", color);
        preview.css("background-color", color);
        localStorage.setItem("dashboardBgColor", color);
    });

    // --- Mode toggles ---
    $("#editMode").on("click", function() {
        editMode = true;
        console.log("editMode");
        localStorage.setItem("editMode", editMode);
        switchMode();
    });

    $("#activeMode").on("click", function() {
        editMode = false;
        console.log("activeMode");
        localStorage.setItem("editMode", editMode);
        switchMode();
    });

    // --- save/load ---
    $("#load").on("click", function() {
        LoadPreviousDashboardLayout();
    });

    $("#save").on("click", function() {
        saveCurrentDashboardLayout();
    });

    $("#clearBoard").on("click", function() {
        clearBoard();
    });

    // --- Trash toggle ---
    $("#trashCanBol").on("click", function() {
        trashExists = !trashExists;
        if(trashExists){
            trashCan.show();
        } else {
            trashCan.hide();
        }
        localStorage.setItem("trashExists", trashExists);
    });

    $("#fullscreenBtn").on("click", function() {
        isFullScreen = !isFullScreen;
        setFullHeight()
        fullScreenFunction();
    });

    

});










// Add Icon button click
addIconBtn.addEventListener("click", function() {
    if (!editMode){
        return;
    }
    iconCount++;

    // Create icon object
    const newIcon = {
        id: iconCount,
        name: "Icon" + iconCount,
        url: "https://www.google.com",
        imgSrc: "",   // triangle is CSS for now
        x: 250,        // default position
        y: 250
    };

    // Add to icons array
    icons.push(newIcon);

    //Create wrapper
    const wrapper = document.createElement("div");
    wrapper.className = "iconWrapper";
    wrapper.style.position = "absolute"; // absolute so x/y works
    wrapper.style.left = newIcon.x + "px";
    wrapper.style.top = newIcon.y + "px";
    wrapper.dataset.id = newIcon.id;

    // Create triangle + label
    const triangle = document.createElement("div");
    triangle.className = "iconShape triangle";

    const label = document.createElement("p");
    label.textContent = newIcon.name;

    // Add based on current mode
    if(editMode) {
        // Edit mode: just append children
        wrapper.appendChild(triangle);
        wrapper.appendChild(label);
    } else {
        // Active mode: wrap in <a> so it can be clicked
        const link = document.createElement("a");
        link.href = newIcon.url;
        link.target = "_blank";
        link.className = "iconLink";

        link.appendChild(triangle);
        link.appendChild(label);
        wrapper.appendChild(link);
    }

    // Append wrapper to dashboard
    dashboard.append(wrapper);

    // Make it draggable (only works if editMode is true)
    makeDraggable(wrapper);
});


















function switchMode() {
    const wrappers = document.querySelectorAll("#dashboard .iconWrapper");
    
    wrappers.forEach(wrapper => {
        const link = wrapper.querySelector("a");
        const iconId = parseInt(wrapper.dataset.id); // each wrapper has data-id
        const iconObj = icons.find(icon => icon.id === iconId);

        if(editMode) {
            // Remove <a> if exists
            if(link) {
                while(link.firstChild) {
                    wrapper.appendChild(link.firstChild);
                }
                link.remove();
            }
            // make draggable here
            makeDraggable(wrapper);
        } else {
            // Wrap children in <a> if not exists
            if(!link) {
                const a = document.createElement("a");
                a.href = iconObj.url;
                a.target = "_blank";

                while(wrapper.firstChild) {
                    a.appendChild(wrapper.firstChild);
                }
                wrapper.appendChild(a);
            }
            // optionally disable dragging
        }
    });
}















function makeDraggable(wrapper) {
    wrapper.addEventListener("mousedown", function(e) {
        if(!editMode) return;

        const startX = parseFloat(wrapper.style.left);
        const startY = parseFloat(wrapper.style.top);

        const offsetX = e.clientX;
        const offsetY = e.clientY;

        const iconId = parseInt(wrapper.dataset.id);
        const iconObj = icons.find(icon => icon.id === iconId);

        function onMouseMove(e) {
            let x = startX + (e.clientX - offsetX);
            let y = startY + (e.clientY - offsetY);

            //keeps inside the dashboard
            if (x < xDashboardMin) x = xDashboardMin;
            if (x > xDashboardMax) x = xDashboardMax;
            if (y < yDashboardMin) y = yDashboardMin;
            if (y > yDashboardMax) y = yDashboardMax;

            wrapper.style.left = x + "px";
            wrapper.style.top = y + "px";

            // update icon object position
            
            iconObj.x = x;
            iconObj.y = y;
        }

        function onMouseUp() {
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
        }

        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);

        // prevent text selection
        e.preventDefault();
    });
}


function saveCurrentDashboardLayout() {

    const iconString = JSON.stringify(icons);

    localStorage.setItem("dashboardIcons", iconString);
    console.log(icons);

}

function LoadPreviousDashboardLayout(){
    const savedIcons = localStorage.getItem("dashboardIcons");
    if (!savedIcons) {
        alert("No saved layout found.");
        return;
    }
    const loadedIcons = JSON.parse(savedIcons);
    clearBoard();
    let maxId = 0;
    loadedIcons.forEach(function(icon) {
        if(icon.id > maxId){
            maxId = icon.id
        }
        icons.push(icon);
        const wrapper = document.createElement("div");

        wrapper.className = "iconWrapper";
        wrapper.style.position = "absolute";
        wrapper.style.left = icon.x + "px";
        wrapper.style.top = icon.y + "px";
        wrapper.dataset.id = icon.id;

        const triangle = document.createElement("div");
        triangle.className = "iconShape triangle";

        const label = document.createElement("p");
        label.textContent = icon.name;

        if(editMode) {
            wrapper.appendChild(triangle);
            wrapper.appendChild(label);
        } else {
            const link = document.createElement("a");
            link.href = icon.url;
            link.target = "_blank";
            link.className = "iconLink";

            link.appendChild(triangle);
            link.appendChild(label);
            wrapper.appendChild(link);
        }
        dashboard.append(wrapper);
        makeDraggable(wrapper);
    });
    iconCount=maxId;
    
}



function clearBoard(){
    dashboard.empty();
    icons.length=0;
    iconCount = 0;
}










function fullScreenFunction(){
    const topBarHeight = 100;
    const sideBarWidth = 200;

    let dashboardHeight = window.innerHeight-topBarHeight;
    let dashboardWidth = window.innerWidth-sideBarWidth;


    let yMultiplier = 1+((topBarHeight)/(dashboardHeight));
    let xMultiplier = 1+((sideBarWidth)/(dashboardWidth));

    if(isFullScreen){ //just turned full screen from button
        topBar.addClass("hidden");
        SideBar.addClass("hidden");

        document.querySelectorAll(".iconWrapper").forEach(function(wrapper){
            let y = parseFloat(wrapper.style.top);
            let x = parseFloat(wrapper.style.left);

            y = y - topBarHeight;
            x = x - sideBarWidth;

            y = (dashboardHeight-y)*yMultiplier;
            y = window.innerHeight-y;

            x = (dashboardWidth -x)*xMultiplier;
            x = window.innerWidth-x;

            wrapper.style.top = y + "px";
            wrapper.style.left = x + "px";

        });
            $("#fullDashboard").height(window.innerHeight-10 + "px");
            $("#fullDashboard").width(window.innerWidth-10  + "px");
            
    }else{ //just turned full screen from button
        topBar.removeClass("hidden");
        SideBar.removeClass("hidden");
        
        document.querySelectorAll(".iconWrapper").forEach(function(wrapper){
            let y = parseFloat(wrapper.style.top);
            let x = parseFloat(wrapper.style.left);

            y = (window.innerHeight-y)*(1/yMultiplier);
            y = window.innerHeight-y;

            x = (window.innerWidth -x)*(1/xMultiplier);
            x = window.innerWidth-x;

            wrapper.style.top = y + "px";
            wrapper.style.left = x + "px";

            
        });
            $("#fullDashboard").height((.99*window.innerHeight - 110)  + "px");
            $("#fullDashboard").width(window.innerWidth-10  + "px");
    }
    
}



function setFullHeight() {
    $('#fullDashboard').height($(window).height());
    if (isFullScreen){
            $("#fullDashboard").height(window.innerHeight-10 + "px");
            $("#fullDashboard").width(window.innerWidth-10  + "px");

            xDashboardMin = 0;
            yDashboardMin = 0;
            xDashboardMax = window.innerWidth - 90;
            yDashboardMax = window.innerHeight - 100;
    }else{
            $("#fullDashboard").height((.99*window.innerHeight - 110)  + "px");
            $("#fullDashboard").width(window.innerWidth-10  + "px");
            
            xDashboardMin = 210;
            yDashboardMin = 90;
            xDashboardMax = window.innerWidth - 90;
            yDashboardMax = window.innerHeight - 90;
    }
}
// Update height on window resize
$(window).resize(setFullHeight);