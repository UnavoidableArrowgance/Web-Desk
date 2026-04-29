"use strict";

// #region Global State */

const icons = [];

let iconCount = 0;
let editMode = true;
let deleteMode = false;
let gridSnap = false;
let isFullScreen = false;
let showTips = true;
let editingIconId = null;
let iconWasDragged = false;

let xDashboardMin = 190;
let xDashboardMax = window.innerWidth - 200;
let yDashboardMin = 80;
let yDashboardMax = window.innerHeight - 190;


        
let gridCellx = 170;
let gridCelly = 170;

let imageSize = 128;

let storageManip = true;
let exportData = "";

// #endregion


// #region Cached Elements

const container_topBar = $("#topBar");
const container_sidebar = $("#dashboardSidebar");
const container_dashboard = $("#dashboard");
const container_fullDashboard = $("#fullDashboard");

const container_externalButtons = $("#externalButtons");

const button_bgColor = $("#bgColorButton");
const input_bgColor = $("#bgColor");

const button_toggleMode = $("#toggleMode");
const text_modeDisplay = $("#modeDisplay");
const text_modeHint = $("#modeHint");

const button_addIcon = $("#addIcon");
const button_deleteTool = $("#deleteTool");
const button_load = $("#load");
const button_save = $("#save");
const button_clearBoard = $("#clearBoard");

const button_gridSnapToggle = $("#gridSnapToggle");

const button_fullscreen = $("#fullscreenBtn");

const overlay_iconModal = $("#iconModalOverlay");
const overlay_storageModal = $("#storageModalOverlay");

const button_cancelIconCreate = $("#cancelIconCreate");
const button_createIconConfirm = $("#createIconConfirm");

const input_iconType = $("input[name='iconType']");
const input_iconImageUpload = $("#iconImageUpload");

const container_shapeControls = $("#shapeControls");
const container_imageControls = $("#imageControls");

const preview_iconShape = $("#iconPreviewShape");
const preview_iconImage = $("#iconPreviewImage");

const select_shape = $("#shapeSelect");

const button_shapeColor = $("#shapeColorButton");
const input_shapeColor = $("#shapeColor");
const preview_shapeColor = $("#shapeColorPreview");

const button_textColor = $("#textColorButton");
const input_textColor = $("#textColor");
const preview_textColor = $("#textColorPreview");

const input_iconLabel = $("#iconLabel");
const input_iconLink = $("#iconLinkInput");

const title_storageModal = $("#storageModalTitle");
const textarea_storage = $("#storageTextArea");
const button_storageCancel = $("#storageCancel");
const button_storageAction = $("#storageAction");

const button_export = $("#exportButton");
const button_import = $("#importButton");

const button_toggleTips = $("#toggleTipsBtn");

const text_fullscreenMode = $("#fullscreenModeText");

const buttons_editOnly = [
    "#addIcon",
    "#deleteTool",
    "#clearBoard"
];

// #endregion


// #region Startup

$(document).ready(function() {
    setup_dashboardStart();
});

function setup_dashboardStart() {
    setup_dashboardInitialState();
    setup_defaultPreviews();

    setup_importExport();
    setup_sidebar();
    setup_iconModal();
    setup_iconCreationControls();
    setup_globalCloseControls();
    setup_cursorTooltip();
    setup_toggleTips();

    update_buttons();
    update_modeUI();
    update_fullscreenButtonColor();

    $(window).resize(setFullHeight);
}

function setup_dashboardInitialState() {
    const savedBackgroundColor = localStorage.getItem("dashboardBgColor");

    if (savedBackgroundColor) {
        container_dashboard.css("background-color", savedBackgroundColor);
        button_bgColor.css("background-color", savedBackgroundColor);
        input_bgColor.val(savedBackgroundColor);
    } else {
        button_bgColor.css("background-color", input_bgColor.val());
    }

    const editSaved = localStorage.getItem("editMode");
    editMode = editSaved === null ? true : editSaved === "true";

    const savedIcons = localStorage.getItem("dashboardIcons");

    showTips = localStorage.getItem("showTips") !== "false";
    updateTipsButton();

    if (savedIcons) {
        load_previousDashboard_layout();
    }
}

function setup_defaultPreviews() {
    preview_shapeColor.css("background-color", input_shapeColor.val());
    preview_textColor.css("background-color", input_textColor.val());
}

