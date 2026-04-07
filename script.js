"use strict";
console.log(window.innerWidth);
console.log(window.innerHeight);

// --- Global state ---
const icons = [];
let iconCount = 0;
let editMode = true;
let deleteMode = false;
let isFullScreen = false;

let xDashboardMin = 210;
let xDashboardMax = window.innerWidth - 200;
let yDashboardMin = 90;
let yDashboardMax = window.innerHeight - 140;
let imageSize = 128;

// --- Element references ---
const topBar = $("#topBar");
const SideBar = $("#dashboardSidebar");
const BgColorButton = $("#bgColorButton");
const BgColorPicker = $("#bgColor");
const preview = $("#colorPreview");
const dashboard = $("#dashboard");
const deleteTool = $("#deleteTool");
const fullScreenButton = $("#fullscreenBtn");
const addIconBtn = document.getElementById("addIcon");

const editButtons = [
    "#addIcon",
    "#deleteTool",
    "#clearBoard"
];


$(document).ready(function() {

    function initializeDashboard() {
        const savedBackgroundColor = localStorage.getItem("dashboardBgColor");
        if (savedBackgroundColor) {
            dashboard.css("background-color", savedBackgroundColor);
            preview.css("background-color", savedBackgroundColor);
            BgColorPicker.val(savedBackgroundColor);
        } else {
            preview.css("background-color", BgColorPicker.val());
        }

        const editSaved = localStorage.getItem("editMode");
        editMode = editSaved === null ? true : editSaved === "true";

        // ✅ NEW (mode display sync)
        $("#modeDisplay").text(editMode ? "Mode: Edit" : "Mode: Active");
        $("#toggleMode").text(editMode ? "Switch to Active" : "Switch to Edit");
    }


    initializeDashboard();

    // Background picker
    BgColorButton.on("click", function() {
        BgColorPicker.click();
    });

    BgColorPicker.on("input", function() {
        const color = $(this).val();
        dashboard.css("background-color", color);
        preview.css("background-color", color);
        localStorage.setItem("dashboardBgColor", color);
    });

    // ✅ NEW SINGLE MODE TOGGLE
    $("#toggleMode").on("click", function() {
        editMode = !editMode;

        $("#modeDisplay").text(editMode ? "Mode: Edit" : "Mode: Active");
        $("#toggleMode").text(editMode ? "Switch to Active" : "Switch to Edit");

        // reset delete tool
        deleteMode = false;
        dashboard.css("cursor", "default");
        dashboard.removeClass("deleteMode");
        deleteTool.text("Delete Tool");

        localStorage.setItem("editMode", editMode);
        switchMode();
    });

    // save/load
    $("#load").on("click", function() {
        LoadPreviousDashboardLayout();
    });

    $("#save").on("click", function() {
        saveCurrentDashboardLayout();
    });

    $("#clearBoard").on("click", function() {
        clearBoard();
    });

    // delete tool
    $("#deleteTool").on("click", function() {
        if (!editMode) return;

        deleteMode = !deleteMode;
        $("#deleteTool").text(deleteMode ? "Cancel Delete" : "Delete Tool");

        if (deleteMode) {
            dashboard.css("cursor", "url('images/smallRedX.png') 15 12, auto");
            dashboard.addClass("deleteMode");
        } else {
            dashboard.css("cursor", "default");
            dashboard.removeClass("deleteMode");
        }
    });

    $("#fullscreenBtn").on("click", function() {
        isFullScreen = !isFullScreen;
        setFullHeight();
        fullScreenFunction();
    });
    updateButtons();


// =======================
// INITIALIZE DEFAULT PREVIEWS
// =======================
    $("#shapeColorPreview").css("background-color", $("#shapeColor").val());
    $("#textColorPreview").css("background-color", $("#textColor").val());
    


});

// Add Icon
addIconBtn.addEventListener("click", function() {

    // reset delete tool
    deleteMode = false;
    dashboard.css("cursor", "default");
    dashboard.removeClass("deleteMode");
    deleteTool.text("Delete Tool");
    
    $("#iconModalOverlay").removeClass("hidden");
    clear_iconCreation();


})


$("#cancelIconCreate").on("click", function() {
    $("#iconModalOverlay").addClass("hidden");
    clear_iconCreation();
})


