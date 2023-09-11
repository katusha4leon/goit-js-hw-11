import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';
import throttle from 'lodash.throttle';
import { Notify } from 'notiflix/build/notiflix-notify-aio';
import { fetchImages, imgPerPage } from "../src/js/search"

const form = document.getElementById('search-form');
const input = document.querySelector('input[name="searchQuery"]');
const gallery = document.querySelector('.gallery');
const checkBox = document.querySelector('.infinity-check');
const guard = document.querySelector(".js-guard");
const loadMoreBtn = document.querySelector('.load-more');
const options = {
  rootMargin: "300px",
};
const observer = new IntersectionObserver(handlerLoadMore, options);
const lightbox = new SimpleLightbox('.gallery a', {
  captionsData: 'alt',
  captionDelay: 250,
});
const STORAGE_KEY = "form-state";
const savedData = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};

let page = 0;
let searchQuery = '';
let numberOfPages = 0;

if (savedData) {
  input.value = savedData.searchQuery || '';
};

form.addEventListener('input', throttle(saveInputValue, 500));
form.addEventListener('submit', handleSubmit);
loadMoreBtn.addEventListener('click', loadMoreImages);
checkBox.addEventListener('change', InfiniteScroll);

InfiniteScroll()

function saveInputValue(event) {
  const formData = savedData;
  formData[event.target.name] = event.target.value;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
};

function handleSubmit(evt) {
  evt.preventDefault();
  searchQuery = evt.target.elements.searchQuery.value;
  page = 1;
  clearGallery();
  fetchImages(searchQuery, page).then(checkNumberOfPages).catch(errorMessage);
};

function loadMoreImages() {
  page += 1;
  fetchImages(searchQuery, page).then(checkNumberOfPages).catch(errorMessage);
  scrollPage();
  loadMoreBtn.blur();
};

function InfiniteScroll() {
  if (checkBox.checked) {
    observer.observe(guard);
    hideBtn();
  } else {
    observer.unobserve(guard);
  }
};

function handlerLoadMore(entries) {
  if (page === 0 || page === numberOfPages) {
    return;
  }
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      page += 1;
      fetchImages(searchQuery, page).then(checkNumberOfPages).catch(errorMessage);
      scrollPage();
    };
  });
};

function renderImages(hits) {
  const imageMarkup = hits
    .map( 
      hit => {
        const { largeImageURL, webformatURL, tags, likes, views, comments, downloads } = hit;
        return `
        <a href="${largeImageURL}" class="photo-card-a">
          <div class="photo-card">
          <img src="${webformatURL}" alt="${tags}" loading="lazy"/>
        <div class="info">
          <p class="info-item"><b>Likes:</b> ${likes}</p>
          <p class="info-item"><b>Views:</b> ${views}</p>
          <p class="info-item"><b>Comments:</b> ${comments}</p>
          <p class="info-item"><b>Downloads:</b> ${downloads}</p>
        </div>
        </div>
        </a>`
      })
    .join('');
  gallery.insertAdjacentHTML('beforeend', imageMarkup);
  lightbox.refresh();
};

function clearGallery() {
  gallery.innerHTML = '';
  hideBtn();
};

function scrollPage() {
  const { height: cardHeight } = gallery.firstElementChild.getBoundingClientRect();
  window.scrollBy({
    top: cardHeight,
    behavior: 'smooth',
  });
};

function hideBtn() {
  loadMoreBtn.classList.replace('is-visible', 'is-hidden');
};

function showBtn() {
  loadMoreBtn.classList.replace('is-hidden', 'is-visible');
};

const errorMessage = () => Notify.failure('Failed. Please try again.');

function checkNumberOfPages(resp) {
  const { totalHits, hits } = resp
  numberOfPages = Math.ceil(totalHits / imgPerPage);

  if (!checkBox.checked || page !== numberOfPages) { showBtn() };
 
  if (totalHits === 0) {
    Notify.failure('No images found for your request. Try again.');
    return form.reset();
  }
  
  if (page === 1) {
    Notify.success(`We found ${totalHits} images you requested.`);
  }
  
  if (page === numberOfPages) {
    observer.unobserve(guard);
    hideBtn();
    Notify.info('There are no more images');
  };

  renderImages(hits);
};
