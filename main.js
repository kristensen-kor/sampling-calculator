import { createApp } from "./vue.esm-browser.js";

const app_config = {
	data() {
		return {
			searchfield: "",
			countries: countries_list,
			selected_countries: [],
			green_shadow: true,
			red_warning: false,
			empty_country_warning: "",
			pairs: [
				{ from: 18, to: 29 },
				{ from: 30, to: 40 },
				{ from: 41, to: 55 }
			],
			age_template: 2,
			age_templates: [
				"18-29, 30-40, 41-55",
				"18-29, 30-39, 40-49, 50-60",
				"Custom"
			],
			gender: ["M", "F"],
			sample_size: 1000,
			sample_size_error: false,
			results_show: false,
			is_error: false,
			result: null
		};
	},
	computed: {
		filtered_countries() {
			this.red_warning = false;
			if (this.searchfield.length > 0) this.green_shadow = false;
			if (this.searchfield.length == 0) return [];
			const text = this.searchfield.toLowerCase();
			const res1 = this.countries.filter(country => country.toLowerCase().startsWith(text));
			const res2 = this.countries.filter(country => country.toLowerCase().includes(text) && !country.toLowerCase().startsWith(text));
			let list = [...res1, ...res2];
			list = list.filter(a => !this.selected_countries.includes(a));
			if (list.length > 10) {
				list[9] = "...";
				list.length = 10;
			}
			return list;
		}
	},
	methods: {
		remove_country(i) {
			this.selected_countries.splice(i, 1);
		},
		select_country(country) {
			if (country == "...") return;
			this.selected_countries.push(country);
			this.searchfield = "";
		},
		remove_pair: function(i) {
			this.pairs.splice(i, 1);
		},
		add_age: function() {
			this.pairs.push({ from: this.pairs.at(-1).to + 1, to: this.pairs.at(-1).to + 10 });
		},
		calc_button: function() {
			this.is_error = this.selected_countries.length == 0;

			if (this.is_error) {
				this.green_shadow = false;
				this.red_warning = true;
				return;
			}

			if (this.sample_size < 0) return;

			this.results_show = true;

			let params = {};
			params.countries = this.selected_countries.slice();
			params.gender = this.gender.slice();
			params.age = this.pairs.slice();
			params.sample_size = this.sample_size || 0;

			const res = sample_calc(params);

			this.result = res;
		},
		copy_to_clipboard: function() {
			let text = ["Country", this.result.params.country].join("\t");

			const tables = document.querySelectorAll(".res_table");

			for (const table of tables) {
				text += "\n\n";

				for (let row of table.rows) {
					let rowData = [];

					for (let cell of row.cells) {
						rowData.push(cell.innerText);
					}

					text += rowData.join("\t") + "\n";
				}
			}

			navigator.clipboard.writeText(text);
		}
	},
	watch: {
		age_template: function(i) {
			if (i == 0) this.pairs = [
				{ from: 18, to: 29 },
				{ from: 30, to: 40 },
				{ from: 41, to: 55 }
			];

			if (i == 1) this.pairs = [
				{ from: 18, to: 29 },
				{ from: 30, to: 39 },
				{ from: 40, to: 49 },
				{ from: 50, to: 60 }
			];
		},
		gender: function(value, prev_value) {
			if (value.length == 0) this.gender = [prev_value == "M" ? "F" : "M"];
			prev_value = this.gender[0];
		},
		sample_size: function(value) {
			this.sample_size_error = value < 0;
		}
	}
};

createApp(app_config).mount('#app');

document.addEventListener("wheel", function(event) {
	if (event.target.type == "number") event.target.focus();
});
