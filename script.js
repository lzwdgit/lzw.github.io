const API = "https://www.gstatic.com/android/keyboard/emojikitchen/";

const loadSection = document.getElementById("load-section");
loadSection.progress = document.getElementById("load-progress");
loadSection.text = document.getElementById("load-text");

const mainSection = document.getElementById("main-section");
const information = document.getElementById("information");
const output = document.getElementById("output");
output.container = document.getElementById("emoji-display")
const errorDisplay = document.getElementById("sad-turtle");

const donationPopup = document.getElementById("donation-popup");
const settingsPopup = document.getElementById("settings-popup");

const soundSetting = document.getElementById("sound-checkbox");
const vibrationSetting = document.getElementById("vibration-checkbox");

document.getElementById("site-description").remove();

soundSetting.checked = (localStorage.getItem("emojimixSoundOn") || "true") == "true";
vibrationSetting.checked = (localStorage.getItem("emojimixVibrationOn") || "true") == "true";

output.onanimationend = event => {
	event.target.hidden = event.target.classList.contains("hiding");
	event.target.classList.remove("hiding");
};
information.onanimationend = output.onanimationend;

output.oncontextmenu = event => event.preventDefault();

const searchBar = document.getElementById("search-bar");
const searchBox = document.getElementById("search-box");

const slider1 = document.getElementById("slider1");
const slider2 = document.getElementById("slider2");

slider1.randomButton = document.getElementById("random1");
slider2.randomButton = document.getElementById("random2");

slider1.goTo = index => slider1.scrollTo(0, index * elHeight);
slider2.goTo = index => slider2.scrollTo(0, index * elHeight);

slider1.random = manual => {
	if(shuffling == 2) shuffling = 3;
	if(manual && (shuffling == 1 || (slider1.randomButton.classList.contains("active") && manual))) return stopShuffling();
	if(shuffling == 0) shuffling = 1;
	slider1.randomButton.classList.add("active");
	slider1.goTo(Math.floor(Math.random() * emojis.length));
}

slider2.random = manual => {
	if(manual && (shuffling == 2 || slider2.randomButton.classList.contains("active"))) return stopShuffling();
	if(shuffling == 1) shuffling = 3;
	if(shuffling == 0) shuffling = 2;
	slider2.randomButton.classList.add("active");
	slider2.goTo(Math.floor(Math.random() * emojis.length));
}

const codePointsToEmoji = codepoints => codepoints.reduce((p, c) => p + String.fromCodePoint(c), "");

var shuffling = 0;
output.onload = () => {
	stopShuffling();
	output.classList.remove("hiding");
	output.hidden = false;
	setTimeout(advertise, 250);
};

var shuffled = false;

const advertise = () => {
	let counter = (+localStorage.getItem("emojimixSuccessCounter")) + 1 || 0;
	if(counter <= 2) showMessage("Tap here to shuffle");
	//if(counter == 10) {
	//	if(confirm("\n\n,")) {
	//		document.location.href = "./projects";
	//	}
	//} else if(counter == 30) {
	//	if(confirm("Do you have any feedback to share about emojimix?\n\I would love to hear it. Click \"OK\" to share now.")) {
	//		document.location.href = "./feedback";
	//	}
	//}
	localStorage.setItem("emojimixSuccessCounter", counter);
}

const shuffleSliders = () => {
	navigator.vibrate && vibrationSetting.checked && navigator.vibrate([20, 20, 20]);
	shuffling = 3;
	slider1.random();
	slider2.random();
};

const stopShuffling = () => {
	document.querySelectorAll(".button.random").forEach(button => button.classList.remove("active"));
	shuffling = 0;
	slider1.scrollTop = slider1.scrollTop;
	slider2.scrollTop = slider2.scrollTop;
};

output.container.onclick = () => {
	if(!searchBar.hidden) return searchBox.close();
	output.classList.add("hiding");
	shuffled = true;
	shuffleSliders();
};

const createURL = (emoji1, emoji2) => {
	let u1 = emoji1[0].map(c => "u" + c.toString(16)).join("-");
	let u2 = emoji2[0].map(c => "u" + c.toString(16)).join("-");
	let url = `./${codePointsToEmoji(emoji1[0])}+${codePointsToEmoji(emoji2[0])}`;
	history.replaceState(undefined, "", url);
	return `${API}${emoji1[2]}/${u1}/${u1}_${u2}.png`;
};

const mixEmojis = (emoji1, emoji2) => {
	output.onerror = error => {
		output.src = createURL(emoji2, emoji1);
		output.onerror = () => {
			if(shuffling == 0 || !navigator.onLine) {
				output.hidden = true;
				errorDisplay.hidden = false;
				navigator.vibrate && vibrationSetting.checked && navigator.vibrate([50, 50, 200]);
			} else {
				if(shuffling == 1 || shuffling == 3) slider1.random(false);
				if(shuffling == 2 || shuffling == 3) slider2.random(false);
			}
		};
	};
	output.src = createURL(emoji1, emoji2);
}

