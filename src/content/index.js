import { format } from 'timeago.js';
import $ from "jquery";

// Communicate with background
var bg = chrome.runtime.connect({name:"port-from-cs"});
bg.postMessage({greeting: "--- Reddit page loaded"});

var div = document.getElementsByClassName("_3-miAEojrCvx_4FQ8x3P-s")[0];
var button = document.getElementById("subtothread");
var post = {};

// Listen messages from background
bg.onMessage.addListener(async function(m) {

	// FOR TESTING
	if (m.scan) {
		check_apply();
	}

	// Receive subscription status
	if (m.check) {
		let msg = "Background notifies status as:";

		// setting status this way because idk why but can't pass this boolean
		// so workaround is passing it as string and convert
		subscription.status = (m.check == 'true');
		console.log(msg, m.check);
	}
	
	// Let background call the button when data is ready
	if (m.button) {	
		put_button();
	}

	// Get parsed data from back
	if (m.post) {
		post = m.post;
		console.log("Got parsed data from background js", post._id);
		// console.log(post);
	}

});

// Clean previous button if addon its reloaded
async function clean_prev_button(){
	if (button){
		button.parentNode.removeChild(button);
		console.log("Removed previous button...");
	}
}
clean_prev_button();

// For debbuging popup notice
// has to keep to erase previous one when reload extension
if (document.getElementById("rthreads-state")){
  $("#rthreads-state").remove();
  console.log("borrado rthreads-state popup");
}

// Identify subscription status
let subscription = {
	stat: undefined,
	get status() {
		return this.stat;
	},
	set status(now) {
		this.stat = now;
	},
	get label() {
		let text = {};
		if (this.status) {
			text = {
				// when is subscribed
				button: "Unsubscribe",
				debug: "Subbed to",
				popup: "Added"
			};
		} 
		else {
			text = {
				// when isn't subscribed
				button: "Subscribe",
				debug: "Unsubbed from",
				popup: "Removed"
			}
		}
		return text;
	}
}


// Update subscription status
function change_status() {
	subscription.status = !subscription.status;

	let btn = document.getElementById("subtothread");
	let text = btn.getElementsByTagName("span")[0];
	text.innerHTML = subscription.label.button;
}

// Call button insert
async function put_button(){

	await clean_prev_button();
	$(div).ready(function() {
		button_sub();
	});
	console.log(`subscription.status is set to ${subscription.status}`);
}

// Create and append button
function button_sub() {
	let btn = document.createElement("div");
	btn.innerHTML = `
			<button id="subtothread" class="kU8ebCMnbXfjCWfqn0WPb">
					<i class="icon icon-live xwmljjCrovDE5C9MasZja _1GQDWqbF-wkYWbrpmOvjqJ"></i>
					<span class="_6_44iTtZoeY6_XChKt5b0">${subscription.label.button}</span>
			</button>
	`;
	let buttonsb = document.querySelector('*[data-test-id="post-content"] ._3-miAEojrCvx_4FQ8x3P-s');

		buttonsb.appendChild(btn);

	// Button event handler
	btn.addEventListener("click", function() {
		button_action();
	});
}

// Button action when its pressed
async function button_action() {

	if (subscription.status) { 
		await remove_subscription();	
	} 
	else { 
		await add_subscription(); 
	}

	change_status();
	document.activeElement.blur();
	state_change_popup();

	// print status change
	console.log(`${subscription.label.popup}: ${post._id} from ${post.sub} subscribed ${format(post.time)}`);
	
}

// Create a new subscription
async function add_subscription() {
	post["time"] = Date.now();
	await bg.postMessage({add: post});
	console.log("SUBBED!");

}

// Delete subscription
async function remove_subscription() {

	await bg.postMessage({remove: post});
	console.log("UNSUBBED!");

}

// State notification popup
function state_change_popup() {

	// delete (if) previous one & add new
	let button = "#rthreads-state";
	$(button).remove(); 
	$("body").append(`
	<div id="rthreads-state">
		<div class="rthreads-container">
			<span>${subscription.label.popup} subscription to thread</span>
		</div>
	</div>
	`);
	// auto hide after some seconds
	$(button).delay(3000).fadeOut(100);
}

// Check the url if this is a submission then send to background
function post_detection(){
	if (document.baseURI.includes('/comments/')) {
		console.log("POST");
		let regex = /\?(.*)$/;
		bg.postMessage({scan: document.baseURI.replace(regex, "")});
	}
}

// Observe for changes in the body style attribute
var target = document.body;
 
var observer = new MutationObserver(function(mutations) {
  mutations.forEach(async function(mutation) {
		post_detection();
  });
});

var config = { attributes: true, childList: false, characterData: true };
observer.observe(target, config);

post_detection();

console.log("-------");
console.log("OK - Loaded correctly");
