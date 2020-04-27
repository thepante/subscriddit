var storage = chrome.storage.local;

function saveOptions(e) {
  storage.set({
     h: document.querySelector("#h").value,
    hi: document.querySelector("#hi").value,
     m: document.querySelector("#m").value,
    mi: document.querySelector("#mi").value,
     l: document.querySelector("#l").value,
    li: document.querySelector("#li").value,
  });

  bg.postMessage({load_prefs: "!"});
}

function restoreOptions() {
  storage.get(null, function(items) {
    for (key in items) {
      if (key == 'color'){
        console.log(key, "is present");
      }
      else if (items[key] != undefined){

        console.log(key, items[key]);
        var id = '#'+key;
        document.querySelector(id).value = items[key];

      }
    }
 });

 bg.postMessage({load_prefs: "!"});

}

document.addEventListener("DOMContentLoaded", restoreOptions);
document.querySelector("form").addEventListener("submit", saveOptions);

var bg = chrome.runtime.connect({name:"options"});
bg.postMessage({greeting: "--- options loaded!"});

// Restricts input for the given textbox to the given inputFilter function.
// From https://stackoverflow.com/a/469362/11003517
function setInputFilter(textbox, inputFilter) {
  ["input", "keydown", "keyup", "mousedown", "mouseup", "select", "contextmenu", "drop"].forEach(function(event) {
    textbox.addEventListener(event, function() {
      if (inputFilter(this.value)) {
        this.oldValue = this.value;
        this.oldSelectionStart = this.selectionStart;
        this.oldSelectionEnd = this.selectionEnd;
      } else if (this.hasOwnProperty("oldValue")) {
        this.value = this.oldValue;
        this.setSelectionRange(this.oldSelectionStart, this.oldSelectionEnd);
      } else {
        this.value = "";
      }
    });
  });
}

setInputFilter(document.getElementById("input"), function(value) {
  return /^-?\d*[.,]?\d*$/.test(value) && (value === "" || parseInt(value) <= 3600); 
});