function setup_cursorTooltip() {
    const tooltip = $("#cursorTooltip");

    $(document).on("mouseenter", ".iconWrapper", function(e) {
        if (!showTips) return;

        if (deleteMode) {
            tooltip.text("Click to Delete");
        } else {
            tooltip.text(editMode ? "Edit / Drag" : "Open");
        }

        tooltip.css({
            opacity: "1",
            left: e.clientX + "px",
            top: e.clientY + "px"
        });
    });

    $(document).on("mousemove", ".iconWrapper", function(e) {
        if (!showTips) return;

        tooltip.css({
            left: e.clientX + "px",
            top: e.clientY + "px"
        });
    });

    $(document).on("mouseleave", ".iconWrapper", function() {
        tooltip.css("opacity", "0");
    });
}

function setup_toggleTips() {
    button_toggleTips.on("click", function() {
        showTips = !showTips;

        localStorage.setItem("showTips", showTips);

        updateTipsButton();
        $("#cursorTooltip").css("opacity", "0");
    });
}

function updateTipsButton() {
    button_toggleTips
        .text(showTips ? "Tips: ON" : "Tips: OFF")
        .toggleClass("tipsOn", showTips)
        .toggleClass("tipsOff", !showTips);
}
// #endregion


// #region Import / Export

function setup_importExport() {
    button_export.on("click", action_on_exportOpen);
    button_import.on("click", action_on_importOpen);
    button_storageCancel.on("click", action_on_storageClose);
    button_storageAction.on("click", action_on_storageConfirm);
}

function action_on_exportOpen() {
    overlay_storageModal.removeClass("hidden");
    title_storageModal.text("Export Layout");

    exportData = JSON.stringify(localStorage);
    textarea_storage.val(exportData);

    button_storageAction.text("copy");

    storageManip = false;
}

function action_on_importOpen() {
    overlay_storageModal.removeClass("hidden");
    title_storageModal.text("Import Layout");

    exportData = "";
    textarea_storage.val(exportData);

    button_storageAction.text("Commit import");

    storageManip = true;
}

function action_on_storageClose() {
    overlay_storageModal.addClass("hidden");
}

function action_on_storageConfirm() {
    if (!storageManip) {
        navigator.clipboard.writeText(exportData).then(() => {
            console.log("Storage exported and copied to clipboard!");
        }).catch(err => {
            console.error("Failed to copy: ", err);
            console.log(exportData);
        });
    } else {
        action_on_storageImport();
    }
}

function action_on_storageImport() {
    const importString = textarea_storage.val().trim();

    if (!importString) {
        alert("Please paste your layout data first!");
        return;
    }

    const backupData = { ...localStorage };

    try {
        const dataObj = JSON.parse(importString);

        localStorage.clear();

        Object.keys(dataObj).forEach(key => {
            localStorage.setItem(key, dataObj[key]);
        });

        alert("Import successful! The page will now reload.");
        overlay_storageModal.addClass("hidden");
        location.reload();

    } catch (e) {
        console.error("Import failed, restoring old data:", e);

        localStorage.clear();

        Object.keys(backupData).forEach(key => {
            localStorage.setItem(key, backupData[key]);
        });

        alert("Error: Invalid data. Your previous settings have been restored.");
    }
}

// #endregion


// #region Sidebar

function setup_sidebar() {
    setup_backgroundButton();
    setup_modeButton();
    setup_gridSnapButton();
    setup_deleteButton();
    setup_loadSaveClearButtons();
    setup_fullscreenButton();
}

function setup_backgroundButton() {
    button_bgColor.on("click", action_on_backgroundButton);
    input_bgColor.on("input", action_on_backgroundColorChange);
}

function action_on_backgroundButton() {
    input_bgColor.click();
}

function action_on_backgroundColorChange() {
    const color = $(this).val();

    container_dashboard.css("background-color", color);
    button_bgColor.css("background-color", color);
}

function setup_modeButton() {
    button_toggleMode.on("click", action_on_toggleMode);
}

function action_on_toggleMode() {
    editMode = !editMode;

    reset_deleteTool(true);
    update_modeUI(true);
    update_fullscreenButtonColor();

    localStorage.setItem("editMode", editMode);

    switchMode();
}