// =======================
// ICON TYPE TOGGLE
// =======================

$("input[name='iconType']").on("change", function() {
    const type = $("input[name='iconType']:checked").val();

    if (type === "image") {
        $("#shapeControls").addClass("hidden");
        $("#imageControls").removeClass("hidden");

        $("#iconPreviewShape").addClass("hidden");
        $("#iconPreviewImage").removeClass("hidden");
    } else {
        $("#shapeControls").removeClass("hidden");
        $("#imageControls").addClass("hidden");

        $("#iconPreviewShape").removeClass("hidden");
        $("#iconPreviewImage").addClass("hidden");
    }
});


// =======================
// ICON image upload tool
// =======================

$("#iconImageUpload").on("change", function(e) {
    const file = e.target.files[0];
    if (!file) return;

    resizeImageToDataURL(file, imageSize)
        .then(function(resizedDataURL) {
            $("#iconPreviewImage")
                .attr("src", resizedDataURL)
                .removeClass("hidden");

            $("#iconPreviewShape").addClass("hidden");
        })
        .catch(function(error) {
            console.error(error);
            alert("There was a problem loading the preview image.");
        });
});



function resizeImageToDataURL(file, size = 128) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = function(e) {
            const img = new Image();

            img.onload = function() {
                const canvas = document.createElement("canvas");
                canvas.width = size;
                canvas.height = size;

                const ctx = canvas.getContext("2d");

                if (!ctx) {
                    reject(new Error("Canvas context failed"));
                    return;
                }

                ctx.clearRect(0, 0, size, size);

                // OPTIONAL: background fill (remove if you want transparent)
                // ctx.fillStyle = "#ffffff";
                // ctx.fillRect(0, 0, size, size);

                const aspect = img.width / img.height;

                let drawWidth, drawHeight;

                if (aspect > 1) {
                    // wider image
                    drawWidth = size;
                    drawHeight = size / aspect;
                } else {
                    // taller image
                    drawHeight = size;
                    drawWidth = size * aspect;
                }

                const x = (size - drawWidth) / 2;
                const y = (size - drawHeight) / 2;

                ctx.drawImage(img, x, y, drawWidth, drawHeight);

                const dataURL = canvas.toDataURL("image/png");
                resolve(dataURL);
            };

            img.onerror = () => reject(new Error("Image load failed"));
            img.src = e.target.result;
        };

        reader.onerror = () => reject(new Error("File read failed"));
        reader.readAsDataURL(file);
    });
}

// =======================
// PICKER CONTROLS
// =======================

// open native picker from button
$("#shapeColorButton").on("click", function() {
    $("#shapeColor").click();
});

$("#textColorButton").on("click", function() {
    $("#textColor").click();
});

// update shape color preview + live icon preview
$("#shapeColor").on("input", function() {
    const color = $(this).val();

    $("#shapeColorPreview").css("background-color", color);

    // update preview shape in modal
    $("#iconPreviewShape").css("background-color", color);
});

// update text color preview
$("#textColor").on("input", function() {
    const color = $(this).val();

    $("#textColorPreview").css("background-color", color);
});





$("#shapeSelect").on("change", function() {
    const shape = $(this).val();
    const color = $("#shapeColor").val();

    $("#iconPreviewShape")
        .attr("class", "iconShape " + shape)
        .css("background-color", color);
});


// =======================
// RESET FUNCTION
// =======================

function clear_iconCreation() {

    $("input[name='iconType'][value='shape']").prop("checked", true);

    $("#shapeControls").removeClass("hidden");
    $("#imageControls").addClass("hidden");

    $("#shapeSelect").val("square");

    $("#iconPreviewShape")
        .attr("class", "iconShape square")
        .css("background-color", "#34c759")
        .removeClass("hidden");

    $("#iconPreviewImage")
        .attr("src", "")
        .addClass("hidden");

    $("#shapeColor").val("#34c759");
    $("#textColor").val("#000000");

    $("#shapeColorPreview").css("background-color", "#34c759");
    $("#textColorPreview").css("background-color", "#000000");

    $("#iconImageUpload").val("");

    $("#iconLabel").val("");
    $("#iconLinkInput").val("");
}