var audio;
if(typeof AudioContext != "undefined") {
	audio = new AudioContext();
	audio.gainNode = audio.createGain();
	audio.gainNode.gain.value = 0.5;
	audio.gainNode.connect(audio.destination);
}

const beep = (hz, ms, type="sine") => {
	if(!audio) return;
	let oscillator = audio.createOscillator();
	oscillator.type = type;
	oscillator.frequency.value = hz;
	oscillator.connect(audio.gainNode);
	oscillator.start();
	oscillator.stop(audio.currentTime + ms/1000);
}

const getEmojis = () => {
	let emoji1 = emojis[Math.round(slider1.scrollTop / elHeight)];
	let emoji2 = emojis[Math.round(slider2.scrollTop / elHeight)];
	errorDisplay.hidden = true;
	output.classList.add("hiding");
	mixEmojis(emoji1, emoji2);
}

var scrollTimeout, elHeight, lastScrollPosition, vibrationTracker;
const scroll = event => {
	if(shuffling) {
		searchBox.close();
	} else if(searchBar.hidden) {
		if((lastScrollPosition < event.target.scrollTop && vibrationTracker > Math.round(event.target.scrollTop % elHeight)) || (lastScrollPosition > event.target.scrollTop && vibrationTracker < Math.round(event.target.scrollTop % elHeight))) {
			navigator.vibrate && vibrationSetting.checked && navigator.vibrate(10);
			soundSetting.checked && beep(1e3, 1);
		}
		vibrationTracker = Math.round(event.target.scrollTop % elHeight);
		lastScrollPosition = event.target.scrollTop;
	}
	clearTimeout(scrollTimeout);
	scrollTimeout = setTimeout(getEmojis, 500);
};

document.onresize = () => elHeight = slider1.children[1].getBoundingClientRect().height;

slider1.onscroll = scroll;
slider2.onscroll = scroll;

if(navigator.maxTouchPoints == 0) {
	let sliderDragStart = event => {
		event.target.style.cursor = "grabbing";
		event.target.dragStart = event.clientY;
		event.target.scrollStart = event.target.scrollTop;
	};

	let sliderDragMove = event => {
		if(event.target.style.cursor != "grabbing") return;
		event.target.scrollTop = event.target.scrollStart - 2 * (event.clientY - event.target.dragStart);
	};

	let sliderDragEnd = event => {
		event.target.style.cursor = "grab";
	};

	slider1.onmousedown = sliderDragStart;
	slider1.onmousemove = sliderDragMove;
	slider1.onmouseup = sliderDragEnd;
	slider1.onmouseout = sliderDragEnd;

	slider2.onmousedown = sliderDragStart;
	slider2.onmousemove = sliderDragMove;
	slider2.onmouseup = sliderDragEnd;
	slider2.onmouseout = sliderDragEnd;
} else {
	slider1.style.cursor = "not-allowed";
	slider2.style.cursor = "not-allowed";
}

searchButtonClick = (event, slider) => {
	if(event.target.classList.contains("active")) {
		searchBox.close()
	} else {
		searchBox.close();
		searchBox.open(slider);
	}
};

searchBox.open = slider => {
	stopShuffling();
	document.getElementById(`search${slider}`).classList.add("active");
	searchBar.hidden = false;
	searchBox.slider = slider;
	searchBox.value = "";
	searchBox.focus();
};

searchBox.close = () => {
	document.querySelectorAll(".button.search").forEach(button => button.classList.remove("active"));
	searchBar.hidden = true;
}

searchBox.jump = by => {
	if(searchBox.array.length == 0) return;
	//searchBox.focus();
	searchBox.current += by;
	if(searchBox.current > searchBox.array.length - 1) searchBox.current = 0;
	if(searchBox.current < 0) searchBox.current = searchBox.array.length - 1;
	(searchBox.slider == 1 ? slider1 : slider2).goTo(searchBox.array[searchBox.current]);
};

searchBox.onkeyup = event => {
	if(event.key == "Enter") {
		if(!searchBox.array) return;
		searchBox.jump(1);
	} else {
		searchBox.array = [];
		emojis.forEach((emoji, index) => {
			if(emoji[1].includes(searchBox.value.toLowerCase())) {
				searchBox.array.push(index);
			}
		});
		searchBox.current = -1;
		searchBox.jump(1);
	}
};


const showMessage = message => {
	clearTimeout(information.timeout);
	information.innerText = message;
	information.hidden = false;
	information.timeout = setTimeout(() => {
		information.classList.add("hiding");
	}, 1500);
};

const imageToBlob = async () => {
	let response = await fetch(`./${output.src}`, {headers: {"x-v": 1}});
	let arrayBuffer = await response.arrayBuffer();
	return new Blob([arrayBuffer], {type: "image/png"});
};

const triggerDownload = event => {
	event.preventDefault();
	if(confirm("下载图像而不是复制?")) downloadImage();
}

