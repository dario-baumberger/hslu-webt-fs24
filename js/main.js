("use strict");

// general fetch options
const fetchOptions = (method) => ({
	cache: "no-cache",
	headers: {
		"Content-Type": "application/json",
	},
	method,
});

// types of locations for selects
const typeOptions = ["Glutenfrei", "Vegan", "Vegan und Glutenfrei"];

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
				website: createField("", false, 10, undefined, /^https?:\/\/.+$/),
				url: createField("", false, 10, undefined, /^https?:\/\/.+$/),
				place_id: createField(),
				type: createField("", true),
			},
			search: {
				postal_code: "",
				type: "",
			},
			result: undefined,
			typeOptions: typeOptions.map((type) => ({ value: type, label: type })),
		};
	},
	async created() {
		this.submitSearch(false);
		this.updateLocalities();
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
		let width = window.innerWidth;
		let height = window.innerHeight;
		canvas.width = width;
		canvas.height = height;
		const ctx = canvas.getContext("2d");

		class Circle {
			constructor(x, y, deltaX, deltaY, radius, lineWidth) {
				this.x = x;
				this.y = y;
				this.deltaX = deltaX;
				this.deltaY = deltaY;
				this.radius = radius;
				this.lineWidth = lineWidth;
			}
			draw = () => {
				ctx.beginPath();
				ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
				ctx.strokeStyle = "rgba(255,255,255,0.2)";
				ctx.lineWidth = this.lineWidth;
				ctx.stroke();
			};

			update = () => {
				this.deltaX = this.x + this.radius > width || this.x - this.radius < 0 ? -this.deltaX : this.deltaX;
				this.deltaY = this.y + this.radius > height || this.y - this.radius < 0 ? -this.deltaY : this.deltaY;
				this.x += this.deltaX;
				this.y += this.deltaY;
				this.draw();
			};
		}

		const circles = [];
		for (var i = 0; i < 10; i++) {
			const radius = Math.floor(Math.random() * 120) + 50;
			circles.push(new Circle(radius + Math.random() * width, radius + Math.random() * height, Math.floor(Math.random() * 2) + 1, Math.floor(Math.random() * 2) + 1, radius, Math.floor(Math.random() * 5) + 3));
		}

		window.addEventListener("resize", () => {
			width = window.innerWidth;
			height = window.innerHeight;
			canvas.width = width;
			canvas.height = height;
		});

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
		/*
		 * Read search cookie and update search inputs
		 */
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
		/*
		 * Update localities with sorted, unique values from all entries
		 */
		async updateLocalities() {
			let response = await this.loadEntries("api/locations");
			this.localities = response.data
				.filter((entry, index, self) => index === self.findIndex((e) => e.locality === entry.locality && e.postal_code === entry.postal_code))
				.sort((a, b) => a.postal_code - b.postal_code)
				.map((entry) => ({ locality: entry.locality, postal_code: entry.postal_code }));
		},
		/*
		 * Load entries from API with search parameters and error handling
		 */
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
					this.result = errorResponse;
					throw new Error(errorResponse);
				}

				return response.json();
			} catch (error) {
				return { data: [] };
			}
		},
		/*
		 * Submit search values, load entries and scroll to results
		 */
		async submitSearch(scroll = true) {
			this.entries = await this.loadEntries("/api/search", this.search.type, this.search.postal_code);
			scroll ? window.scrollTo({ top: document.getElementById("locations").offsetTop, behavior: "smooth" }) : null;
		},
		/*
		 * Reset search values and reload entries
		 */
		async resetSearch() {
			this.search.postal_code = "";
			this.search.type = "";
			this.entries = await this.loadEntries("/api/search", this.search.type, this.search.postal_code);
		},
		/*
		 * Submit new location, and update localities
		 */
		async submitNew() {
			// validate all form fields
			const isFormValid = Object.keys(this.form).every((key) => this.validate(key));

			if (!isFormValid) return;

			try {
				// prepare form values, use only values from form object
				const formValues = Object.keys(this.form).reduce((obj, key) => {
					obj[key] = this.form[key].value || "";
					return obj;
				}, {});

				const response = await fetch("/api/locations", {
					...fetchOptions("POST"),
					body: JSON.stringify(formValues),
				});

				this.result = await response.json();

				if (response.ok) {
					this.resetForm();
					this.updateLocalities();
				}
			} catch (error) {
				this.result = error;
			}
		},
		/*
		 * Reset form values
		 */
		resetForm() {
			document.getElementById("autocomplete").value = "";
			Object.keys(this.form).forEach((key) => {
				this.form[key].value = "";
			});
		},
	},
}).mount("#app");