function setup_gridSnapButton(){
    button_gridSnapToggle.on("click", action_on_gridSnap);
}

function action_on_gridSnap(){
    gridSnap = !gridSnap;

    $("#readjustGridText").text(
        gridSnap ? "Grid Snap: ON" : "Grid Snap: OFF"
    );

    if (gridSnap) {
        button_gridSnapToggle.css(
            "background-image",
            "linear-gradient(to right, black 1px, transparent 1px), linear-gradient(to bottom, black 1px, transparent 1px)"
        );
    } else {
        button_gridSnapToggle.css("background-image", "none");
    }
}


function setup_deleteButton() {
    button_deleteTool.on("click", action_on_deleteTool);
}

function action_on_deleteTool() {
    if (!editMode) return;

    deleteMode = !deleteMode;
    $("#cursorTooltip").css("opacity", "0");

    button_deleteTool.toggleClass("deleteActive", deleteMode);
    $("#deleteTool .deleteText").html(deleteMode ? "Cancel<br>Delete" : "Delete");

    if (deleteMode) {
        container_dashboard.css("cursor", "url('images/smallRedX.png') 15 12, auto");
        container_dashboard.addClass("deleteMode");
    } else {
        container_dashboard.css("cursor", "default");
        container_dashboard.removeClass("deleteMode");
    }
}

// load / save / clear button actions
function setup_loadSaveClearButtons() {
    button_load.on("click", load_previousDashboard_layout);
    button_save.on("click", save_currentDashboard_layout);
    button_clearBoard.on("click", clearBoard);
}

function setup_fullscreenButton() {
    button_fullscreen.on("click", action_on_fullscreenToggle);
}

function action_on_fullscreenToggle() {
    isFullScreen = !isFullScreen;
    fullScreenFunction();
    updateGridCells();
}

function update_modeUI(pulse = false) {
    text_modeDisplay.text(editMode ? "Edit Mode" : "Active Mode");
    text_modeHint.text("tap to switch");

    button_toggleMode
        .toggleClass("editModeButton", editMode)
        .toggleClass("activeModeButton", !editMode);

    container_sidebar.toggleClass("activeMode", !editMode);
    
    button_gridSnapToggle.toggle(editMode);

    if (pulse) {
        pulse_modeButton();
    }
}

function pulse_modeButton() {
    button_toggleMode.removeClass("modePulse");
    void button_toggleMode[0].offsetWidth;
    button_toggleMode.addClass("modePulse");
}

function update_fullscreenButtonColor() {
    if (editMode) {
        button_fullscreen.css("background-color", "#fff3a6");
    } else {
        button_fullscreen.css("background-color", "#b8f5b8");
    }
}

function reset_deleteTool(forceReset = false) {
    if (!deleteMode && !forceReset) return;

    deleteMode = false;

    container_dashboard.css("cursor", "default");
    container_dashboard.removeClass("deleteMode");

    button_deleteTool.removeClass("deleteActive");
    $("#deleteTool .deleteText").html("Delete");
}

function update_buttonEnabled(...buttons) {
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

function update_buttons() {
    update_buttonEnabled(...buttons_editOnly);
}


// #endregion


//#region Icon Modal

function setup_iconModal() {
    button_addIcon.on("click", action_on_addIconOpen);
    button_cancelIconCreate.on("click", action_on_iconModalCancel);
    button_createIconConfirm.on("click", action_on_createIconConfirm);
}

function action_on_addIconOpen() {
    reset_deleteTool();

    overlay_iconModal.removeClass("hidden");
    clear_iconCreation();
}

function action_on_iconModalCancel() {
    overlay_iconModal.addClass("hidden");
    clear_iconCreation();
}

function setup_iconCreationControls() {
    setup_iconTypeSwitch();
    setup_imageUploadPreview();
    setup_colorPickers();
    setup_shapePicker();
}

function setup_iconTypeSwitch() {
    input_iconType.on("change", action_on_iconTypeChange);
}

function action_on_iconTypeChange() {
    const type = $("input[name='iconType']:checked").val();

    if (type === "image") {
        container_shapeControls.addClass("hidden");
        container_imageControls.removeClass("hidden");

        preview_iconShape.addClass("hidden");
        preview_iconImage.removeClass("hidden");
    } else {
        container_shapeControls.removeClass("hidden");
        container_imageControls.addClass("hidden");

        preview_iconShape.removeClass("hidden");
        preview_iconImage.addClass("hidden");
    }

    $(".iconTypeOption").removeClass("active");
    $(this).closest(".iconTypeOption").addClass("active");
}

function setup_imageUploadPreview() {
    input_iconImageUpload.on("change", action_on_iconImageUpload);
}

function action_on_iconImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    resizeImageToDataURL(file, imageSize)
        .then(function(resizedDataURL) {
            preview_iconImage
                .attr("src", resizedDataURL)
                .removeClass("hidden");

            preview_iconShape.addClass("hidden");
        })
        .catch(function(error) {
            console.error(error);
            alert("There was a problem loading the preview image.");
        });
}