const downloadImage = async () => {
	let a = document.createElement("a");
	a.href = URL.createObjectURL(await imageToBlob());
	a.download = "emojimix.png";
	a.click();
	//URL.revokeObjectURL(a.href);
};

const copyImage = async () => {
	if(output.hidden) return;
	if(!navigator.clipboard || typeof ClipboardItem == "undefined") {
		showMessage("您的浏览器不支持复制图像,所以正在下载");
		return setTimeout(downloadImage, 1000);
	}
	try {
		showMessage("拷贝中");
		let clipboardData = new ClipboardItem({"image/png": await imageToBlob()});
		await navigator.clipboard.write([clipboardData]);
		showMessage("拷贝成功！");
	} catch(error) {
		if(navigator.userAgent.includes("Instagram")) showMessage("在浏览器上打开");
		else {
			showMessage("复制图像时出错，所以正在下载");
			return setTimeout(downloadImage, 1000);
		}
	}
};

const copyLink = async () => {
	if(!navigator.clipboard) {
		if(navigator.userAgent.includes("Instagram")) showMessage("在浏览器上打开");
		else showMessage("您的浏览器不支持复制");
		return;
	}
	try {
		await navigator.clipboard.writeText(decodeURI(document.location.href));
		showMessage("链接已复制!");
	} catch(error) {
		if(navigator.userAgent.includes("Instagram")) showMessage("在浏览器上打开");
		else showMessage("链接复制失败");
	}
};

const shareImage = async () => {
	if(!navigator.share) return showMessage("你的浏览器不能分享");
	try {
		showMessage("分享中");
		let shareData = {
			title: "表情包生成",
			url: decodeURI(document.location.href)
		};
		let imageShare = [new File([await imageToBlob()], "emojimix.png", {type: "image/png"})];
		if(navigator.canShare({files: imageShare})) shareData.files = imageShare;
		await navigator.share(shareData);
	} catch(error) {
		showMessage("分享失败");
	}
};

mainSection.onanimationend = () => {
	mainSection.onanimationend = undefined;
	document.onresize();
	if(!urlEmojis) return shuffleSliders();
	slider1.goTo(urlEmojis[0]);
	slider2.goTo(urlEmojis[1]);
};

var urlEmojis = decodeURI(document.location.href).substring(28);
if(urlEmojis) {
	urlEmojis = urlEmojis.split("+");
	if(urlEmojis.length == 2) {
		urlEmojis[0] = Array.from(urlEmojis[0]).map(ch => ch.codePointAt(0)).join(" ");
		urlEmojis[1] = Array.from(urlEmojis[1]).map(ch => ch.codePointAt(0)).join(" ");
		emojis.forEach((emoji, index) => {
			if(emoji[0].join(" ") == urlEmojis[0]) urlEmojis[0] = index;
			if(emoji[0].join(" ") == urlEmojis[1]) urlEmojis[1] = index;
		});
	} else {
		urlEmojis = undefined;
	}
} else {
	urlEmojis = undefined;
}

const downloadEmojis = async () => {
	try {
		loadSection.progress.max = emojis.length;
		let refreshHintTimeout = setTimeout(() => {
			loadSection.text.innerHTML = `Taking too long? Try <a href=".">refreshing</a>.`;
		}, 1e4);
		let fetchList = emojis.map((emoji, index) => {
			let f = fetch(`https://tikolu.github.io/emojimix/emojis/${emoji[0].map(c => c.toString(16)).filter(c => c != "fe0f").join("_")}.svg`);
			f.then(() => loadSection.progress.value++);
			return f;
		});
		let responses = (await Promise.all(fetchList)).map(response => response.blob());
		clearTimeout(refreshHintTimeout);
		let blobs = await Promise.all(responses);
		blobs.forEach((blob, index) => emojis[index].push(URL.createObjectURL(blob)));
		slider1.innerHTML = "<div></div>";
		emojis.forEach(emoji => {
			let element = document.createElement("div");
			element.style.backgroundImage = `url("${emoji[3]}")`;
			slider1.appendChild(element);
		});
		slider1.innerHTML += "<div></div>";
		slider2.innerHTML = slider1.innerHTML;
		loadSection.text.classList.add("clickable");
		loadSection.text.innerText = `点这里 ${urlEmojis ? "continue" : "开始"}`;
		loadSection.text.onclick = () => {
			loadSection.hidden = true;
			setTimeout(() => mainSection.hidden = false, 10);
		}
	} catch(error) {
		loadSection.text.innerText = error;
	}
};

window.onload = () => {
	loadSection.hidden = false;
	if(urlEmojis) {
		document.getElementById("donation-list").hidden = true;
		try {
			document.getElementById("link-share-preview").src = createURL(emojis[urlEmojis[0]], emojis[urlEmojis[1]]);
		} catch(error) {
			loadSection.text.innerText = "This combination is not supported!";
		}
	} else {
		setTimeout(downloadEmojis, 250);
	}
};

window.dataLayer = window.dataLayer || [];
function gtag() { dataLayer.push(arguments) }
gtag("js", new Date());
gtag("config", "UA-131586815-2");