$("#createIconConfirm").on("click", function() {

    const label = $("#iconLabel").val().trim();
    const link = $("#iconLinkInput").val().trim();
    const type = $("input[name='iconType']:checked").val();
    const imageFile = $("#iconImageUpload")[0].files[0];
    const shape = $("#shapeSelect").val();
    const shapeColor = $("#shapeColor").val();
    const textColor = $("#textColor").val();

    if (!label) {
        alert("Please enter a label.");
        return;
    }

    if (!link) {
        alert("Please enter a link.");
        return;
    }

    if (type === "image" && !imageFile) {
        alert("Please upload an image.");
        return;
    }

    if (type === "image") {
        resizeImageToDataURL(imageFile, imageSize)
            .then(function(resizedDataURL) {
                add_iconToDashboard({
                    name: label,
                    url: normalizeURL(link),
                    type: type,
                    shape: shape,
                    shapeColor: shapeColor,
                    textColor: textColor,
                    imgSrc: resizedDataURL
                });

                $("#iconModalOverlay").addClass("hidden");
                clear_iconCreation();
            })
            .catch(function(error) {
                console.error(error);
                alert("There was a problem processing the image.");
            });
    } else {
        add_iconToDashboard({
            name: label,
            url: normalizeURL(link),
            type: type,
            shape: shape,
            shapeColor: shapeColor,
            textColor: textColor,
            imgSrc: ""
        });

        $("#iconModalOverlay").addClass("hidden");
        clear_iconCreation();
    }
});

function normalizeURL(url) {
    url = url.trim();

    // if no protocol, add https
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
        url = "https://" + url;
    }

    // extract domain (remove protocol first)
    const domain = url.replace(/^https?:\/\//, "").split("/")[0];

    // if no dot at all → no extension → add .com
    if (!domain.includes(".")) {
        url = url.replace(domain, domain + ".com");
    }

    return url;
}

function add_iconToDashboard(iconData) {
    if (!editMode) return;

    iconCount++;

    const newIcon = {
        id: iconCount,
        name: iconData.name,
        url: iconData.url,
        type: iconData.type,
        shape: iconData.shape,
        shapeColor: iconData.shapeColor,
        textColor: iconData.textColor,
        imgSrc: iconData.imgSrc,
        x: 250,
        y: 250
    };

    icons.push(newIcon);
    renderIcon(newIcon);
}







function buttonEnabler(...buttons) {
    buttons.forEach(btn => {
        const $btn = $(btn);

        const shouldDisable = !editMode;

        $btn.prop("disabled", shouldDisable);

        if (shouldDisable) {
            $btn.addClass("disabled");
        } else {
            $btn.removeClass("disabled");
        }
    });
}











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

    updateButtons();
}

function updateButtons() {
    buttonEnabler(...editButtons);
}