// color pickers setup + preview updates
function setup_colorPickers() {
    button_shapeColor.on("click", () => input_shapeColor.click());
    button_textColor.on("click", () => input_textColor.click());

    input_shapeColor.on("input", function() {
        const color = $(this).val();
        preview_shapeColor.css("background-color", color);
        preview_iconShape.css("background-color", color);
    });

    input_textColor.on("input", function() {
        preview_textColor.css("background-color", $(this).val());
    });
}

// shape dropdown setup
function setup_shapePicker() {
    select_shape.on("change", function() {
        preview_iconShape
            .attr("class", "iconShape " + $(this).val())
            .css("background-color", input_shapeColor.val());
    });
}

function clear_iconCreation() {
    editingIconId = null;

    $("#iconModalTitle").text("Create Icon");
    button_createIconConfirm.text("Create Icon");

    $("input[name='iconType'][value='shape']").prop("checked", true);

    $(".iconTypeOption").removeClass("active");
    $("input[name='iconType'][value='shape']").closest(".iconTypeOption").addClass("active");

    container_shapeControls.removeClass("hidden");
    container_imageControls.addClass("hidden");

    select_shape.val("square");

    preview_iconShape
        .attr("class", "iconShape square")
        .css("background-color", "#34c759")
        .removeClass("hidden");

    preview_iconImage
        .attr("src", "")
        .addClass("hidden");

    input_shapeColor.val("#34c759");
    input_textColor.val("#000000");

    preview_shapeColor.css("background-color", "#34c759");
    preview_textColor.css("background-color", "#000000");

    input_iconImageUpload.val("");

    input_iconLabel.val("");
    input_iconLink.val("");
}

function open_iconEditModal(iconId) {
    const icon = get_iconById(iconId);

    if (!icon) {
        console.error("Icon not found:", iconId);
        return;
    }

    editingIconId = iconId;
    reset_deleteTool();

    overlay_iconModal.removeClass("hidden");

    $("#iconModalTitle").text("Edit Icon");
    button_createIconConfirm.text("Save Changes");

    input_iconLabel.val(icon.name);
    input_iconLink.val(icon.url);
    input_textColor.val(icon.textColor);
    preview_textColor.css("background-color", icon.textColor);

    $("input[name='iconType'][value='" + icon.type + "']")
        .prop("checked", true)
        .trigger("change");

    if (icon.type === "image") {
        preview_iconImage
            .attr("src", icon.imgSrc)
            .removeClass("hidden");

        preview_iconShape.addClass("hidden");
    } else {
        select_shape.val(icon.shape);
        input_shapeColor.val(icon.shapeColor);
        preview_shapeColor.css("background-color", icon.shapeColor);

        preview_iconShape
            .attr("class", "iconShape " + icon.shape)
            .css("background-color", icon.shapeColor)
            .removeClass("hidden");

        preview_iconImage
            .attr("src", "")
            .addClass("hidden");
    }

    input_iconImageUpload.val("");
}

