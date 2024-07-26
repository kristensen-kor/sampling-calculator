const sum = xs => xs.reduce((a, b) => a + b, 0);

function round(x, y) {
	if (y === undefined) y = 0;
	return Number(x.toFixed(y));
}

function lr_round(xs) {
	let base_array = xs.map(Math.floor);

	const difference = round(sum(xs)) - sum(base_array);

	const remainders = xs.map((num, index) => [num - Math.floor(num), index]).toSorted((a, b) => b[0] - a[0]);

	for (let i = 0; i < difference; i++) {
		base_array[remainders[i][1]]++;
	}

	return base_array;
}

function convertToArrayOfObjects(db) {
	let keys = Object.keys(db);
	let result = [];

	for (let i = 0; i < db[keys[0]].length; i++) {
		result.push(Object.fromEntries(keys.map(key => [key, db[key][i]])));
	}

	return result;
}

function quotas_sort(xs) {
	let ys = {};

	for (x of xs) {
		ys[x.split(/[+-]/)[0]] = x;
	}

	return Object.keys(ys).map(Number).toSorted((a, b) => a - b).map(a => ys[a]);
}

function calc_country(country, params, local_db) {
	const gp_sum = sum(local_db.map(x => x.cnt));

	let temp_quota_db = {};

	for (let x of local_db) {
		for (const age_interval of params.age) {
			if (x.age >= age_interval.from && x.age <= age_interval.to) {
				x.age_interval = age_interval.from + "-" + age_interval.to;
				break;
			}
		}

		x.quota = x.gender + " " + x.age_interval;

		if (!(x.quota in temp_quota_db)) temp_quota_db[x.quota] = { quota: x.quota, gender: x.gender, age_interval: x.age_interval, gp: 0 };
		temp_quota_db[x.quota].gp += x.cnt;
	}

	let local_quota_db = Object.values(temp_quota_db);

	for (let x of local_quota_db) {
		x.frac = x.gp / gp_sum;
		x.frac_display = round(x.frac * 100, 2) + "%";
		x.sample_raw = x.frac * params.sample_size;
	}



	// rounding
	let quotas_to_round = local_quota_db.map(a => a.sample_raw);

	let rounded_quotas = lr_round(quotas_to_round);

	for (let i in local_quota_db) {
		local_quota_db[i].sample = rounded_quotas[i];
	}

	let res = {};
	res.country = country;
	res.params = params;
	res.data = local_quota_db;
	res.gp_sum = gp_sum;


	let data_age = {};
	let data_gender = {};

	for (const x of local_quota_db) {
		if (!(x.age_interval in data_age)) data_age[x.age_interval] = { quota: x.age_interval, gp: 0, frac: 0, sample: 0};
		if (!(x.gender in data_gender)) data_gender[x.gender] = { quota: x.gender, gp: 0, frac: 0, sample: 0};
		data_age[x.age_interval].gp += x.gp;
		data_age[x.age_interval].frac += x.frac;
		data_age[x.age_interval].sample += x.sample;
		data_gender[x.gender].gp += x.gp;
		data_gender[x.gender].frac += x.frac;
		data_gender[x.gender].sample += x.sample;
	}

	for (let x of Object.values(data_age)) {
		x.frac_display = round(x.frac * 100, 2) + "%";
	}

	for (let x of Object.values(data_gender)) {
		x.frac_display = round(x.frac * 100, 2) + "%";
	}


	res.data_age = Object.values(data_age);
	res.data_gender = Object.values(data_gender);


	return res;
}

function sample_calc(params) {
	const age_from = params.age.at(0).from;
	const age_to = params.age.at(-1).to;

	let local_db = convertToArrayOfObjects(population_data_raw);

	local_db = local_db.filter(x => params.countries.includes(x.country));
	local_db = local_db.filter(x => params.gender.includes(x.gender));
	local_db = local_db.filter(x => x.age >= age_from && x.age <= age_to);

	country_res = {};

	for (country of params.countries) {
		country_res[country] = calc_country(country, params, local_db.filter(x => x.country == country))
	}

	let res = {};
	res.params = params;
	res.countries_data = country_res;

	return res;
}

// lc 312