function makeDraggable(wrapper) {
    wrapper.addEventListener("mousedown", function(e) {
        if(!editMode || deleteMode) return;

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

function LoadPreviousDashboardLayout() {
    const savedIcons = localStorage.getItem("dashboardIcons");

    if (!savedIcons) {
        alert("No saved layout found.");
        return;
    }

    const loadedIcons = JSON.parse(savedIcons);

    clearBoard();

    let maxId = 0;

    loadedIcons.forEach(function(icon) {
        if (icon.id > maxId) {
            maxId = icon.id;
        }

        icons.push(icon);
        renderIcon(icon);
    });

    iconCount = maxId;
}

function renderIcon(icon) {
    const wrapper = document.createElement("div");
    wrapper.className = "iconWrapper";
    wrapper.style.position = "absolute";
    wrapper.style.left = icon.x + "px";
    wrapper.style.top = icon.y + "px";
    wrapper.dataset.id = icon.id;

    let visual;

    if (icon.type === "image") {
        visual = document.createElement("img");
        visual.src = icon.imgSrc;
        visual.alt = icon.name;
        visual.className = "iconImage";
    } else {
        visual = document.createElement("div");
        visual.className = "iconShape " + icon.shape;
        visual.style.backgroundColor = icon.shapeColor;
    }

    const label = document.createElement("p");
    label.textContent = icon.name;
    label.style.color = icon.textColor;

    if (editMode) {
        wrapper.appendChild(visual);
        wrapper.appendChild(label);
    } else {
        const link = document.createElement("a");
        link.href = icon.url;
        link.target = "_blank";
        link.className = "iconLink";

        link.appendChild(visual);
        link.appendChild(label);
        wrapper.appendChild(link);
    }

    wrapper.addEventListener("click", function(e) {
        if (deleteMode) {
            wrapper.remove();

            const id = parseInt(wrapper.dataset.id);
            const index = icons.findIndex(iconObj => iconObj.id === id);

            if (index !== -1) {
                icons.splice(index, 1);
            }

            e.stopPropagation();
            return;
        }
    });

    dashboard.append(wrapper);
    makeDraggable(wrapper);
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
        fullScreenButton.addClass("fullScreened")
        fullScreenButton.removeClass("windowed")
        if (editMode){
            fullScreenButton.text("(Edit Mode) Window");
        } else{
            fullScreenButton.text("(Active Mode) Window");
        }
        topBar.addClass("hidden");
        SideBar.addClass("hidden");

        document.querySelectorAll(".iconWrapper").forEach(function(wrapper){
            let y = parseFloat(wrapper.style.top);
            let x = parseFloat(wrapper.style.left);

            y = y - topBarHeight;
            x = x - sideBarWidth;

            y = (dashboardHeight - y) * yMultiplier;
            y = window.innerHeight - y;

            x = (dashboardWidth - x) * xMultiplier;
            x = window.innerWidth - x;
            
            if (x < xDashboardMin) x = xDashboardMin;
            if (x > xDashboardMax) x = xDashboardMax;
            if (y < yDashboardMin) y = yDashboardMin;
            if (y > yDashboardMax) y = yDashboardMax;

            wrapper.style.top = y + "px";
            wrapper.style.left = x + "px";

            const id = parseInt(wrapper.dataset.id);
            const iconObj = icons.find(icon => icon.id === id);
            if (iconObj) {
                iconObj.x = x;
                iconObj.y = y;
            }
        });

        
            $("#fullDashboard").height((window.innerHeight-5) + "px");
            $("#fullDashboard").width((window.innerWidth-1)  + "px");
            
    }else{ //just turned full screen from button
        fullScreenButton.addClass("windowed")
        fullScreenButton.removeClass("fullScreened")
        if (editMode){
            fullScreenButton.text("Fullscreen");
        } else{
            fullScreenButton.text("Fullscreen");
        }
        topBar.removeClass("hidden");
        SideBar.removeClass("hidden");
        
        document.querySelectorAll(".iconWrapper").forEach(function(wrapper){
            let y = parseFloat(wrapper.style.top);
            let x = parseFloat(wrapper.style.left);

            y = (window.innerHeight - y) * (1 / yMultiplier);
            y = window.innerHeight - y;

            x = (window.innerWidth - x) * (1 / xMultiplier);
            x = window.innerWidth - x;

            if (x < xDashboardMin) x = xDashboardMin;
            if (x > xDashboardMax) x = xDashboardMax;
            if (y < yDashboardMin) y = yDashboardMin;
            if (y > yDashboardMax) y = yDashboardMax;

            wrapper.style.top = y + "px";
            wrapper.style.left = x + "px";

            const id = parseInt(wrapper.dataset.id);
            const iconObj = icons.find(icon => icon.id === id);
            if (iconObj) {
                iconObj.x = x;
                iconObj.y = y;
            }
        });
            $("#fullDashboard").height((window.innerHeight - 105)  + "px");
            $("#fullDashboard").width((window.innerWidth-1)  + "px");
    }
    
}



function setFullHeight() {
    $('#fullDashboard').height($(window).height());
    if (isFullScreen){
            $("#fullDashboard").height((window.innerHeight-5) + "px");
            $("#fullDashboard").width((window.innerWidth-1)  + "px");

            xDashboardMin = 0;
            yDashboardMin = 0;
            xDashboardMax = window.innerWidth - 200;
            yDashboardMax = window.innerHeight - 140;
    }else{
            $("#fullDashboard").height((window.innerHeight - 108)  + "px");
            $("#fullDashboard").width((window.innerWidth-1)  + "px");
            
            xDashboardMin = 210;
            yDashboardMin = 90;
            xDashboardMax = window.innerWidth - 200;
            yDashboardMax = window.innerHeight - 140;
    }
}
// Update height on window resize
$(window).resize(setFullHeight);