"use strict";
const fetchOptions = (method) => ({
	mode: "cors",
	cache: "no-cache",
	credentials: "same-origin",
	headers: {
		"Content-Type": "application/json"
	},
	redirect: "follow",
	referrerPolicy: "no-referrer",
	method
});

async function submitEntries(data, url) {
	const response = await fetch(url, {
		...fetchOptions("POST"),
		body: JSON.stringify(data)
	});
	return response;
}

async function loadEntries(type = "", place = "") {
	let queries = [];
	if (type) queries.push(`type=${encodeURIComponent(type)}`);
	if (place) queries.push(`locality=${encodeURIComponent(place)}`);
	const queryString = queries.length ? `?${queries.join("&")}` : "";
	const url = `/api/test${queryString}`;
	const response = await fetch(url, fetchOptions("GET"));
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
			search: {
				place: "",
				type: ""
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
			this.localities = this.entries
				.map((entry) => ({ locality: entry.locality, postal_code: entry.postal_code }))
				.filter((value, index, self) => self.map((item) => item.locality).indexOf(value.locality) === index);
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
		const canvas = document.getElementById("canvas");
		const width = window.innerWidth;
		const height = window.innerHeight;
		canvas.width = width;
		canvas.height = height;
		const ctx = canvas.getContext("2d");

		class Circle {
			constructor(x, y, dx, dy, r, lineWidth) {
				this.x = x;
				this.y = y;
				this.dx = dx;
				this.dy = dy;
				this.r = r;
				this.lineWidth = lineWidth;
				this.gradient;
			}
			draw = () => {
				ctx.beginPath();
				ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2, false);
				ctx.fillStyle = this.gradient;
				ctx.strokeStyle = "rgba(255,255,255,0.2)";
				ctx.lineWidth = this.lineWidth;
				ctx.stroke();
			};

			update = () => {
				this.dx = this.x + this.r > width || this.x - this.r < 0 ? -this.dx : this.dx;
				this.dy = this.y + this.r > height || this.y - this.r < 0 ? -this.dy : this.dy;
				this.x += this.dx;
				this.y += this.dy;
				this.draw();
			};
		}

		const circles = [];
		for (var i = 0; i < 10; i++) {
			const radius = Math.floor(Math.random() * 120) + 50;
			circles.push(
				new Circle(
					radius + Math.random() * width,
					radius + Math.random() * height,
					Math.floor(Math.random() * 2) + 1,
					Math.floor(Math.random() * 2) + 1,
					radius,
					Math.floor(Math.random() * 5) + 3
				)
			);
		}

		function animate() {
			requestAnimationFrame(animate);
			ctx.clearRect(0, 0, width, height);
			ctx.rect(0, 0, width, height);
			ctx.fillStyle = "rgba(0,0,0,0.5)";
			ctx.fill();
			ctx.filter = "blur(5px)";
			circles.forEach((circle) => circle.update());
		}

		animate();
	},
	methods: {
		validate(key) {
			const field = this.form[key];
			const error = validateField(field);
			field.error = error;
			return !error;
		},
		async submitSearch(e) {
			try {
				this.entries = await loadEntries(this.search.type, this.search.place);
			} catch (error) {
				console.log("There has been a problem with your fetch operation: ", error.message);
			}
		},

		async resetSearch(e) {
			this.search.place = "";
			this.search.type = "";
			document.cookie = "search=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
			try {
				this.entries = await loadEntries(this.search.type, this.search.place);
			} catch (error) {
				console.log("There has been a problem with your fetch operation: ", error.message);
			}
		},

		async submit() {
			if (!Object.keys(this.form).every((key) => this.validate(key))) return;
			try {
				const formValues = Object.keys(this.form).reduce((obj, key) => {
					obj[key] = this.form[key].value;
					return obj;
				}, {});
				await submitEntries(formValues, "/api/test");
				this.resetForm();
				this.result = `${result.name} wurde hinzugefügt`;
				try {
					this.entries = await loadEntries();
				} catch (error) {
					console.log("There has been a problem with your fetch operation: ", error.message);
				}
			} catch (error) {
				this.result = error;
			}
		},

		resetForm() {
			Object.keys(this.form).forEach((key) => {
				this.form[key].value = "";
			});
		}
	}
}).mount("#app");
