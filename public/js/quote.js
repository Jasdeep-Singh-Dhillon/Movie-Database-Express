$(document).ready(main);

var URL = 'https://api.quotable.io/random';

async function main() {
  randomQuote();
  $('#quote').on('click', randomQuote);
}

async function fetchUrl(url) {
  let response = await fetch(url);
  let data = await response.json();
  return data;
}

async function randomQuote() {
  let quote = await fetchUrl(URL);
  $('#quote').html(`${quote.content}<br>- ${quote.author}`);
}