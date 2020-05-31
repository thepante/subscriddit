import { format } from 'timeago.js';
import $ from "jquery";

// Communicate with background
var bg = chrome.runtime.connect({name:"port-from-cs"});

var div = document.getElementsByClassName("_3-miAEojrCvx_4FQ8x3P-s")[0];
var button = document.getElementById("subtothread");
var post = {};
var last_url_checked = document.baseURI;

// Listen messages from background
bg.onMessage.addListener(async function(m) {

	// FOR TESTING
	if (m.scan) {
		check_apply();
	}
	
	// When receive parsed data from back
	if (m.post) {
		post = m.post;
		console.log("Got parsed data from background js for thread", post._id);

		if (m.post.subscribed !== undefined) {
			subscription_button.subscribed = true;
		} else {
			subscription_button.subscribed = false;
		}

		console.log("Background notifies status as:", subscription_button.subscribed, m.post.subscribed);
		put_button();
	}

});


var subscription_button = {
	subscribed: undefined,

	get label() {
		let text = {};
		if (this.subscribed) {
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
	},

	// Update subscription status
	change_status() {
		this.subscribed = !this.subscribed;

		let btn = document.getElementById("subtothread");
		let text = btn.getElementsByTagName("span")[0];
		text.textContent = this.label.button;
	},

	// Create and append button
	append() {
		let btn = document.createElement("div");
		btn.innerHTML = `
				<button id="subtothread" class="kU8ebCMnbXfjCWfqn0WPb">
						<i class="icon icon-live xwmljjCrovDE5C9MasZja _1GQDWqbF-wkYWbrpmOvjqJ"></i>
						<span class="_6_44iTtZoeY6_XChKt5b0">${this.label.button}</span>
				</button>
		`;
		let buttonsb = document.querySelector('*[data-test-id="post-content"] ._3-miAEojrCvx_4FQ8x3P-s');

		buttonsb.appendChild(btn);

		// Button event handler
		btn.addEventListener("click", function() {
			subscription_button.clicked();
		});
	},

	// Button action when its pressed
	async clicked() {

		if (this.subscribed) { await subscription.remove() } 
		else { await subscription.add() }

		this.change_status();
		document.activeElement.blur();
		popup_show_state();

		// print status change
		console.log(`${this.label.popup}: ${post._id} from ${post.sub} subscribed ${format(post.subscribed)}`);
		
	}

}

var subscription = {
	// Create a new subscription
	async add() {
		post["subscribed"] = Date.now();
		await bg.postMessage({add: post});
		console.log("SUBBED!");
	},

	// Delete subscription
	async remove() {
		await bg.postMessage({remove: post});
		console.log("UNSUBBED!");
	}
}


// For debbuging popup notice
// has to keep to erase previous one when reload extension
if (document.getElementById("rthreads-state")){
  $("#rthreads-state").remove();
  console.log("borrado rthreads-state popup");
}

// Call button insert
async function put_button(){
	// Double check to not add multiples buttons
	if (button == null){
		$(div).ready(function() {
			subscription_button.append();
		});
	}

	// console.log(`subscription_button.subscribed is set to ${subscription_button.subscribed}`);
}

// State notification popup
function popup_show_state() {

	// delete (if) previous one & add new
	let button = "#rthreads-state";
	$(button).remove(); 
	$("body").append(`
	<div id="rthreads-state">
		<div class="rthreads-container">
			<span>${subscription_button.label.popup} subscription to thread</span>
		</div>
	</div>
	`);
	// auto hide after some seconds
	$(button).delay(3000).fadeOut(100);
}

// Check the url if this is a submission then send to background
function post_detection(){
	if (document.baseURI.includes('/comments/')) {
		console.log("Submission opened");
		let regex = /\?(.*)$/;
		bg.postMessage({scan: document.baseURI.replace(regex, "")});
	}
}

// Observe for changes in the body style attribute
var target = document.body;
 
var observer = new MutationObserver(function(mutations) {
  mutations.forEach(async function(mutation) {
		// Ensures to call post_detection only if URL changed
		// otherwise this will call for a post detection when for example: clicking report button
		if (document.baseURI != last_url_checked) {
			post_detection();
			last_url_checked = document.baseURI;
		}
  });
});

var config = { attributes: true, childList: false, characterData: true };
observer.observe(target, config);


// Notify background for debugging
bg.postMessage({greeting: "--- Reddit page loaded " + document.baseURI});

// When loaded check if its a submission
post_detection();


console.log("-------");
console.log("OK - Loaded correctly");
