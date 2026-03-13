 "use strict";
 
let editMode = true;
let icons = {};
let trashExists = true;

 $("#editMode").on("click", function () {
    editMode = true;
 })

 $("#activeMode").on("click", function () {
    editMode = false;
 })

  $("#trashCanBol").on("click", function () {
    trashExists = !trashExists;
 })
 
