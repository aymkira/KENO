module.exports.config = {
	name: "طقس",
	version: "1.0.3",
	hasPermssion: 0,
	credits: "عمر",
	description: "عرض معلومات الطقس لأي منطقة في العالم",
	commandCategory: "خدمات",
	usages: "[اسم المدينة أو الدولة]",
	cooldowns: 5,
	dependencies: {
		"moment-timezone": "",
		"axios": ""
	},
	envConfig: {
		"OPEN_WEATHER": "c4ef85b93982d6627681b056e24bd438"
	}
};

module.exports.languages = {
	"ar": {
		"noInput": "❗ يرجى إدخال اسم المدينة مثل: طقس الجزائر",
		"locationNotExist": "❌ لم أتمكن من إيجاد معلومات الطقس عن: %1.",
		"returnResult": "%9\n📍 المدينة: %1\n🌡 درجة الحرارة: %2°C\n🌡 الإحساس الحقيقي: %3°C\n☁️ الحالة الجوية: %4\n💦 الرطوبة: %5%\n💨 سرعة الرياح: %6 km/h\n🌅 شروق الشمس: %7\n🌄 غروب الشمس: %8"
	},
	"en": {
		"noInput": "Please enter a city name.",
		"locationNotExist": "Can't find weather info for: %1.",
		"returnResult": "%9\n📍 Location: %1\n🌡 Temp: %2°C\n🌡 Feels like: %3°C\n☁️ Sky: %4\n💦 Humidity: %5%\n💨 Wind speed: %6 km/h\n🌅 Sunrise: %7\n🌄 Sunset: %8"
	}
};

module.exports.run = async ({ api, event, args, getText }) => {
	const axios = global.nodemodule["axios"];
	const moment = global.nodemodule["moment-timezone"];
	const { threadID, messageID } = event;

	const city = args.join(" ");
	if (!city) return api.sendMessage(getText("noInput"), threadID, messageID);

	try {
		const apiKey = global.configModule["طقس"].OPEN_WEATHER;
		const res = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric&lang=ar`);
		const data = res.data;

		const temp = data.main.temp;
		const feels = data.main.feels_like;
		const desc = data.weather[0].description;
		const humidity = data.main.humidity;
		const wind = data.wind.speed;
		const sunrise = moment.unix(data.sys.sunrise).tz("Asia/Baghdad").format("HH:mm:ss");
		const sunset = moment.unix(data.sys.sunset).tz("Asia/Baghdad").format("HH:mm:ss");
		const cityName = data.name;

		let icon = "🌤️";
		const main = data.weather[0].main.toLowerCase();
		if (main.includes("clear")) icon = "☀️";
		else if (main.includes("cloud")) icon = "☁️";
		else if (main.includes("rain")) icon = "🌧️";
		else if (main.includes("storm") || main.includes("thunder")) icon = "🌩️";
		else if (main.includes("snow")) icon = "❄️";
		else if (main.includes("fog") || main.includes("mist")) icon = "🌫️";

		api.sendMessage({
			body: getText("returnResult", cityName, temp, feels, desc, humidity, wind, sunrise, sunset, icon),
			location: {
				latitude: data.coord.lat,
				longitude: data.coord.lon,
				current: true
			}
		}, threadID, messageID);

	} catch (err) {
		console.error(err);
		return api.sendMessage(getText("locationNotExist", city), threadID, messageID);
	}
};
