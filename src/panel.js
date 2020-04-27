var bg = chrome.runtime.connect({name:"port-from-panel"});
bg.postMessage({greeting: "--- panel popup opened"});

// bg.postMessage({getlist: "!"});


bg.postMessage({getlist: "!"}, (response) => {
  let div = document.getElementById("list-threads");
  let btn = document.createElement("div");
  btn.innerHTML = `<li>${response.getlist}</li>`;
  div.appendChild(btn);
});