function action_on_createIconConfirm() {
    const label = input_iconLabel.val().trim();
    const link = input_iconLink.val().trim();
    const type = $("input[name='iconType']:checked").val();
    const imageFile = input_iconImageUpload[0].files[0];
    const shape = select_shape.val();
    const shapeColor = input_shapeColor.val();
    const textColor = input_textColor.val();

    if (!label) {
        alert("Please enter a label.");
        return;
    }

    if (!link) {
        alert("Please enter a link.");
        return;
    }

    const iconData = {
        name: label,
        url: normalize_url(link),
        type: type,
        shape: shape,
        shapeColor: shapeColor,
        textColor: textColor,
        imgSrc: ""
    };

    if (type === "image") {
        if (imageFile) {
            resizeImageToDataURL(imageFile, imageSize)
                .then(function(resizedDataURL) {
                    iconData.imgSrc = resizedDataURL;
                    save_iconCreateOrEdit(iconData);
                })
                .catch(function(error) {
                    console.error(error);
                    alert("There was a problem processing the image.");
                });

            return;
        }

        if (editingIconId !== null) {
            const existingIcon = get_iconById(editingIconId);

            if (existingIcon && existingIcon.type === "image" && existingIcon.imgSrc) {
                iconData.imgSrc = existingIcon.imgSrc;
                save_iconCreateOrEdit(iconData);
                return;
            }
        }

        alert("Please upload an image.");
        return;
    }

    save_iconCreateOrEdit(iconData);
}

function save_iconCreateOrEdit(iconData) {
    if (editingIconId === null) {
        add_iconToDashboard(iconData);
    } else {
        update_iconOnDashboard(editingIconId, iconData);
    }

    overlay_iconModal.addClass("hidden");
    clear_iconCreation();
}

// #endregion 


// #region Dashboard Icons

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

function get_iconById(iconId) {
    return icons.find(icon => icon.id === iconId) || null;
}

function update_iconOnDashboard(iconId, iconData) {
    const icon = get_iconById(iconId);

    if (!icon) {
        console.error("Could not update missing icon:", iconId);
        return;
    }

    icon.name = iconData.name;
    icon.url = iconData.url;
    icon.type = iconData.type;
    icon.shape = iconData.shape;
    icon.shapeColor = iconData.shapeColor;
    icon.textColor = iconData.textColor;
    icon.imgSrc = iconData.imgSrc;

    rerender_icon(iconId);
}

function rerender_icon(iconId) {
    const icon = get_iconById(iconId);
    const oldWrapper = document.querySelector('.iconWrapper[data-id="' + iconId + '"]');

    if (!icon || !oldWrapper) return;

    oldWrapper.remove();
    renderIcon(icon);
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
        const visualContainer = document.createElement("div");
        visualContainer.className = "iconVisual";

        visualContainer.appendChild(visual);

        wrapper.appendChild(visualContainer);
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
        if (iconWasDragged) {
            e.stopPropagation();
            return;
        }

        if (deleteMode) {
            $("#cursorTooltip").css("opacity", "0");
            wrapper.remove();

            const id = parseInt(wrapper.dataset.id);
            const index = icons.findIndex(iconObj => iconObj.id === id);

            if (index !== -1) {
                icons.splice(index, 1);
            }

            e.stopPropagation();
            return;
        }

        if (editMode) {
            const id = parseInt(wrapper.dataset.id);
            open_iconEditModal(id);

            $("#cursorTooltip").css("opacity", "0");

            e.stopPropagation();
            return;
        }
    });

    container_dashboard.append(wrapper);
    makeDraggable(wrapper);
}

function updateGridCells() {
    if (!isFullScreen) {
        gridCellx = 170;
        gridCelly = 170;
    } else {
        gridCellx = 170 * ((window.innerWidth + 200) / window.innerWidth);
        gridCelly = 170 * ((window.innerHeight + 100) / window.innerHeight);
    }
}

