"use strict";

const fetchOptions = {
	mode: "cors",
	cache: "no-cache",
	credentials: "same-origin",
	headers: {
		"Content-Type": "application/json"
	},
	redirect: "follow",
	referrerPolicy: "no-referrer"
};

async function submitEntries(data, url) {
	const response = await fetch(url, {
		...fetchOptions,
		method: "POST",
		body: JSON.stringify(data)
	});
	return response;
}

async function loadEntries() {
	console.log("load");
	const response = await fetch("/api/test", {
		...fetchOptions,
		method: "GET"
	});

	if (!response.ok) {
		throw new Error("Network response was not ok");
	}

	return response.json();
}

function createField({ required = false, minlength = undefined, maxlength = undefined, value = "", error = "" } = {}) {
	return { required, minlength, maxlength, value, error };
}

function validateField(field) {
	const rules = [
		{ condition: field.required && field.value === "", message: "Input is required" },
		{
			condition: field.minlength && field.value.length < field.minlength,
			message: `Input is too short. Minimal length is ${field.minlength}`
		},
		{
			condition: field.maxlength && field.value.length > field.maxlength,
			message: `Input is too long. Maximal length is ${field.maxlength}`
		}
	];

	return rules.find((rule) => rule.condition)?.message || "";
}

Vue.createApp({
	data() {
		return {
			entries: [],
			form: {
				name: createField({ required: true, minlength: 1 }),
				postal_code: createField({ required: true, minlength: 3, maxlength: 6 }),
				locality: createField({ required: true, minlength: 2 }),
				website: createField({ minlength: 3, maxlength: 100 }),
				url: createField(),
				place_id: createField(),
				type: createField({ required: true })
			},
			result: "",
			typeOptions: [
				{ value: "", label: "Bitte wählen" },
				{ value: "Glutenfrei", label: "Glutenfrei" },
				{ value: "Vegan", label: "Vegan" },
				{ value: "Vegan und Glutenfrei", label: "Vegan und Glutenfrei" }
			]
		};
	},
	async created() {
		try {
			this.entries = await loadEntries();
		} catch (error) {
			console.log("There has been a problem with your fetch operation: ", error.message);
		}
	},
	mounted() {
		const input = document.getElementById("search");
		const autocomplete = new google.maps.places.Autocomplete(input);

		autocomplete.setComponentRestrictions({ country: "ch" });
		autocomplete.setTypes(["restaurant", "food"]);

		autocomplete.addListener("place_changed", () => {
			const place = autocomplete.getPlace();
			const addressComponents = autocomplete.getPlace().address_components;
			const placeFields = ["name", "place_id", "url", "website"];
			const addressFields = ["locality", "postal_code"];

			placeFields.forEach((field) => {
				this.form[field].value = place[field];
			});

			addressFields.forEach((type) => {
				this.form[type].value = addressComponents.find((component) => component.types.includes(type)).long_name;
			});
		});
	},
	methods: {
		validate(key) {
			const field = this.form[key];
			const error = validateField(field);
			field.error = error;

			return !error;
		},
		async submit(e) {
			e.preventDefault();
			let validation = Object.keys(this.form).map((key) => validateField(key));

			if (validation.some((value) => value === false)) {
				return;
			}

			try {
				const result = (await submitEntries(this.form, "/api/test")).json();
				this.resetForm();
				result = `${result.name} wurde hinzugefügt`;
				this.loadEntries();
			} catch (error) {
				result = error;
			}
		},

		resetForm() {
			Object.keys(this.form).forEach((key) => {
				this.form[key].value = "";
			});
		}
	}
}).mount("#app");
