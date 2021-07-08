"use strict";

// prettier-ignore
const form = document.querySelector(".form");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");

function clearForm() {
  inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value =
    "";
  inputType.value = "running";
  inputCadence.closest(".form__row").classList.remove("form__row--hidden");
  inputElevation.closest(".form__row").classList.add("form__row--hidden");
}

//construction function for App
function App() {
  this.lastMapEvent;
  this.map = L.map("map");
  this.workouts = new Array();
  this._getLocation();

  this._getLocalStorage();
  ////////////////////////////////////////
  //Event listeners
  this.map.on("click", this._showForm.bind(this));

  form.addEventListener("submit", this._submitForm.bind(this));

  inputType.addEventListener("change", this._toggleForm);
}

//getting location of a user
App.prototype._getLocation = function () {
  navigator.geolocation.getCurrentPosition(
    this._loadMap.bind(this),
    function () {
      alert("Turn on your GeoLocation");
    }
  );
};

//Loading map
App.prototype._loadMap = function (location) {
  const latitude = location.coords.latitude;
  const longitude = location.coords.longitude;
  this.map.setView([latitude, longitude], 15);

  L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(this.map);
};

//Showing form on click
App.prototype._showForm = function (mapEvent) {
  this.lastMapEvent = mapEvent;
  form.style.transition = "all 0.5s, transform 1ms";
  form.classList.remove("hidden");
  inputDistance.focus();
};

//Toggle form
App.prototype._toggleForm = function () {
  inputCadence.closest(".form__row").classList.toggle("form__row--hidden");
  inputElevation.closest(".form__row").classList.toggle("form__row--hidden");
};

//Adding marker after submiting form
App.prototype._submitForm = function (e) {
  e.preventDefault();
  form.classList.add("hidden");
  form.style.transition = "none";

  const lat = this.lastMapEvent.latlng.lat;
  const lng = this.lastMapEvent.latlng.lng;
  let str;
  let type;

  const distance = Number(inputDistance.value);
  const duration = Number(inputDuration.value);
  const cadance = Number(inputCadence.value);
  const elevation = Number(inputElevation.value);

  const isValid = (...inputs) =>
    inputs.every((el) => Number.isFinite(el) && el > 0);

  if (inputType.value === "running") {
    if (isValid(distance, duration, cadance)) {
      const tmp = new Running(distance, duration, { lat, lng }, cadance);
      this.workouts.push(tmp);
      str = "🏃‍♂️ " + tmp.description;
      type = tmp.type;
    } else {
      clearForm();
      return alert("fock");
    }
  } else {
    if (isValid(distance, duration, elevation)) {
      const tmp = new Cycling(distance, duration, { lat, lng }, elevation);
      this.workouts.push(tmp);
      str = "🚴‍♀️ " + tmp.description;
      type = tmp.type;
    } else {
      clearForm();
      return alert("fock");
    }
  }

  this.addMarker.call(this, [lat, lng], str, type);
  this._setLocalStorage();
  clearForm();
};

//adding marker
App.prototype.addMarker = function (cords, str, type) {
  const options = {
    autoClose: false,
    closeOnClick: false,
    minWidth: 25,
    className: `${type}-popup`,
  };
  const pop = L.popup(options).setContent(str);
  L.marker(cords).addTo(this.map).bindPopup(pop).openPopup();
};

//set local storage
App.prototype._setLocalStorage = function () {
  localStorage.setItem("workouts", JSON.stringify(this.workouts));
};

//get local storage
App.prototype._getLocalStorage = function () {
  const data = JSON.parse(localStorage.getItem("workouts"));

  if (!data) return;

  this.workouts = data;

  this.workouts.forEach((el) => {
    if (el.type === "running") el.__proto__ = Running.prototype;
    else el.__proto__ = Cycling.prototype;
  });
  this.workouts.forEach((el) => el.createListItem());
};

//construction function for workout
function Workout(distance, duration, location) {
  this.date = new Date();
  this.duration = duration;
  this.distance = distance;
  this.latitude = location.lat;
  this.longitude = location.lng;
}

Workout.prototype.zoomOnWorkout = function () {
  app.map.setView([this.latitude, this.longitude], 16);
};

Workout.prototype.createDescription = function () {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  return `${this.type[0]
    .toUpperCase()
    .concat([...this.type].splice(-this.type.length + 1).join(""))} on ${
    months[this.date.getMonth()]
  } ${this.date.getDate()}`;
};

Workout.prototype.createListItem = function () {
  this.description = this.createDescription();

  const item = document.createElement("li");
  item.classList.add(`workout`);
  item.classList.add(`workout--${this.type}`);

  const run = this.type === "running";

  item.innerHTML = `
  <h2 class="workout__title">${this.description}</h2>
  <div class="workout__details">
    <span class="workout__icon">${run ? "🏃‍♂️" : "🚴‍♀️"}</span>
    <span class="workout__value">${this.distance}</span>
    <span class="workout__unit">km</span>
  </div>
  <div class="workout__details">
    <span class="workout__icon">⏱</span>
    <span class="workout__value">${this.duration}</span>
    <span class="workout__unit">min</span>
  </div>
  <div class="workout__details">
    <span class="workout__icon">⚡️</span>
    <span class="workout__value">${
      run ? this.pace.toFixed(1) : this.speed.toFixed(1)
    }</span>
    <span class="workout__unit">${run ? "min/km" : "km/h"}</span>
  </div>
  <div class="workout__details">
    <span class="workout__icon">${run ? "🦶🏼" : "⛰"}</span>
    <span class="workout__value">${run ? this.cadence : this.elevation}</span>
    <span class="workout__unit">${run ? "spm" : "m"}</span>
  </div>`;
  containerWorkouts.querySelector("form").after(item);

  return item;
};

//construction function for runners
function Running(distance, duration, location, cadence) {
  Workout.call(this, distance, duration, location);
  this.type = "running";
  this.cadence = cadence;
  this.pace = duration / distance;
  this.item = this.createListItem.bind(this)();
  this.item.addEventListener("click", this.zoomOnWorkout.bind(this));
}

Running.prototype.__proto__ = Workout.prototype;

//construction function for cyclist
function Cycling(distance, duration, location, elevation) {
  Workout.call(this, distance, duration, location);
  this.type = "cycling";
  this.elevation = elevation;
  this.speed = distance / duration;
  this.item = this.createListItem.bind(this)();
  this.item.addEventListener("click", this.zoomOnWorkout.bind(this));
}

Cycling.prototype.__proto__ = Workout.prototype;

//Initializing app
const app = new App();