function makeDraggable(wrapper) {
    if (wrapper.dataset.draggableReady === "true") return;
    wrapper.dataset.draggableReady = "true";

    wrapper.addEventListener("mousedown", function(e) {
        if (!editMode || deleteMode) return;

        const startX = parseFloat(wrapper.style.left);
        const startY = parseFloat(wrapper.style.top);

        const offsetX = e.clientX;
        const offsetY = e.clientY;

        let movedDuringThisDrag = false;

        const iconId = parseInt(wrapper.dataset.id);
        const iconObj = icons.find(icon => icon.id === iconId);

        function action_on_mouseMove(e) {
            const mouseMoveX = Math.abs(e.clientX - offsetX);
            const mouseMoveY = Math.abs(e.clientY - offsetY);

            if (mouseMoveX > 3 || mouseMoveY > 3) {
                movedDuringThisDrag = true;
                iconWasDragged = true;
            }

            let x = startX + (e.clientX - offsetX);
            let y = startY + (e.clientY - offsetY);
            
            if (gridSnap){
                for (let i = xDashboardMin; i<xDashboardMax; i+=gridCellx ){
                    if (
                        (x > i - gridCellx / 2) && 
                        (x < i + gridCellx / 2)   
                    ) {
                        x = i;
                    }
                    
                for (let i = yDashboardMin; i<yDashboardMax; i+=gridCelly ){
                    if (
                        (y > i - gridCelly / 2) && 
                        (y < i + gridCelly / 2)   
                    ) {
                        y = i;
                    }
                }
                }
            }
            if (x < xDashboardMin) x = xDashboardMin;
            if (x > xDashboardMax) x = xDashboardMax;
            if (y < yDashboardMin) y = yDashboardMin;
            if (y > yDashboardMax) y = yDashboardMax;

            wrapper.style.left = x + "px";
            wrapper.style.top = y + "px";

            if (iconObj) {
                iconObj.x = x;
                iconObj.y = y;
            }
        }

        function action_on_mouseUp() {
            document.removeEventListener("mousemove", action_on_mouseMove);
            document.removeEventListener("mouseup", action_on_mouseUp);

            if (movedDuringThisDrag) {
                setTimeout(function() {
                    iconWasDragged = false;
                }, 150);
            }
        }

        document.addEventListener("mousemove", action_on_mouseMove);
        document.addEventListener("mouseup", action_on_mouseUp);

        e.preventDefault();
    });
}

function switchMode() {
    const wrappers = document.querySelectorAll("#dashboard .iconWrapper");

    wrappers.forEach(wrapper => {
        const link = wrapper.querySelector("a");
        const iconId = parseInt(wrapper.dataset.id);
        const iconObj = icons.find(icon => icon.id === iconId);

        if (editMode) {
            if (link) {
                while (link.firstChild) {
                    wrapper.appendChild(link.firstChild);
                }

                link.remove();
            }

            makeDraggable(wrapper);
        } else {
            if (!link) {
                const a = document.createElement("a");
                a.href = iconObj.url;
                a.target = "_blank";
                a.className = "iconLink";

                while (wrapper.firstChild) {
                    a.appendChild(wrapper.firstChild);
                }

                wrapper.appendChild(a);
            }
        }
    });

    update_buttons();
}

function clearBoard() {
    container_dashboard.empty();
    icons.length = 0;
    iconCount = 0;
}

function save_currentDashboard_layout() {
    const iconString = JSON.stringify(icons);
    const bgColor = input_bgColor.val();

    localStorage.setItem("dashboardIcons", iconString);
    localStorage.setItem("dashboardBgColor", bgColor);

    console.log(icons);
}

