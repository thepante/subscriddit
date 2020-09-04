import $ from "jquery";

// Connect to background
var bg = chrome.runtime.connect({name:"port-from-cs"});

var post = {
	data: {},
	scrape() {
		const capitalize = (s) => {
			if (typeof s !== 'string') return '';
			return s.charAt(0).toUpperCase() + s.slice(1);
    }
    try {
      let sel1 = document.querySelector('div._1UoeAeSRhOKSNdY_h3iS1O > span:nth-child(2)');
      let sel2 = document.querySelector('div._3-miAEojrCvx_4FQ8x3P-s:nth-child(1) > a:nth-child(1) > span:nth-child(2)');
      let sel3 = document.querySelector('._3P3ghhoNky7Bzspbfw7--R > a:nth-child(1) > span:nth-child(2)');
      // let num_comments = document.querySelector('div._1UoeAeSRhOKSNdY_h3iS1O > span:nth-child(2)').textContent.match(/\d+/)[0];
      let commentsDiv = (sel1) ? sel1 : (sel2) ? sel2 : sel3;
      let numComments = commentsDiv.textContent.match(/\d+/)[0];
      let uriData = document.baseURI.match("\/(r\/.*)\/comments\/(.{6})\/(.*)\/");
      let title = uriData[3].replace(/_/g, " ");
      title = decodeURI(capitalize(title));

      this.data['id'] = uriData[2];
      this.data['num_comments'] = parseInt(numComments);
      this.data['sub'] = uriData[1];
      this.data['title'] = title;
      this.data['checked'] =  Date.now();
    }
    catch (error) {
      console.log(error);
      post.scrape();
    }
    finally {
      return this.data;
    }
	}
}

var button = {
	status: Boolean,

	get label() {
		var labels = {};
		if (this.status) {
			labels = {
        text: "Unsubscribe",
        popup: "Removed",
      }
		} else {
			labels = {
        text: "Subscribe",
        popup: "Added",
      }
    }
		return labels;
	},

	set(status) {
		// console.log("🡺", this.status)
		this.status = status;
	},

	clicked() {
		if (this.status) {
			bg.postMessage({remove: post.data.id});
			console.log(button.label.popup, post.data.id);
		}
		else {
			bg.postMessage({add: post.data})
			console.log(button.label.popup, post.data);
		}
		showStatePopup();
	},

	create() {
		let btn = document.createElement("div");
		btn.innerHTML = `
				<button id="subtothread" class="kU8ebCMnbXfjCWfqn0WPb">
						<i class="icon icon-live xwmljjCrovDE5C9MasZja _1GQDWqbF-wkYWbrpmOvjqJ"></i>
						<span class="_6_44iTtZoeY6_XChKt5b0">${this.label.text}</span>
				</button>
		`;
		let buttonsb = document.querySelector('*[data-test-id="post-content"] ._3-miAEojrCvx_4FQ8x3P-s');

		buttonsb.appendChild(btn);

		// Button event handler
		btn.addEventListener("click", function() {
			button.clicked();
		});
	}

}


// Status change notification popup
function showStatePopup() {

	// delete (if) previous one & add new
	let button_div = "#rthreads-state";
	$(button_div).remove();
	$("body").append(`
	<div id="rthreads-state">
		<div class="rthreads-container">
			<span>${button.label.popup} subscription to thread</span>
		</div>
	</div>
	`);
	// auto hide after some seconds
	$(button_div).delay(3000).fadeOut(100);
}


// Check the url if this is a submission then send to background
function detectPost() {
	if (document.baseURI.includes('/comments/')) {
		console.log("Submission opened");

		// collect submission data
		let submission = post.scrape();
    console.log(submission);
    while(submission.id === undefined) {
      console.log("waiting for scrape...")
    }
		// notify app requesting subscription status
    bg.postMessage({status: submission.id});
	}
}

// Observe for changes in the body style attribute
var target = document.body;
var lastVisistedURL = undefined;

var observer = new MutationObserver(function(mutations) {
	// console.log("mutations!!")
	// console.log(last_url_visited)
	// console.log(document.baseURI)

	// Call post_detection only if URL has changed
	// otherwise this will call for a post detection when for example: clicking report button
	if (document.baseURI != lastVisistedURL) {
		lastVisistedURL = document.baseURI;
		detectPost();
	}
});

var config = { attributes: true, childList: false, characterData: true };
observer.observe(target, config);


function gotStatus(receivedStatus) {
	button.set(receivedStatus);

	// if button its already displayed: update text
	let buttonDiv = document.querySelector("#subtothread > span");
	if (buttonDiv != undefined) {
		buttonDiv.innerHTML = button.label.text;
	}
	// if button didn't exists
	else {
		// let upvote_div = document.querySelector(".icon-upvote");
		// $(upvote_div).ready(function() {
			button.create();
		// });
	}
	document.activeElement.blur();
}


// Listen to background
chrome.runtime.onMessage.addListener( (response, sender, sendResponse) => {
	console.log("Received 🡺", response);

	// If received subscription status message
	if (response.status != undefined) {
		gotStatus(response.status);
	}

	if (response.subscriptions) {
		console.log(response.subscriptions) // TODO
	}

	// TODO receive and handle list of subscriptions
});


window.addEventListener('keydown', function(event) {
	const key = event.key;

	// keyboard shortcut
	if (key == 'OS') {
		button.clicked();
	}

	//! for debugging mainly
	else if (key == 'ArrowLeft') {
		bg.postMessage({status: post.data.id})
	}
	else if (key == 'ArrowRight') {
		bg.postMessage({subscriptions: 100})
	}

	// console.log(key)
});


// When loaded check if its a submission
detectPost();
