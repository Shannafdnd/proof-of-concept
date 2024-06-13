const calendar = document.getElementById("calendar");
const week = document.querySelector(".week");
const prevButton = document.getElementById("prev-button");
const nextButton = document.getElementById("next-button");

nextButton.addEventListener("click", () => {
  const weekWidth = week.clientWidth; //width in px
  calendar.scrollLeft += weekWidth; // scroll weekwidth amount of px to left
});

prevButton.addEventListener("click", () => {
  const weekWidth = week.clientWidth; //width in px
  calendar.scrollLeft -= weekWidth; // scroll weekwidth amount of px to right
});

//BRON:https://webdesign.tutsplus.com/how-to-build-a-simple-carousel-with-vanilla-javascript--cms-41734t
