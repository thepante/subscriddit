let storage = chrome.storage.local;

let element = {
  get(item){
    return document.querySelector("#"+item).value
  },
  set(item, value){
    document.querySelector("#"+item).value = value;
  }
}

function saveOptions(e) {
  storage.set({
    serverAddress: element.get("serverAddress")
  });
  bg.postMessage({load_prefs: "!"});
}

function restoreOptions() {
  storage.get(null, function(options) {
    if (options.serverAddress){
      element.set("serverAddress", options.serverAddress);
    }
  });
}

let bg = chrome.runtime.connect({name:"options"});

document.addEventListener("DOMContentLoaded", restoreOptions);
document.querySelector("form").addEventListener("submit", saveOptions);
