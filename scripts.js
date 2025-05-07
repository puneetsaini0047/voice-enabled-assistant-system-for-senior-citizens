const output = document.getElementById("output");

const synth = window.speechSynthesis;
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = 'en-US';
recognition.interimResults = false;
recognition.maxAlternatives = 1;

let alarmInterval;
let alarmActive = false;

function speak(text) {
  const utterThis = new SpeechSynthesisUtterance(text);
  synth.speak(utterThis);
  output.innerText = "Assistant: " + text;
}

function startListening() {
  recognition.start();
  output.innerText = "Listening...";
}

recognition.onresult = function (event) {
  const speech = event.results[0][0].transcript.toLowerCase();
  output.innerText = "You said: " + speech;
  handleCommand(speech);
};

recognition.onerror = function (event) {
  output.innerText = "Error occurred in recognition: " + event.error;
};

function handleCommand(command) {
  if (command.includes("time")) {
    const time = new Date().toLocaleTimeString();
    speak("The time is " + time);
  } else if (command.includes("date")) {
    const date = new Date().toLocaleDateString();
    speak("Today's date is " + date);
  } else if (command.includes("joke")) {
    tellJoke();
  } else if (command.includes("weather")) {
    const cityMatch = command.match(/weather in ([a-zA-Z\s]+)/);
    if (cityMatch && cityMatch[1]) {
      const city = cityMatch[1].trim();
      getWeather(city);
    } else {
      speak("Please specify the city. For example, say 'What's the weather in Delhi'.");
    }
  } else if (command.includes("news")) {
    getNewsBrief();
  } else if (command.includes("remind") || command.includes("medicine")) {
    setMedicationReminder(command);
  } else if (command.includes("stop alarm")) {
    stopAlarm();
  } else {
    speak("Sorry, I didn't understand that.");
  }
}

async function getWeather(city) {
  const apiKey = '24187e76308498f5275b891df9eb7dba';
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.cod === 200) {
      const description = data.weather[0].description;
      const temp = data.main.temp;
      speak(`The weather in ${city} is ${description} with ${temp} degrees Celsius.`);
    } else {
      speak(`Sorry, I couldn't find weather information for ${city}.`);
    }
  } catch (error) {
    speak("Sorry, I couldn't fetch the weather.");
  }
}

async function tellJoke() {
  try {
    const response = await fetch("https://official-joke-api.appspot.com/random_joke");
    const data = await response.json();
    const joke = `${data.setup} ... ${data.punchline}`;
    speak(joke);
  } catch (error) {
    speak("Couldn't fetch a joke right now.");
  }
}

async function getNewsBrief() {
  const apiKey = 'f58c8937d41253845e204b02b13b1883';
  const url = `https://gnews.io/api/v4/top-headlines?country=in&lang=en&max=3&apikey=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!data.articles || data.articles.length === 0) {
      speak("Sorry, I couldn't find any news right now.");
      return;
    }

    const headlines = data.articles.map(article => article.title);
    speak("Here are the top headlines: " + headlines.join(". Next, "));
  } catch (error) {
    console.error("GNews fetch error:", error);
    speak("Sorry, I couldn't fetch the news right now.");
  }
}

function setMedicationReminder(command) {
  const regex = /(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i;
  const match = command.match(regex);
  if (match) {
    let hours = parseInt(match[1]);
    let minutes = parseInt(match[2]) || 0;
    const period = match[3];

    if (period === "pm" && hours < 12) hours += 12;
    if (period === "am" && hours === 12) hours = 0;

    const now = new Date();
    const reminderTime = new Date();
    reminderTime.setHours(hours);
    reminderTime.setMinutes(minutes);
    reminderTime.setSeconds(0);

    const diff = reminderTime - now;
    if (diff > 0) {
      setTimeout(() => {
        startAlarm();
      }, diff);
      speak(`Reminder set for ${reminderTime.toLocaleTimeString()}`);
    } else {
      speak("That time has already passed. Please try again.");
    }
  } else {
    speak("Please say a time like 'Remind me to take medicine at 8 PM'.");
  }
}

function startAlarm() {
  if (alarmActive) return;
  alarmActive = true;
  alarmInterval = setInterval(() => {
    const alarmMessage = "It's time to take your medicine. Say 'stop alarm' to stop this reminder.";
    const utterance = new SpeechSynthesisUtterance(alarmMessage);
    synth.speak(utterance);
  }, 5000);
}

function stopAlarm() {
  if (alarmInterval) {
    clearInterval(alarmInterval);
    alarmInterval = null;
    alarmActive = false;
    speak("Alarm stopped. Stay healthy!");
  }
}