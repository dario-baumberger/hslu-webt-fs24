"use strict";

const $submit = document.querySelector("#submit");
const $result = document.querySelector("#result");
const $list = document.querySelector("#list");
const $toValidate = document.querySelectorAll(".validate");
const inputIds = ["name", "locality", "postal_code", "type", "place_id", "website", "url"];
const validateEvents = ["change", "keyup"];

validateEvents.forEach((event) => {
	$toValidate.forEach((input) => {
		input.addEventListener(event, (e) => {
			validateInput(e.target.id);
		});
	});
});

$submit.addEventListener("click", async function (e) {
	e.preventDefault();

	let validation = [];

	$toValidate.forEach((input) => {
		validation.push(validateInput(input.id));
	});

	if (validation.some((value) => value === false)) {
		return;
	}
	const data = {};
	inputIds.forEach((id) => {
		const element = document.getElementById(id);
		console.log(element);
		data[element.getAttribute("name")] = element.value;
	});

	try {
		const result = (await submitForm(data, "/api/test")).json();
		inputIds.forEach((id) => {
			document.getElementById(id).value = "";
		});

		$result.innerHTML = `<h2>${result.name} wurde hinzugefügt:</h2>`;
		$result.classList.add("w3-panel", "w3-green", "w3-round");

		init();
	} catch (error) {
		$result.innerHTML = error;
	}
});

async function submitForm(data, url) {
	const response = await fetch(url, {
		method: "POST",
		mode: "cors",
		cache: "no-cache",
		credentials: "same-origin",
		headers: {
			"Content-Type": "application/json"
		},
		redirect: "follow",
		referrerPolicy: "no-referrer",
		body: JSON.stringify(data)
	});
	return response;
}

function validateInput(id) {
	const $input = document.getElementById(id);
	const $formRow = $input.parentElement;
	let error;

	if ($input.hasAttribute("minlength") && $input.value.length < $input.getAttribute("minlength")) {
		error = `Input is too short. Min length is ${$input.getAttribute("minlength")}`;
	}

	if ($input.hasAttribute("required") && $input.value === "") {
		error = "Input is required";
	}

	if ($input.hasAttribute("maxlength") && $input.value.length > $input.getAttribute("maxlength")) {
		error = `Input is too long Max length is ${$input.getAttribute("maxlength")}`;
	}

	if ($formRow.querySelector(".form-error")) {
		$formRow.querySelector(".form-error").remove();
	}

	if (error) {
		const errorElement = document.createElement("div");
		errorElement.className = "form-error w3-text-red w3-small";
		errorElement.textContent = error;
		$formRow.append(errorElement);
	}

	return error ? !error.length === 0 : true;
}

function initAutocomplete() {
	const input = document.getElementById("search");
	const autocomplete = new google.maps.places.Autocomplete(input);

	autocomplete.addListener("place_changed", (e) => {
		let addressComponents = autocomplete.getPlace().address_components;

		document.getElementById("name").value = autocomplete.getPlace().name;
		document.getElementById("place_id").value = autocomplete.getPlace().place_id;

		document.getElementById("url").value = autocomplete.getPlace().url;
		document.getElementById("website").value = autocomplete.getPlace().website;

		/*document.getElementById("route").value = addressComponents.find((component) =>
			component.types.includes("route")
		).long_name;

		document.getElementById("street_number").value = addressComponents.find((component) =>
			component.types.includes("street_number")
		).long_name;*/

		document.getElementById("locality").value = addressComponents.find((component) =>
			component.types.includes("locality")
		).long_name;

		document.getElementById("postal_code").value = addressComponents.find((component) =>
			component.types.includes("postal_code")
		).long_name;
	});
}

google.maps.event.addDomListener(window, "load", initAutocomplete);

async function loadContent() {
	console.log("load");
	const response = await fetch("/api/test", {
		method: "GET",
		mode: "cors",
		cache: "no-cache",
		credentials: "same-origin",
		headers: {
			"Content-Type": "application/json"
		},
		redirect: "follow",
		referrerPolicy: "no-referrer"
	});

	if (!response.ok) {
		throw new Error("Network response was not ok");
	}
	return response.json();
}
async function init() {
	try {
		const data = await loadContent();
		console.log(data);
		let posts = "";
		data.forEach((item) => {
			posts += `<tr>
						<td>${item.name}</td>
						<td>${item.postal_code} ${item.locality}</td>
						<td><a href="${item.website}">
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512"><!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M579.8 267.7c56.5-56.5 56.5-148 0-204.5c-50-50-128.8-56.5-186.3-15.4l-1.6 1.1c-14.4 10.3-17.7 30.3-7.4 44.6s30.3 17.7 44.6 7.4l1.6-1.1c32.1-22.9 76-19.3 103.8 8.6c31.5 31.5 31.5 82.5 0 114L422.3 334.8c-31.5 31.5-82.5 31.5-114 0c-27.9-27.9-31.5-71.8-8.6-103.8l1.1-1.6c10.3-14.4 6.9-34.4-7.4-44.6s-34.4-6.9-44.6 7.4l-1.1 1.6C206.5 251.2 213 330 263 380c56.5 56.5 148 56.5 204.5 0L579.8 267.7zM60.2 244.3c-56.5 56.5-56.5 148 0 204.5c50 50 128.8 56.5 186.3 15.4l1.6-1.1c14.4-10.3 17.7-30.3 7.4-44.6s-30.3-17.7-44.6-7.4l-1.6 1.1c-32.1 22.9-76 19.3-103.8-8.6C74 372 74 321 105.5 289.5L217.7 177.2c31.5-31.5 82.5-31.5 114 0c27.9 27.9 31.5 71.8 8.6 103.9l-1.1 1.6c-10.3 14.4-6.9 34.4 7.4 44.6s34.4 6.9 44.6-7.4l1.1-1.6C433.5 260.8 427 182 377 132c-56.5-56.5-148-56.5-204.5 0L60.2 244.3z"/></svg>
						</a></td>
						<td><a href="${item.url}"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"/></svg></a></td>
					</tr>`;
		});
		$list.innerHTML = posts;
		console.log(posts);
	} catch (error) {
		console.log("There has been a problem with your fetch operation: ", error.message);
	}
}
init();
