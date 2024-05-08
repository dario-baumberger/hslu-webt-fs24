"use strict";

const $submit = document.querySelector("#submit");
const $form = document.querySelector("#form");
const $address = document.querySelector("#address");
const $result = document.querySelector("#result");
const $list = document.querySelector("#list");
const $toValidate = document.querySelectorAll(".validate");
const inputIds = ["name", "route", "street_number", "locality", "postal_code", "type", "place_id"];
const validateEvents = ["change", "keyup"];

const { createApp, ref } = Vue;

createApp({
	setup() {
		const message = ref("Hello vue!");
		return {
			message
		};
	}
}).mount("#app");

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

		$result.innerHTML = result.currency;
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

		document.getElementById("route").value = addressComponents.find((component) =>
			component.types.includes("route")
		).long_name;

		document.getElementById("street_number").value = addressComponents.find((component) =>
			component.types.includes("street_number")
		).long_name;

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
			posts += `<li>${item.name}</li>`;
		});
		$list.innerHTML = posts;
		console.log(posts);
	} catch (error) {
		console.log("There has been a problem with your fetch operation: ", error.message);
	}
}
init();
