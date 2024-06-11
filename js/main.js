("use strict");

// general fetch options
const fetchOptions = (method) => ({
	cache: "no-cache",
	headers: {
		"Content-Type": "application/json",
	},
	method,
});
const types = ["Glutenfrei", "Vegan", "Vegan und Glutenfrei"];

// create input field object with needed properties
function createField(value = "", required = false, minLength = undefined, maxLength = undefined, pattern = undefined) {
	return { value, required, minLength, maxLength, pattern };
}

// validate input field by its properties
function validateField(field) {
	const rules = [
		{ condition: field.required && field.value === "", message: "Pflichtfeld" },
		// minlength should only be checked if field has a value. Otherwise it would always be invalid.
		//There exists field with minlength which are not required.
		{
			condition: !field.required && field.value && field.value.length < field.minLength,
			message: `Eingabe zur kurz. Minimale Länge ${field.minLength} Zeichen`,
		},
		{
			condition: field.maxLength && field.value.length > field.maxLength,
			message: `Input zu lange. Maximale Länge ${field.maxLength} Zeichen`,
		},
		{
			condition: field.pattern && field.value && !field.pattern.test(field.value),
			message: `Ungültiges Format`,
		},
	];

	return rules.find((rule) => rule.condition)?.message || "";
}

Vue.createApp({
	data() {
		return {
			entries: { data: [] },
			localities: [],
			form: {
				name: createField("", true, 1),
				postal_code: createField("", true, 4, 4),
				locality: createField("", true, 2),
				website: createField("", false, undefined, undefined, /^https?:\/\/.+$/),
				url: createField("", false, undefined, undefined, /^https?:\/\/.+$/),
				place_id: createField(),
				type: createField("", true),
			},
			search: {
				postal_code: "",
				type: "",
			},
			result: {},
			typeOptions: types.map((type) => ({ value: type, label: type })),
		};
	},
	async created() {
		this.submitSearch();
		let response = await this.loadEntries("api/locations");
		console.log(response);
		this.localities = response.data
			.filter((entry, index, self) => index === self.findIndex((e) => e.locality === entry.locality && e.postal_code === entry.postal_code))
			.sort((a, b) => a.postal_code - b.postal_code)
			.map((entry) => ({ locality: entry.locality, postal_code: entry.postal_code }));
		console.log(this.localities);
		this.readSearchCookieUpdateSearchInputs();
	},

	mounted() {
		const autocomplete = new google.maps.places.Autocomplete(document.getElementById("autocomplete"));
		autocomplete.setComponentRestrictions({ country: "ch" });
		autocomplete.setTypes(["restaurant", "food"]);
		autocomplete.addListener("place_changed", () => {
			const place = autocomplete.getPlace();
			const addressComponents = autocomplete.getPlace().address_components;
			const placeFields = ["name", "place_id", "url", "website"];
			const addressFields = ["locality", "postal_code"];
			placeFields.forEach((field) => (this.form[field].value = place[field]));
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
			}
			draw = () => {
				ctx.beginPath();
				ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2, false);
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
			circles.push(new Circle(radius + Math.random() * width, radius + Math.random() * height, Math.floor(Math.random() * 2) + 1, Math.floor(Math.random() * 2) + 1, radius, Math.floor(Math.random() * 5) + 3));
		}

		function animate() {
			requestAnimationFrame(animate);
			ctx.clearRect(0, 0, width, height);
			ctx.rect(0, 0, width, height);
			ctx.fillStyle = "rgba(0,0,0,0.5)";
			ctx.fill();
			ctx.filter = "blur(2px)";
			circles.forEach((circle) => circle.update());
		}

		animate();
	},
	methods: {
		readSearchCookieUpdateSearchInputs() {
			const searchCookie = document.cookie.split("; ").find((row) => row.startsWith("search="));
			const searchCookieValue = searchCookie ? JSON.parse(decodeURIComponent(searchCookie.split("=")[1])) : {};
			this.search.postal_code = searchCookieValue.postal_code ?? "";
			this.search.type = searchCookieValue.type ?? "";
		},
		validate(key) {
			const field = this.form[key];
			const error = validateField(field);
			field.error = error;
			return !error;
		},
		async submitEntries(data, url) {
			const response = await fetch(url, {
				...fetchOptions("POST"),
				body: JSON.stringify(data),
			});
			return response;
		},
		async loadEntries(api = "/api/locations", type = "", place = "") {
			let queries = [];
			if (type) queries.push(`type=${encodeURIComponent(type)}`);
			if (place) queries.push(`postal_code=${encodeURIComponent(place)}`);
			const queryString = queries.length ? `?${queries.join("&")}` : "";
			const url = `${api}${queryString}`;

			try {
				const response = await fetch(url, fetchOptions("GET"));
				if (!response.ok) {
					const errorResponse = await response.json();
					this.result = errorResponse; // Set the result to the error response
					throw new Error(errorResponse);
				}

				return response.json();
			} catch (error) {
				return { data: [] };
			}
		},

		async submitSearch() {
			this.entries = await this.loadEntries("/api/search", this.search.type, this.search.postal_code);
			window.scrollTo({ top: document.getElementById("locations").offsetTop, behavior: "smooth" });
		},
		async resetSearch() {
			this.search.postal_code = "";
			this.search.type = "";
			document.cookie = "search=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
			this.entries = await this.loadEntries("/api/search", this.search.type, this.search.postal_code);
		},
		async submitNew() {
			Object.keys(this.form).forEach((key) => this.validate(key));
			try {
				const formValues = Object.keys(this.form).reduce((obj, key) => {
					obj[key] = this.form[key].value || "";
					return obj;
				}, {});

				const response = await this.submitEntries(formValues, "/api/locations");
				const jsonResponse = await response.json();
				this.result = jsonResponse;

				if (response.ok) {
					this.resetForm();
					this.entries = await this.loadEntries();
				}
			} catch (error) {
				this.result = error;
			}
		},
		resetForm() {
			document.getElementById("autocomplete").value = "";
			Object.keys(this.form).forEach((key) => {
				this.form[key].value = "";
			});
		},
	},
}).mount("#app");
