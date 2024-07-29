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
			age_pairs: null,
			prev_age_pairs: null,
			age_template: 0,
			age_templates_data: [
				[
					{ from: 18, to: 29 },
					{ from: 30, to: 40 },
					{ from: 41, to: 55 }
				],
				[
					{ from: 18, to: 29 },
					{ from: 30, to: 39 },
					{ from: 40, to: 49 },
					{ from: 50, to: 60 }
				]
			],
			age_templates_labels: [
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
			if (list.length == 0) list = ["Nothing found"];
			return list;
		},
		age_pairs_errors() {
			let age_pairs_errors = [];

			for (let i = 0; i < this.age_pairs.length; i++) {
				let x = { from: false, to: false }

				if (this.age_pairs[i].from < 0) x.from = true;
				if (this.age_pairs[i].to < 0) x.to = true;
				if (this.age_pairs[i].from > 100) x.from = true;
				if (this.age_pairs[i].to > 100) x.to = true;

				if (this.age_pairs[i].from > this.age_pairs[i].to) x.from = true;
				if (this.age_pairs[i].from > this.age_pairs[i].to) x.to = true;

				if (i < this.age_pairs.length - 1) {
					if (this.age_pairs[i + 1].from - this.age_pairs[i].to != 1) x.to = true;
				}

				if (i > 0) {
					if (this.age_pairs[i].from - this.age_pairs[i - 1].to != 1) x.from = true;
				}

				age_pairs_errors.push(x)
			}

			return age_pairs_errors;
		}
	},
	methods: {
		remove_country(i) {
			this.selected_countries.splice(i, 1);
		},
		select_country(country) {
			if (country == "...") return;
			if (country == "Nothing found") return;
			this.selected_countries.push(country);
			this.searchfield = "";
		},
		remove_age_pair: function(i) {
			this.prev_age_pairs = null;
			this.age_pairs.splice(i, 1);
		},
		add_age: function() {
			this.prev_age_pairs = null;
			this.age_pairs.push({ from: this.age_pairs.at(-1).to + 1, to: Math.min(this.age_pairs.at(-1).to + 10, 100) });
		},
		calc_button: function() {
			this.is_error = this.selected_countries.length == 0;

			if (this.is_error) {
				this.green_shadow = false;
				this.red_warning = true;
				return;
			}


			if (this.age_pairs_errors.some(obj => obj.from || obj.to)) return;

			if (this.sample_size < 0) return;

			this.results_show = true;

			let params = {};
			params.countries = this.selected_countries.slice();
			params.gender = this.gender.slice();
			params.age = this.age_pairs.slice();
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
		age_pairs: {
			handler: function(value) {
				if (JSON.stringify(value) != JSON.stringify(this.age_templates_data[0]) && JSON.stringify(value) != JSON.stringify(this.age_templates_data[1])) this.age_template = 2;

				// let temp_copy = JSON.parse(JSON.stringify(value));

				let prev = this.prev_age_pairs;

				if (prev !== null) {

					for (let i = 0; i < value.length - 1; i++) {
						if (value[i].to == prev[i].to + 1 && value[i + 1].from - value[i].to == 0) value[i + 1].from++;
						if (value[i].to == prev[i].to - 1 && value[i + 1].from - value[i].to == 2) value[i + 1].from--;
					}

					for (let i = 1; i < value.length; i++) {
						if (value[i].from == prev[i].from + 1 && value[i].from - value[i - 1].to == 2) value[i - 1].to++;
						if (value[i].from == prev[i].from - 1 && value[i].from - value[i - 1].to == 0) value[i - 1].to--;
					}
				}

				this.prev_age_pairs = JSON.parse(JSON.stringify(value));
				// this.prev_age_pairs = temp_copy;
			},
			deep: true
		},
		age_template: {
			handler: function(i) {
				if (i == 0 || i == 1) this.prev_age_pairs = null;
				if (i == 0) this.age_pairs = JSON.parse(JSON.stringify(this.age_templates_data[0]));
				if (i == 1) this.age_pairs = JSON.parse(JSON.stringify(this.age_templates_data[1]));
			},
			immediate: true
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
