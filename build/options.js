var storage = chrome.storage.local;

var element = {
  get(item){
    return document.querySelector("#"+item).value
  },
  set(item, value){
    document.querySelector("#"+item).value = value;
  }
}

function saveOptions(e) {
  storage.set({
      prioHigh: {age: element.get("h"), poll: element.get("hi")},
    prioMedium: {age: element.get("m"), poll: element.get("mi")},
       prioLow: {age: element.get("l"), poll: element.get("li")},
      forgetHs: element.get("forgetHs"),
 });

  bg.postMessage({load_prefs: "!"});
}

function restoreOptions() {
  storage.get(null, function(options) {
    // bg.postMessage({greeting: options});

    // high prio
    element.set("h", options.prioHigh.age);
    element.set("hi", options.prioHigh.poll);

    // medium prio
    element.set("m", options.prioMedium.age);
    element.set("mi", options.prioMedium.poll);

    // low prio
    element.set("l", options.prioLow.age);
    element.set("li", options.prioLow.poll);

    // rest
    element.set("forgetHs", options.forgetHs);

 });

 // make background load updated settings
 bg.postMessage({load_prefs: "!"});

}

var bg = chrome.runtime.connect({name:"options"});
bg.postMessage({greeting: "--- options loaded!"});

document.addEventListener("DOMContentLoaded", restoreOptions);
document.querySelector("form").addEventListener("submit", saveOptions);
restoreOptions();

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