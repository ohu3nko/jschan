setDefaultLocalStorage('relative', true);
let relativeTime = localStorage.getItem('relative') == 'true';
setDefaultLocalStorage('24hour', false);
let hour24 = localStorage.getItem('24hour') == 'true';
setDefaultLocalStorage('localtime', true);
let localTime = localStorage.getItem('localtime') == 'true';

let dates = [];
const dateElems = document.getElementsByClassName('reltime');
for (let i = 0; i < dateElems.length; i++) {
	dates.push(dateElems[i]); //convert to array
}

const YEAR = 31536000000
	, MONTH = 2592000000
	, WEEK = 604800000
	, DAY = 86400000
	, HOUR = 3600000
	, MINUTE = 60000;

const relativeTimeString = (date) => {
	let difference = Date.now() - new Date(date).getTime();
	let amount = 0;
	let ret = '';
	let isFuture = false;
	if (difference < 0) {
		difference = Math.abs(difference);
		isFuture = true;
	}
	if (difference < MINUTE) {
		return 'Now';
	} else if (difference < MINUTE*59.5) {
		amount = Math.round(difference / MINUTE);
		ret = `${amount} minute`;
	} else if (difference < HOUR*23.5) {
		amount = Math.round(difference / HOUR);
		ret = `${amount} hour`;
	} else if (difference < DAY*6.5) {
		amount = Math.round(difference / DAY);
		ret = `${amount} day`;;
	} else if (difference < WEEK*3.5) {
		amount = Math.round(difference / WEEK);
		ret = `${amount} week`;
	} else if (difference < MONTH*11.5) {
		amount = Math.round(difference / MONTH);
		ret = `${amount} month`;
	} else {
		amount = Math.round(difference / YEAR);
		ret = `${amount} year`;
	}
	return `${ret}${amount > 1 ? 's' : ''} ${isFuture ? 'from now' :  'ago'}`;
}

const changeDateFormat = (date) => {
	const options = {
		hourCycle: hour24 ? 'h23' : 'h12',
		hour12: !hour24
	};
	if (!localTime) {
		options.timeZone = SERVER_TIMEZONE;
	}
	const dateString = new Date(date.dateTime).toLocaleString('en-US', options);
	if (relativeTime) {
		date.innerText = relativeTimeString(date.dateTime);
		date.title = dateString;
	} else {
		date.innerText = dateString;
		date.removeAttribute('title');
	}
}

const updateDates = () => {
	for (let i = 0; i < dates.length; i++) {
		changeDateFormat(dates[i]);
	}
}

updateDates();

window.addEventListener('settingsReady', function(event) {

	let relativeInterval = relativeTime ? setInterval(updateDates, MINUTE) : void 0;

	const hour24Setting = document.getElementById('24hour-setting');
	const togglehour24 = () => {
		hour24 = !hour24;
		setLocalStorage('24hour', hour24);
		updateDates();
		console.log('toggling 24h time', hour24);
	}
	hour24Setting.checked = hour24;
	hour24Setting.addEventListener('change', togglehour24, false);

	const localTimeSetting = document.getElementById('localtime-setting');
	const toggleLocalTime = () => {
		localTime = !localTime;
		setLocalStorage('localtime', localTime);
		updateDates();
		console.log('toggling local time', localTime);
	}
	localTimeSetting.checked = localTime;
	localTimeSetting.addEventListener('change', toggleLocalTime, false);

	const relativeTimeSetting = document.getElementById('relative-setting');
	const togglerelativeTime = () => {
		relativeTime = !relativeTime;
		setLocalStorage('relative', relativeTime);
		updateDates();
		if (relativeTime) {
			relativeInterval = setInterval(updateDates, MINUTE);
		} else {
			clearInterval(relativeInterval);
		}
		console.log('toggling relative time', relativeTime);
	}
	relativeTimeSetting.checked = relativeTime;
	relativeTimeSetting.addEventListener('change', togglerelativeTime, false);

});

window.addEventListener('addPost', function(e) {

	const date = e.detail.post.querySelector('.reltime');
	if (!e.detail.hover) {
		dates.push(date);
	}
	changeDateFormat(date);

});