function load_previousDashboard_layout() {
    const savedBackgroundColor = localStorage.getItem("dashboardBgColor");

    if (savedBackgroundColor) {
        container_dashboard.css("background-color", savedBackgroundColor);
        button_bgColor.css("background-color", savedBackgroundColor);
        input_bgColor.val(savedBackgroundColor);
    }

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

// #endregion

// #region Fullscreen

function showFullscreenText() {
    const text = editMode ? "Edit Mode" : "Active Mode";

    text_fullscreenMode.text(text);

    text_fullscreenMode.removeClass("showFullscreenText");
    void text_fullscreenMode[0].offsetWidth;
    text_fullscreenMode.addClass("showFullscreenText");

    if (editMode) {
        text_fullscreenMode.css("background-color", "#ffe066");
    } else {
        text_fullscreenMode.css("background-color", "#7ee081");
    }
}

function getDashboardBounds(fullscreenMode) {
    if (fullscreenMode) {
        return {
            xMin: 0,
            yMin: -20,
            xMax: window.innerWidth - 200,
            yMax: window.innerHeight - 190
        };
    }

    return {
        xMin: 190,
        yMin: 80,
        xMax: window.innerWidth - 200,
        yMax: window.innerHeight - 190
    };
}

function moveIconValue(value, oldMin, oldMax, newMin, newMax) {
    const oldRange = oldMax - oldMin;
    const newRange = newMax - newMin;

    if (oldRange === 0) return newMin;

    let percent = (value - oldMin) / oldRange;

    if (percent < 0) percent = 0;
    if (percent > 1) percent = 1;

    return newMin + (percent * newRange);
}

function moveIconsBetweenModes(oldFullscreenMode, newFullscreenMode) {
    const oldBounds = getDashboardBounds(oldFullscreenMode);
    const newBounds = getDashboardBounds(newFullscreenMode);

    document.querySelectorAll(".iconWrapper").forEach(function(wrapper) {
        let x = parseFloat(wrapper.style.left);
        let y = parseFloat(wrapper.style.top);

        x = moveIconValue(x, oldBounds.xMin, oldBounds.xMax, newBounds.xMin, newBounds.xMax);
        y = moveIconValue(y, oldBounds.yMin, oldBounds.yMax, newBounds.yMin, newBounds.yMax);

        wrapper.style.left = x + "px";
        wrapper.style.top = y + "px";

        const id = parseInt(wrapper.dataset.id);
        const iconObj = icons.find(icon => icon.id === id);

        if (iconObj) {
            iconObj.x = x;
            iconObj.y = y;
        }
    });
}

function fullScreenFunction() {
    const oldFullscreenMode = !isFullScreen;
    const newFullscreenMode = isFullScreen;

    moveIconsBetweenModes(oldFullscreenMode, newFullscreenMode);

    if (isFullScreen) {
        button_fullscreen.addClass("fullScreened");
        button_fullscreen.removeClass("windowed");

        showFullscreenText();

        if (editMode) {
            button_fullscreen.text("(Edit Mode) Window");
        } else {
            button_fullscreen.text("(Active Mode) Window");
        }

        container_topBar.addClass("hidden");
        container_sidebar.addClass("hidden");
        container_externalButtons.addClass("hidden");
        $("#tooltipButton").addClass("hidden");

        container_fullDashboard.height(window.innerHeight + "px");
        container_fullDashboard.width(window.innerWidth + "px");

    } else {
        button_fullscreen.addClass("windowed");
        button_fullscreen.removeClass("fullScreened");

        button_fullscreen.text("Fullscreen");

        container_topBar.removeClass("hidden");
        container_sidebar.removeClass("hidden");
        container_externalButtons.removeClass("hidden");
        $("#tooltipButton").removeClass("hidden");

        container_fullDashboard.height((window.innerHeight - 100) + "px");
        container_fullDashboard.width(window.innerWidth + "px");
    }

    setFullHeight();
}

function setFullHeight() {
    if (isFullScreen) {
        container_fullDashboard.height(window.innerHeight + "px");
        container_fullDashboard.width(window.innerWidth + "px");

        xDashboardMin = 0;
        yDashboardMin = -20;
        xDashboardMax = window.innerWidth - 200;
        yDashboardMax = window.innerHeight - 190;
    } else {
        container_fullDashboard.height((window.innerHeight - 100) + "px");
        container_fullDashboard.width(window.innerWidth + "px");

        xDashboardMin = 190;
        yDashboardMin = 80;
        xDashboardMax = window.innerWidth - 200;
        yDashboardMax = window.innerHeight - 190;
    }
}

// #endregion


// #region Utility Functions

function normalize_url(url) {
    url = url.trim();

    if (!url.startsWith("http://") && !url.startsWith("https://")) {
        url = "https://" + url;
    }

    const domain = url.replace(/^https?:\/\//, "").split("/")[0];

    if (!domain.includes(".")) {
        url = url.replace(domain, domain + ".com");
    }

    return url;
}

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

                const aspect = img.width / img.height;

                let drawWidth;
                let drawHeight;

                if (aspect > 1) {
                    drawWidth = size;
                    drawHeight = size / aspect;
                } else {
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

// #endregion


// #region Global Modal Closing

function setup_globalCloseControls() {
    $(".overlay").on("click", action_on_overlayClick);
    $(".modal").on("click", action_on_modalClick);
    $(document).on("keydown", action_on_keyDown);
}

function action_on_overlayClick(e) {
    if (e.target === this) {
        $(this).addClass("hidden");
        clear_iconCreation();
    }
}

function action_on_modalClick(e) {
    e.stopPropagation();
}

function action_on_keyDown(e) {
    if (e.key === "Escape") {
        reset_deleteTool();

        $(".overlay").addClass("hidden");
        clear_iconCreation();
    }
}

// #endregion